-- SUPABASE IMPROVEMENTS FOR ACTIVIDAD EVALUABLE 1
-- Ejecuta este script en SQL Editor de Supabase

-- 1) Asegurar estructura de profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Activo',
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2) Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3) Función segura para las políticas de administración (evita recursión en profiles)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 4) Políticas RLS
DROP POLICY IF EXISTS "Profiles: users read own" ON public.profiles;
CREATE POLICY "Profiles: users read own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: users update own" ON public.profiles;
CREATE POLICY "Profiles: users update own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: admins read all" ON public.profiles;
CREATE POLICY "Profiles: admins read all" ON public.profiles
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Profiles: admins update all" ON public.profiles;
CREATE POLICY "Profiles: admins update all" ON public.profiles
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE UPDATE ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (full_name, name, updated_at) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "Profiles: allow insert on signup" ON public.profiles;
REVOKE INSERT ON public.profiles FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede cambiar roles';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'No puedes cambiar tu propio rol desde el panel';
  END IF;

  IF new_role IS NULL OR new_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'Rol no válido';
  END IF;

  UPDATE public.profiles SET role = new_role WHERE id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el perfil del usuario';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_user_status(target_user_id UUID, new_active BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede cambiar estados';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'No puedes cambiar tu propio estado desde el panel';
  END IF;

  IF new_active IS NULL THEN
    RAISE EXCEPTION 'Estado no válido';
  END IF;

  UPDATE public.profiles
  SET active = new_active, status = CASE WHEN new_active THEN 'Activo' ELSE 'Inactivo' END
  WHERE id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el perfil del usuario';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_user_status(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_user_status(UUID, BOOLEAN) TO authenticated;

-- 5) Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, name, role, status, active, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    'user',
    'Activo',
    true,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    name = COALESCE(EXCLUDED.name, profiles.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6) Tabla opcional para actividades de usuario
CREATE TABLE IF NOT EXISTS public.user_activities (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT, INSERT ON public.user_activities TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.user_activities_id_seq TO authenticated;

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "UserActivities: own read" ON public.user_activities;
CREATE POLICY "UserActivities: own read" ON public.user_activities
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "UserActivities: own insert" ON public.user_activities;
CREATE POLICY "UserActivities: own insert" ON public.user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "UserActivities: admins all" ON public.user_activities;
CREATE POLICY "UserActivities: admins all" ON public.user_activities
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- El cliente nunca recibe una service_role key: el borrado de Auth se encapsula en esta RPC.
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede eliminar usuarios';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'No puedes eliminar tu propia cuenta desde el panel';
  END IF;

  DELETE FROM public.profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el usuario';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

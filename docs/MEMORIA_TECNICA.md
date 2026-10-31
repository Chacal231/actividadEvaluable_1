# Memoria técnica — SaaS Enterprise Dashboard

**Actividad Evaluable 1 · Desarrollo de Interfaces · 2.º DAM**

## 1. Objetivo y alcance

Aplicación de gestión construida con Ionic y Angular. Proporciona acceso diferenciado a un panel de administración y a un área personal. La interfaz incluye métricas, gráficos, gestión de perfiles, actividad reciente y generación de exportaciones. Esta memoria describe el código disponible en el repositorio y el estado de producción verificado.

## 2. Arquitectura de la aplicación

- `src/main.ts` inicializa Angular, Ionic y el router.
- `src/app/app.routes.ts` declara las rutas y carga cada pantalla bajo demanda.
- Las páginas independientes viven en `src/app/login/`, `src/app/register/`, `src/app/admin-dashboard/` y `src/app/user-dashboard/`.
- `src/app/components/` contiene componentes reutilizables, como `StatCardComponent` y `DataTableComponent`.
- `src/app/services/` separa autenticación de interfaz, acceso a datos, conexión Supabase, informes y preferencias de tema.
- Los guards de `src/app/guards/auth-guard.ts` restringen la navegación en el cliente. La autorización de datos debe imponerse también en Supabase mediante RLS y RPC; un guard de Angular no sustituye seguridad del servidor.

Las páginas se compilan como componentes standalone. Las rutas diferidas y las importaciones dinámicas del generador de PDF limitan el código descargado antes de navegar o exportar.

## 3. Tecnologías y datos

El repositorio declara Angular 22.2.x, Ionic Angular 9.x, TypeScript 6.x, Supabase JS 2.x y Chart.js 4.x. Angular 22 e Ionic 9 son las versiones instaladas en este proyecto, aunque son superiores al mínimo Angular 18+ y usan las APIs standalone del proyecto.

Supabase proporciona autenticación y acceso a tablas PostgreSQL. `src/app/services/data.ts` consulta métricas, rendimiento mensual, perfiles y actividad. `src/app/services/report.ts` propaga errores de consulta en vez de convertirlos en arrays vacíos y exporta CSV y PDF con estructura tabulada. Las modificaciones administrativas usan RPC, y `sql/supabase_improvements.sql` define, entre otras, políticas RLS y funciones administrativas.

El código revisado no integra una segunda fuente NoSQL. La versión mayor concreta de PostgreSQL tampoco está declarada en el repositorio: debe confirmarse en el panel de Supabase del proyecto configurado.

## 4. Autenticación y perfiles de prueba

`SupabaseService` utiliza el cliente público configurado en los archivos de entorno. La clave publicable no es un secreto de autorización; sus permisos deben limitarse con políticas RLS. La clave `service_role` nunca debe incorporarse al cliente. El build reemplaza el entorno de desarrollo por `environment.prod.ts`, por lo que ambos archivos deben contener la configuración adecuada antes de probar y desplegar.

Los botones de acceso rápido del login activan un modo demo local con un rol y perfiles sintéticos. `DataService` responde con fixtures en memoria y mantiene las modificaciones de demostración sin invocar Supabase; no se fabrica ni persiste ningún token. El modo demo permite recorrer la interfaz sin provocar errores por falta de sesión, pero no acredita autorización ni persistencia en el servidor. Para verificar operaciones protegidas se necesita iniciar sesión realmente en Supabase y usar un perfil de prueba con el rol apropiado. Los datos de prueba deben ser sintéticos o anonimizados.

## 5. Compilación, pruebas y calidad

Comandos de validación:

```bash
npm test -- --watch=false
npx tsc --noEmit -p tsconfig.app.json
npm run build
```

La compilación de producción escribe los activos en `www/`. Para una auditoría Lighthouse representativa, analiza la URL pública de producción y guarda la exportación/captura que solicita la actividad; la puntuación de una ruta local no acredita el resultado de todas las pantallas ni la URL de entrega.

## 6. Despliegue

`vercel.json` establece el build de producción y el fallback a `index.html` para las rutas del cliente. El flujo previsto es conectar el repositorio GitHub a Vercel, establecer `main` como rama de producción, ejecutar `npm ci` y `npm run build`, y publicar `www/`. Las ramas adicionales pueden utilizarse como previews.

URL pública: [https://actividad-evaluable-1.vercel.app](https://actividad-evaluable-1.vercel.app). Se comprobó que la página de login carga y que la ruta `/admin-dashboard` se resuelve al acceder directamente y muestra la interfaz. No se validó una sesión real de Supabase: el acceso rápido es local y, al usarlo, las consultas administrativas informan que falta la sesión de autenticación. Para acreditar los flujos de datos protegidos se necesita probar con credenciales reales de una instancia Supabase configurada.

## 7. Referencias del proyecto

- [README e instrucciones de instalación y ejecución](../README.md).
- [SQL de políticas RLS y funciones RPC](../sql/supabase_improvements.sql).
- [Documento de especificaciones y rúbrica](../Actividad%20individual%201%20-%20Individual%20-%20DI%200488_.pdf).

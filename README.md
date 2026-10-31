# SaaS Enterprise Dashboard

**Actividad Evaluable 1 · Desarrollo de Interfaces · 2.º DAM**

Aplicación web de gestión con interfaz adaptable, áreas diferenciadas para administración y usuario, métricas visuales y exportación de informes. El proyecto utiliza Ionic y Angular con componentes standalone, y Supabase para autenticación y persistencia de datos.

## Stack tecnológico

- **Ionic:** `@ionic/angular` 9.x, con componentes standalone y APIs compatibles con Ionic 8.
- **Angular:** 22.2.x (superior al mínimo Angular 18+).
- **TypeScript:** 6.x.
- **Supabase:** Supabase Auth y PostgreSQL; el script SQL del proyecto define políticas RLS y funciones RPC para operaciones administrativas.
- **Gráficos:** Chart.js 4.x.
- **Interfaz:** SCSS, Ionic Grid y componentes adaptables.
- **Informes:** exportación tabulada CSV y PDF con jsPDF.
- **Pruebas:** Vitest y Angular TestBed.

Las versiones anteriores corresponden a los manifiestos actuales del repositorio. La versión mayor de PostgreSQL depende de la instancia Supabase utilizada y debe comprobarse en su panel.

## Requisitos

- Node.js compatible con Angular 22 y npm.
- Git.
- Ionic CLI para ejecutar `ionic serve`.
- Un proyecto Supabase para probar las funciones que requieren una sesión autenticada.

## Instalación y ejecución local

```bash
git clone https://github.com/Chacal231/actividadEvaluable_1.git
cd actividadEvaluable_1
npm install
npm install --global @ionic/cli
ionic serve
```

También se puede arrancar el servidor de desarrollo con `npm start`.

Para validar la aplicación y sus pruebas:

```bash
npm test -- --watch=false
npx tsc --noEmit -p tsconfig.app.json
npm run build
```

La compilación de producción genera los archivos estáticos en `www/`.

## Configuración de Supabase

La URL del proyecto y la clave publicable se configuran en `src/environments/environment.ts` (desarrollo) y `src/environments/environment.prod.ts` (producción). Comprueba ambos archivos antes de probar la integración o desplegar.

El cliente del navegador solo debe usar una clave publicable con permisos limitados por RLS. **Nunca** incluyas una clave `service_role`, contraseñas reales ni otros secretos en los archivos del frontend o en Git. Para preparar las políticas y RPC que documenta el proyecto, revisa [sql/supabase_improvements.sql](./sql/supabase_improvements.sql) y ejecútalo únicamente tras revisar el esquema de tu propia base de datos.

## Despliegue continuo en Vercel

El repositorio contiene la configuración de compilación y el fallback de rutas SPA en [vercel.json](./vercel.json). Para conectar el proyecto o reproducir la configuración:

1. Importa este repositorio de GitHub en Vercel.
2. Deja como directorio raíz del proyecto la raíz del repositorio. Configura la instalación con `npm ci`, el comando de compilación con `npm run build` y el directorio de salida con `www`.
3. En **Settings → Git**, establece `main` como **Production Branch**. Antes del despliegue, comprueba los valores publicables de Supabase en `src/environments/environment.prod.ts`; el cliente Angular los incluye en los activos públicos generados.
4. Guarda la configuración y lanza el primer despliegue. A partir de ahí, Vercel despliega automáticamente las actualizaciones publicadas en `main`; las demás ramas pueden generar despliegues de vista previa.
5. Comprueba que `/login`, `/admin-dashboard` y `/user-dashboard` resuelven desde la URL pública. El fallback SPA evita que refrescar una ruta Angular produzca un 404.

**Despliegue publicado:** [https://actividad-evaluable-1.vercel.app](https://actividad-evaluable-1.vercel.app). La versión desplegada antes de estos últimos cambios resolvía las rutas `/login`, `/admin-dashboard` y `/user-dashboard`. Al publicar los cambios en `main`, Vercel debe desplegar la versión actualizada; verifica de nuevo esas rutas después de que finalice el despliegue. El modo demo actualizado utiliza datos sintéticos en memoria y no llama a Supabase; para validar datos protegidos hace falta una sesión real.

## Guía rápida de prueba

En la pantalla de login están disponibles los botones **Acceso rápido: Administrador** y **Acceso rápido: Usuario Estándar**. Activan un modo demo local para revisar las pantallas con datos sintéticos, incluidos perfiles, actividad, métricas y rendimiento. Los cambios hechos en modo demo solo viven en memoria y se pierden al recargar la aplicación. **No crean una sesión/token de Supabase ni sustituyen credenciales reales**; las consultas y mutaciones demo no se envían a la base de datos. El PDF de administración y el CSV se generan como tablas con la lista de usuarios visible.

Para probar autenticación y datos reales, configura Supabase, registra cuentas de prueba en ese proyecto e inicia sesión con sus credenciales. El panel administrativo requiere un perfil con rol `admin`; el alta ordinaria asigna el rol `user`. Verifica las políticas RLS antes de exponer la instancia o los datos.

Con una sesión real, el panel administrativo permite consultar métricas, filtrar y buscar perfiles, revisar actividad, cambiar roles/estados y exportar informes. El área personal presenta el perfil y la actividad de la cuenta autenticada.

## Documentación y entrega

- [Memoria técnica del proyecto](.docs/Memoria Actividad Evaluable 1 - Desarrollo de Interfaces.pdf).
- [Especificaciones y rúbrica de la actividad](./Actividad%20individual%201%20-%20Individual%20-%20DI%200488_.pdf).

La memoria técnica describe la arquitectura y configuración observables en este repositorio; no implica que exista un despliegue remoto ya conectado. La entrega final debe incluir un único ZIP con el PDF solicitado, la URL real del repositorio, la URL pública verificada, credenciales de prueba utilizables y evidencias Lighthouse de Accesibilidad y Mejores prácticas con una puntuación mínima de 90. No incluyas secretos ni datos reales de terceros en el documento de entrega.

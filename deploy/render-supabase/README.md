# Migración a Render Free y Supabase Free

Estado: conexión TLS y almacenamiento verificados. Datos iniciales importados en Supabase; publicación en Render pendiente.
El sitio de chatgpt.site sigue siendo el entorno activo.

## 1. Cuentas

- Crear la cuenta de Render en https://dashboard.render.com/register.
- Crear la cuenta de Supabase en https://supabase.com/dashboard/sign-up.
- Se puede usar el mismo GitHub para ambas. Si no existe cuenta de GitHub, crearla primero.
- El propietario debe completar los accesos, verificaciones y aceptación de términos.
- Seleccionar Free cuando se ofrezca un plan. No contratar servicios de pago.

## 2. Recursos pendientes de configurar

- Supabase: proyecto aldos-vault, contraseña de base de datos guardada por el propietario y región cercana a Render.
- PostgreSQL: conexión Session pooler compatible con IPv4 para el servidor persistente de Render. Copiar el host real desde Connect; no construirlo a mano.
- Base de datos: tablas de la aplicación en un esquema privado separado de auth y storage. No exponer contraseñas, sesiones ni pedidos mediante la Data API.
- Storage: bucket privado product-images; el servidor entrega las imágenes mediante la ruta actual /api/images/.
- Render: servicio web Node, plan Free, escucha en 0.0.0.0 y puerto PORT de la plataforma.
- Código: repositorio privado del propietario; no subir archivos .env, datos locales ni claves.

## 3. Variables del servidor

Guardar únicamente en el gestor de variables de Render. Nunca en JavaScript del navegador, repositorio ni mensajes del chat.

| Variable | Origen |
| --- | --- |
| PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD | Supabase > Connect > Session pooler; contraseña sin codificar en variable separada |
| SUPABASE_URL | URL del proyecto Supabase |
| SUPABASE_SERVER_KEY | Secret key de Supabase, acceso exclusivo del backend |
| SUPABASE_STORAGE_BUCKET | product-images |
| APP_ORIGIN | URL HTTPS real del servicio Render |
| PAYPAL_MODE | sandbox |
| PAYPAL_CLIENT_ID | Aplicación Sandbox existente |
| PAYPAL_CLIENT_SECRET | Aplicación Sandbox existente |
| ADMIN_SETUP_TOKEN | Solo si se inicia con una base vacía y se necesita activar al primer administrador |

## 4. Adaptaciones implementadas

- Adaptador PostgreSQL para la API existente: parámetros, transacciones, conflictos, min escalar, changes() y errores de integridad.
- Adaptador Supabase Storage compatible con put/get/head del almacenamiento actual.
- Servidor HTTP con HTTPS externo correcto para cookies Secure y validación de origen.
- Configuración de instalación e inicio para Render sin dependencias del alojamiento Sites.
- Suite comercial ejecutada con PGlite (motor PostgreSQL embebido): reserva concurrente, cancelación, stock, roles, sesiones y pagos idempotentes. Conexión Supabase y bucket privado verificados por separado.

Instalación: `npm --prefix deploy/render-supabase install --omit=dev`.
Inicio: `node deploy/render-supabase/server.mjs`.
Pruebas PostgreSQL (incluyendo dependencias de desarrollo): `node deploy/render-supabase/run-tests.mjs`.
El servidor usa RENDER_EXTERNAL_URL para el origen HTTPS, escucha en PORT y no guarda datos persistentes en el disco de Render.
El certificado público supabase-ca.crt proviene del enlace Download certificate de Database Settings de Supabase.

## 5. Migración y aceptación

No reemplazar el sitio activo antes de verificar el nuevo. Exportar de forma segura usuarios, categorías, productos, inventario, pedidos, líneas y encargos, junto con las imágenes subidas. Evitar copiar sesiones: los usuarios volverán a iniciar sesión. Conservar los hashes de contraseña y referencias de PayPal. Reconciliar cualquier pedido con pago en proceso antes del cambio final y evitar escrituras simultáneas en ambos sitios.

Validar registro, acceso de administrador, edición de producto, imagen persistente tras reinicio, carrito, compra Sandbox, reserva de stock y seguimiento. El esquema PostgreSQL y los adaptadores deben estar probados antes de importar datos reales.

Render Free puede suspender el proceso tras inactividad; el almacenamiento local es efímero. Supabase Free tiene límites y puede pausarse por baja actividad. La primera carga puede tardar. El subdominio onrender.com evita comprar un dominio.

Referencias: https://render.com/docs/free y https://supabase.com/docs/guides/database/connecting-to-postgres.

import type { Locale } from '@/i18n';

/**
 * In-app Terms & Privacy. metri is offline-first, so the privacy story is simple:
 * data stays on the device. This is plain-language, not legal advice — review
 * with a professional before a public store launch.
 */
const EN = `# Terms & Privacy

_Last updated: August 2026._

## Privacy

metri needs a **free account** to use the app — an email and password, or Google / GitHub. There is no payment, no card and no trial: signing up is free and stays free. We store your email and name to identify the account.

Beyond the account, metri is **offline-first**. Your profile, body metrics, reminders, training history and progress photos live **only on this device** — in a local database and local files. We do **not** sell your data.

**Cloud sync** is a Premium feature. Without Premium it **never runs** and nothing leaves your device. With Premium it is **automatic**: your training data is copied to our servers whenever the app opens or regains connection, so your other devices can read it back. There is no button and no toggle — the ring around your avatar shows the current status.

What syncs: exercises, programs, routines, workouts and set logs. What does **not**: your progress photos, your reminders, and your account password — those stay on this device (or, for the password, only ever with our authentication provider). To stop syncing, cancel Premium.

### Error reports

When the app crashes or hits an unexpected error, it sends a technical report to our error-tracking provider (Sentry) so we can find and fix the bug. A report contains the error itself, your device model and OS version, the app version, and your account id. It **never** contains your email, name, progress photos, or the content of your training data. Reports are anonymous-by-default beyond that account id, and this is off in development builds.

### Emails

While metri is in beta, we email the address on your account when a new version needs a manual install. Release announcements only — no marketing, no lists, and it ends when the app reaches the store.

### Permissions

- **Notifications** — used only to deliver the reminders you create. Optional.
- **Camera / Photos** — used only to capture the progress photos you choose to add. Images never leave your device.

You can erase everything at any time by deleting the app or clearing its storage.

## Terms

metri is provided **"as is"**, for personal fitness tracking and educational use.

The calculators and docs are **informational and not medical advice**. Consult a qualified professional before changing your training, nutrition, or supplementation. You are responsible for the data you enter and for keeping your device secure.`;

const ES = `# Términos y privacidad

_Última actualización: agosto de 2026._

## Privacidad

metri necesita una **cuenta gratuita** para usar la app — un correo y contraseña, o Google / GitHub. No hay pagos, ni tarjeta, ni periodo de prueba: registrarte es gratis y seguirá siéndolo. Guardamos tu correo y tu nombre para identificar la cuenta.

Más allá de la cuenta, metri es **offline-first**. Tu perfil, métricas corporales, recordatorios, historial de entrenamiento y fotos de progreso viven **solo en este dispositivo** — en una base de datos y archivos locales. **No** vendemos tus datos.

La **sincronización en la nube** es una función de Premium. Sin Premium **nunca se ejecuta** y nada sale de tu dispositivo. Con Premium es **automática**: tus datos de entrenamiento se copian a nuestros servidores cada vez que abres la app o recuperas conexión, para que tus otros dispositivos puedan leerlos. No hay botón ni interruptor — el anillo alrededor de tu avatar muestra el estado actual.

Qué se sincroniza: ejercicios, programas, rutinas, entrenamientos y series registradas. Qué **no**: tus fotos de progreso, tus recordatorios y tu contraseña — eso se queda en este dispositivo (o, en el caso de la contraseña, solo con nuestro proveedor de autenticación). Para dejar de sincronizar, cancela Premium.

### Reportes de errores

Cuando la app falla o encuentra un error inesperado, envía un reporte técnico a nuestro proveedor de monitoreo de errores (Sentry) para poder encontrar y corregir el bug. Un reporte contiene el error, el modelo de tu dispositivo y versión del sistema, la versión de la app y el id de tu cuenta. **Nunca** contiene tu correo, tu nombre, tus fotos de progreso ni el contenido de tus datos de entrenamiento. Más allá de ese id, los reportes son anónimos, y esto está desactivado en builds de desarrollo.

### Correos

Mientras metri está en beta, te escribimos al correo de tu cuenta cuando una nueva versión necesita instalación manual. Solo avisos de release — sin marketing, sin listas, y termina cuando la app llegue a la tienda.

### Permisos

- **Notificaciones** — solo para enviarte los recordatorios que creas. Opcional.
- **Cámara / Fotos** — solo para capturar las fotos de progreso que decidas agregar. Las imágenes nunca salen de tu dispositivo.

Puedes borrar todo en cualquier momento eliminando la app o limpiando su almacenamiento.

## Términos

metri se ofrece **"tal cual"**, para seguimiento personal de fitness y uso educativo.

Las calculadoras y los docs son **informativos y no constituyen consejo médico**. Consulta a un profesional calificado antes de cambiar tu entrenamiento, nutrición o suplementación. Eres responsable de los datos que ingresas y de mantener seguro tu dispositivo.`;

export const getLegal = (locale: Locale): string => (locale === 'es' ? ES : EN);

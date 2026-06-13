import type { Locale } from '@/i18n';

/**
 * In-app Terms & Privacy. metri is offline-first, so the privacy story is simple:
 * data stays on the device. This is plain-language, not legal advice — review
 * with a professional before a public store launch.
 */
const EN = `# Terms & Privacy

_Last updated: 2026._

## Privacy

metri is **offline-first**. Your account, profile, body metrics, reminders and progress photos are stored **only on this device** — in a local database and local files. We do **not** collect, transmit, or sell your data, and there is no account server.

If a future version adds cloud sync, it will be clearly **opt-in** and explained before you enable it.

### Permissions

- **Notifications** — used only to deliver the reminders you create. Optional.
- **Camera / Photos** — used only to capture the progress photos you choose to add. Images never leave your device.

You can erase everything at any time by deleting the app or clearing its storage.

## Terms

metri is provided **"as is"**, for personal fitness tracking and educational use.

The calculators and docs are **informational and not medical advice**. Consult a qualified professional before changing your training, nutrition, or supplementation. You are responsible for the data you enter and for keeping your device secure.`;

const ES = `# Términos y privacidad

_Última actualización: 2026._

## Privacidad

metri es **offline-first**. Tu cuenta, perfil, métricas corporales, recordatorios y fotos de progreso se guardan **solo en este dispositivo** — en una base de datos y archivos locales. **No** recopilamos, transmitimos ni vendemos tus datos, y no hay servidor de cuentas.

Si una versión futura agrega sincronización en la nube, será claramente **opcional** y se explicará antes de activarla.

### Permisos

- **Notificaciones** — solo para enviarte los recordatorios que creas. Opcional.
- **Cámara / Fotos** — solo para capturar las fotos de progreso que decidas agregar. Las imágenes nunca salen de tu dispositivo.

Puedes borrar todo en cualquier momento eliminando la app o limpiando su almacenamiento.

## Términos

metri se ofrece **"tal cual"**, para seguimiento personal de fitness y uso educativo.

Las calculadoras y los docs son **informativos y no constituyen consejo médico**. Consulta a un profesional calificado antes de cambiar tu entrenamiento, nutrición o suplementación. Eres responsable de los datos que ingresas y de mantener seguro tu dispositivo.`;

export const getLegal = (locale: Locale): string => (locale === 'es' ? ES : EN);

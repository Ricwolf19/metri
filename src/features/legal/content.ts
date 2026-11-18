import type { Locale } from '@/i18n';

/**
 * In-app Terms & Privacy. metri is offline-first, so the privacy story is simple:
 * data stays on the device. This is plain-language, not legal advice — review
 * with a professional before a public store launch.
 */
const EN = `# Terms & Privacy

_Last updated: November 2026._

## Privacy

metri is **free and open source**, and **no account is required**: local mode runs the full app with your data only on this phone — we store nothing about you at all. Exporting and importing your data is always available — no account, no Premium. A **free account** (email and password) is optional; it adds account security and restores your profile on reinstall. If you create one, we store your email and name to identify it. Creating an account later keeps everything you logged locally. There is no payment, no card and no trial for any of this.

With or without an account, metri is **offline-first**: everything you log is stored on this device first, in a local database and local files, and the app works with no connection. Without an account, **nothing ever leaves it**. We do **not** sell your data.

If you create a free account, it mirrors your **profile** so a reinstall can restore it: display name, sex, age, height, current weight, body-fat %, activity level, your saved BMR/TDEE result, and your language, units and clock preferences, plus whether you want release emails. Nothing else is sent for a free account. Once a day, the app also asks metri.info for the latest version, so it can offer the update: an anonymous request that carries no account data. Local mode never makes it.

**Cloud sync** is a Premium feature. Without Premium it **never runs** and nothing leaves your device. With Premium it is **automatic**: your training data is copied to our servers whenever the app opens or regains connection, so your other devices can read it back. There is no button and no toggle — the ring around your avatar shows the current status.

What syncs: exercises, programs, routines, workouts and set logs, training days, your per-exercise defaults and custom warm-ups, your body log — weigh-ins, tape measurements and nutrition phases with their calorie and macro targets — and your food diary with the foods you created. What does **not**: your progress photos and clips, your reminders, and your account password — those stay on this device (or, for the password, only ever with our authentication provider). To stop syncing, cancel Premium.

### Error reports

When the app crashes or hits an unexpected error, it sends a technical report to our error-tracking provider (Sentry) so we can find and fix the bug. A report contains the error itself, your device model and OS version, the app version, and your account id. It **never** contains your email, name, progress photos or clips, or the content of your training data. Reports are anonymous-by-default beyond that account id, and this is off in development builds.

### Emails

While metri is in beta, we email the address on your account (if you created one) about new versions. Release announcements only — no marketing, no lists, and it ends when the app reaches the store. They are on by default; turn them off any time in Profile. Local-mode users receive no emails — we do not have an address to write to.

### Permissions

- **Notifications** — used only to deliver the reminders you create and, with an account, one notice per new version. Optional.
- **Camera / Photos** — used only to capture the progress photos and short clips you choose to add, and to read a program's QR codes when you scan one. Clips are recorded without sound (metri never asks for the microphone). Your photos and clips are kept in metri's own storage on this device — never in your gallery, never synced, and never in a data export, which carries only their details (dates, poses, notes, clip lengths), never the images. One leaves the phone only when you share it yourself: a progress card you make, or a clip, through your phone's share sheet. Scanning frames are read on the phone and never saved or sent.
- **Sharing a program by QR code** — the codes carry only the program itself (phases, splits, exercises and prescriptions, plus any custom exercise it uses), never your sessions, weights, schedule or account. They pass from screen to camera, with no server in between.
- **PDF documents** — the body report and the program sheet are made on your phone and go only where you share or print them.
- **Health Connect (Android)** — optional. If you connect it, metri reads your steps, active energy and sleep to show them on the Metrics tab. They are read on this device when you open it, never stored, synced or sent anywhere, and metri never writes to Health Connect. Weight and body fat are not read. Remove access any time in Health Connect or with Disconnect.
- **Calendar** — optional, off until you turn it on in Notifications. metri creates a calendar of its own named "metri" on this phone and writes your next four weeks of planned training days into it; it never reads your other calendars or their events. On Android it is a local calendar that no account syncs. Turning it off deletes that calendar and everything in it.
- **Fingerprint, face or screen lock** — optional, to lock your progress photos and clips or settings. The check is your phone's own: metri only learns whether it succeeded, and never sees, stores or sends your biometrics or PIN.

You can erase everything at any time by deleting the app or clearing its storage.

## Terms

metri is provided **"as is"**, for personal fitness tracking and educational use.

The calculators and docs are **informational and not medical advice**. Consult a qualified professional before changing your training, nutrition, or supplementation. You are responsible for the data you enter and for keeping your device secure.`;

const ES = `# Términos y privacidad

_Última actualización: noviembre de 2026._

## Privacidad

metri es **gratis y open source**, y **no requiere cuenta**: el modo local ejecuta la app completa con tus datos solo en este teléfono — no guardamos absolutamente nada sobre ti. Exportar e importar tus datos está siempre disponible — sin cuenta y sin Premium. Una **cuenta gratuita** (correo y contraseña) es opcional; añade seguridad y restaura tu perfil al reinstalar. Si la creas, guardamos tu correo y tu nombre para identificarla. Crear la cuenta después conserva todo lo que registraste localmente. No hay pagos, ni tarjeta, ni periodo de prueba para nada de esto.

Con o sin cuenta, metri es **offline-first**: todo lo que registras se guarda primero en este dispositivo, en una base de datos y archivos locales, y la app funciona sin conexión. Sin cuenta, **nada sale de él**. **No** vendemos tus datos.

Si creas una cuenta gratuita, esta refleja tu **perfil** para poder restaurarlo al reinstalar: nombre, sexo, edad, estatura, peso actual, % de grasa corporal, nivel de actividad, tu resultado guardado de TMB/GET y tus preferencias de idioma, unidades y reloj, además de si quieres correos de nuevas versiones. Una cuenta gratuita no envía nada más. Una vez al día, la app también consulta a metri.info cuál es la última versión, para ofrecerte la actualización: una petición anónima que no lleva datos de tu cuenta. El modo local nunca la hace.

La **sincronización en la nube** es una función de Premium. Sin Premium **nunca se ejecuta** y nada sale de tu dispositivo. Con Premium es **automática**: tus datos de entrenamiento se copian a nuestros servidores cada vez que abres la app o recuperas conexión, para que tus otros dispositivos puedan leerlos. No hay botón ni interruptor — el anillo alrededor de tu avatar muestra el estado actual.

Qué se sincroniza: ejercicios, programas, rutinas, entrenamientos y series registradas, días de entrenamiento, tus ajustes por ejercicio y calentamientos propios, tu registro corporal — pesajes, medidas con cinta y fases de nutrición con sus objetivos de calorías y macros — y tu diario de comidas con los alimentos que creaste. Qué **no**: tus fotos y clips de progreso, tus recordatorios y tu contraseña — eso se queda en este dispositivo (o, en el caso de la contraseña, solo con nuestro proveedor de autenticación). Para dejar de sincronizar, cancela Premium.

### Reportes de errores

Cuando la app falla o encuentra un error inesperado, envía un reporte técnico a nuestro proveedor de monitoreo de errores (Sentry) para poder encontrar y corregir el bug. Un reporte contiene el error, el modelo de tu dispositivo y versión del sistema, la versión de la app y el id de tu cuenta. **Nunca** contiene tu correo, tu nombre, tus fotos ni clips de progreso ni el contenido de tus datos de entrenamiento. Más allá de ese id, los reportes son anónimos, y esto está desactivado en builds de desarrollo.

### Correos

Mientras metri está en beta, te escribimos al correo de tu cuenta (si creaste una) sobre las nuevas versiones. Solo avisos de release — sin marketing, sin listas, y termina cuando la app llegue a la tienda. Están activados por defecto; puedes desactivarlos cuando quieras en tu Perfil. En modo local no recibes correos — no tenemos dirección a la cual escribir.

### Permisos

- **Notificaciones** — solo para enviarte los recordatorios que creas y, con cuenta, un aviso por cada nueva versión. Opcional.
- **Cámara / Fotos** — solo para capturar las fotos de progreso y los clips cortos que decidas agregar y para leer los códigos QR de un programa cuando escaneas uno. Los clips se graban sin sonido (metri nunca pide el micrófono). Tus fotos y clips se guardan en el almacenamiento propio de metri en este dispositivo — nunca en tu galería, nunca se sincronizan y nunca van en una exportación de datos, que solo lleva sus datos (fechas, poses, notas, duración de los clips), nunca las imágenes. Uno sale del teléfono solo cuando tú lo compartes: una tarjeta de progreso que armes, o un clip, desde el menú para compartir de tu teléfono. Las imágenes del escaneo se leen en el teléfono y nunca se guardan ni se envían.
- **Compartir un programa por código QR** — los códigos llevan solo el programa (fases, splits, ejercicios y prescripciones, más cualquier ejercicio personalizado que use), nunca tus sesiones, pesos, horario ni cuenta. Pasan de pantalla a cámara, sin ningún servidor de por medio.
- **Documentos PDF** — el informe corporal y la hoja del programa se crean en tu teléfono y solo van adonde los compartas o imprimas.
- **Health Connect (Android)** — opcional. Si lo conectas, metri lee tus pasos, energía activa y sueño para mostrarlos en la pestaña Métricas. Se leen en este dispositivo al abrirla, nunca se guardan, sincronizan ni envían, y metri nunca escribe en Health Connect. El peso y la grasa corporal no se leen. Quita el acceso cuando quieras en Health Connect o con Desconectar.
- **Calendario** — opcional, apagado hasta que lo actives en Notificaciones. metri crea un calendario propio llamado «metri» en este teléfono y escribe ahí tus días de entreno de las próximas cuatro semanas; nunca lee tus otros calendarios ni sus eventos. En Android es un calendario local que ninguna cuenta sincroniza. Al desactivarlo se borra ese calendario con todo lo que contiene.
- **Huella, cara o bloqueo de pantalla** — opcional, para bloquear tus fotos y clips de progreso o los ajustes. La comprobación es del propio teléfono: metri solo sabe si salió bien, y nunca ve, guarda ni envía tus datos biométricos ni tu PIN.

Puedes borrar todo en cualquier momento eliminando la app o limpiando su almacenamiento.

## Términos

metri se ofrece **"tal cual"**, para seguimiento personal de fitness y uso educativo.

Las calculadoras y los docs son **informativos y no constituyen consejo médico**. Consulta a un profesional calificado antes de cambiar tu entrenamiento, nutrición o suplementación. Eres responsable de los datos que ingresas y de mantener seguro tu dispositivo.`;

export const getLegal = (locale: Locale): string => (locale === 'es' ? ES : EN);

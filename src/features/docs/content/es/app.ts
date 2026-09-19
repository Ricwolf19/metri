import type { DocSection } from '../../types';

export const app: DocSection[] = [
  {
    id: 'app-guide',
    category: 'app',
    title: 'Usar la app: módulos y consejos',
    tags: ['app', 'guía', 'inicio', 'entrenar', 'progreso', 'ajustes', 'widget'],
    body: `La app tiene cinco pestañas abajo y un perfil detrás de tu avatar. Esta guía recorre
cada una en el orden en que las vas a encontrar y termina con los pequeños hábitos que
hacen más rápido el uso diario.

## Inicio

Inicio es tu panel. Muestra la **tira semanal** (las últimas semanas como una fila de días,
con hoy resaltado) y cualquier aviso que necesite tu atención: una pregunta de recuperación
cuando un día planificado quedó sin registrar, una invitación a añadir el widget o una nota
sobre el modo local.

Debajo están los **accesos rápidos**: atajos a las herramientas que más usas. No hay
ninguno por defecto. Toca **Personalizar** para fijar calculadoras, fotos, la pantalla de
plan o lo que quieras.

## Entrenar

En Entrenar viven los programas. Los **planes listos** vienen con la app; **tus programas**
son los que construyes o importas. Un programa es un árbol:

| Nivel | Qué contiene |
| --- | --- |
| **Fase** | Un bloque de semanas con un objetivo (por ejemplo, fuerza y luego volumen) |
| **Split** | Una sesión de la semana: Empuje, Tirón, Pierna, o AM / PM |
| **Ejercicio** | Series, rango de reps, RIR objetivo, descanso |

En los editores, **mantén pulsada una fila y arrastra** para reordenar fases, splits o
ejercicios. Los cambios de estructura (añadir, borrar, reordenar) se guardan al momento;
textos y números se guardan al tocar Guardar.

Toca **Empezar** en un programa y la app lo valida primero (cada fase necesita splits, cada
split necesita ejercicios). Después te pide **un día de la semana y una hora por split**;
las fases siguientes copian la primera hasta que las cambies. Ese horario mueve tus
recordatorios y tu calendario de constancia. Solo hay un programa activo a la vez; cambiar
lo reemplaza y abandonar conserva todos los entrenamientos que registraste.

### La pantalla de entrenamiento

Cada ejercicio muestra sus series planificadas y los números de la semana pasada. En cada
serie registras **peso × reps**, opcionalmente el **RIR** que te quedó, y si llegaste al
**fallo**. Añade una serie extra cuando el plan se queda corto. Al terminar, un resumen
muestra volumen, series efectivas, duración y nuevos PR.

Tras una serie arranca el **temporizador de descanso**. Puedes sumar **+30 s**, **+1 min**
o **+2 min**, o saltarlo. En Android también publica una notificación en la pantalla de
bloqueo con **cuenta regresiva en vivo** y botones **Saltar**, **+30 s** y **+1 min**, para
que dejes el teléfono en el banco. Tocar la notificación te devuelve a la siguiente serie.
Cuando el descanso termina, la notificación cambia a "Descanso terminado".

## Progreso

El **calendario de constancia** muestra un punto por día: **lima** es que entrenaste,
**rojo** es un día planificado que faltaste, **gris** es descanso. Solo los días
planificados pueden romper una racha; los no planificados son neutros. Toca cualquier día
para abrir la **hoja de detalle** con cada serie que registraste y un botón **Compartir este
día** que genera una tarjeta para publicar o guardar. Desde esa hoja también puedes marcar
a mano un día pasado.

Progreso también sigue tu **peso corporal** (con tu BMR y TDEE de las calculadoras) y tus
**fotos de progreso**, que puedes comparar lado a lado. Las fotos se quedan en el
dispositivo.

## Explorar

Explorar reúne todas las **calculadoras** y todas las **guías**, agrupadas por tema. Busca
por nombre o por etiqueta. Las calculadoras pueden guardar su resultado en tu perfil, y así
Inicio y Progreso lo recogen.

## Perfil y ajustes

Toca tu avatar. Aquí defines:

- **Unidades**: kg o lb.
- **Reloj**: 12 o 24 horas.
- **Formato de fecha**: sistema, día/mes/año, mes/día/año, año-mes-día, mes corto o completo.
- **Apariencia**: sistema, claro u oscuro. **Idioma**: español o inglés.
- **Recordatorios y notificaciones**, un interruptor por evento: registro diario, hora de
  entrenar, pesaje, calorías. La hora de entrenar sigue el horario de tu programa activo.
- **Tu plan**: exportar e importar (con cuenta) y el prompt de IA para construir un archivo
  de importación.
- **Cuenta**: crear una, cerrar sesión o ver dónde se gestiona la contraseña.

## Consejos prácticos

- **Lo irreversible se confirma manteniendo pulsado.** Los botones de borrar, abandonar y
  descartar se van llenando mientras presionas; si sueltas antes, no pasa nada.
- **Salir de un editor con cambios** pregunta Guardar y salir, Descartar o Cancelar. Nada se
  pierde por accidente.
- **El widget de Android** muestra tu racha y la siguiente sesión en la pantalla de inicio.
  Mantén pulsada la pantalla de inicio, abre Widgets y añade metri.
- **Los recordatorios siguen el horario** que fijaste al empezar el programa. Cambia el día o
  la hora en el editor del programa y los recordatorios se mueven con él.
- **¿Dejaste una sesión abierta?** La próxima vez que vuelvas, la app te pregunta si la
  guardas como completada o la descartas.

Relacionado: [Qué significan los iconos y enlaces](/docs/app-conventions),
[Preguntas frecuentes](/docs/app-faq), [Cómo funciona un programa](/docs/how-a-program-works).`,
  },
  {
    id: 'app-conventions',
    category: 'app',
    title: 'Qué significan los iconos y enlaces',
    tags: ['app', 'iconos', 'interfaz', 'convenciones', 'colores'],
    body: `La app usa un conjunto pequeño de señales visuales y las respeta en todas partes. Una
vez que las conoces, no tienes que adivinar qué hace un toque.

## Botones y enlaces

| Señal | Significado |
| --- | --- |
| **Botón lima** | La única acción principal de esa pantalla. Nunca hay más de una. |
| **Texto lima subrayado** | Conocimiento que se puede tocar: "Leer más", "Leer la guía". Abre una guía. |
| **Botón rojo de mantener pulsado** | Irreversible. Mantén hasta que el relleno se complete; suelta antes para cancelar. |
| **Botón con borde o gris** | Acción secundaria: cancelar, saltar, editar. |
| **Leer más después de "…"** | El texto largo se recorta. Toca para expandirlo ahí mismo o abrir la guía completa. |

## La barra superior

| Icono | Significado |
| --- | --- |
| **Libro** | Abre la guía de la pantalla en la que estás. |
| **Signo de interrogación** | Respuestas rápidas y el botón Enviar comentarios. |
| **Matraz** | Estás en la versión beta. Toca para ver qué hay de nuevo. |
| **Anillo alrededor del avatar** | Estado de la sincronización. Solo aparece con Premium. |

Colores del anillo: **verde** es que todo está respaldado, **azul** es que está
sincronizando ahora, **gris** es sin conexión con cambios en cola, **rojo** es que la última
sincronización falló. Toca el avatar para ver detalles y actividad reciente.

## Calendario y tira semanal

| Color | Significado |
| --- | --- |
| **Lima** | Entrenaste ese día. |
| **Rojo** | Un día de entrenamiento planificado que no registraste. |
| **Gris** | Día de descanso, planificado o marcado por ti. |
| **Vacío** | Nada registrado. Los días no planificados nunca cuentan en tu contra. |

Toca cualquier día para abrir su hoja de detalle.

## Señales de diseño

| Elemento | Significado |
| --- | --- |
| **Etiqueta pequeña en mayúsculas y monoespaciada** | Encabezado de sección. Agrupa las tarjetas de abajo. |
| **Chips** | Filtros o etiquetas: días de la semana, grupos musculares, equipamiento. Toca para alternar. |
| **Asa de arrastre en una hoja inferior** | Arrastra hacia abajo para cerrar; toca para expandir. |
| **Asa de arrastre en una fila de lista** | Mantén pulsada la fila y arrastra para reordenar. |
| **Chevron en el borde de una lista** | Hay más; desplázate para verlo. |
| **Aviso en la parte inferior** | Confirmación de guardar, borrar, empezar o abandonar. Desaparece solo. |

## Movimiento

Nada rebota. Los diálogos se desvanecen, las hojas suben brevemente, la respuesta al toque
es inmediata. Si algo se anima más que un parpadeo, te está pidiendo que esperes (por
ejemplo, mientras se guarda un entrenamiento).

Relacionado: [Usar la app: módulos y consejos](/docs/app-guide),
[Preguntas frecuentes](/docs/app-faq).`,
  },
  {
    id: 'app-faq',
    category: 'app',
    title: 'Preguntas frecuentes',
    tags: ['app', 'faq', 'planes', 'premium', 'sin conexión', 'datos', 'comentarios'],
    body: `Respuestas cortas a las preguntas que más se repiten. Para un recorrido por cada
pantalla, lee [Usar la app: módulos y consejos](/docs/app-guide).

## Web y app

**¿Cuál es la diferencia entre metri.info y la app?**
La web tiene todas las calculadoras y guías, gratis y sin registro, más tu cuenta opcional
(correo, contraseña, plan). La app es para el entrenamiento diario: registrar series, el
temporizador de descanso, el calendario de constancia, fotos de progreso y recordatorios.
Una sola cuenta sirve en las dos.

**¿La app funciona sin conexión?**
Sí, por completo. La base de datos vive en tu teléfono y cada pantalla lee de ahí. La
sincronización, cuando la tienes, corre en segundo plano cada vez que hay conexión.

## Planes

**¿Qué incluye el plan gratis?**
Todo: programas, registro, calculadoras, guías, calendario, fotos, recordatorios. No hace
falta cuenta. Una cuenta gratis añade exportar/importar y restaura tu perfil si reinstalas.

**¿Qué añade Premium?**
Sincronización y respaldo automáticos en la nube, para que tu entrenamiento esté seguro e
idéntico en todos tus dispositivos. Necesita una cuenta gratis primero. Durante la beta, el
acceso se concede a petición.

**Empecé sin cuenta. ¿Puedo crear una después?**
Sí. Al iniciar sesión, la app adopta el perfil local que ya tienes; no se copia ni se
duplica nada.

## Tus datos

**¿Dónde viven mis datos y qué sale del dispositivo?**
Todo se guarda en el teléfono. Sin Premium, nada sale de él. Con Premium, tus datos de
entrenamiento (programas, sesiones, series, constancia, métricas corporales) se sincronizan
con tu cuenta. Las fotos y los recordatorios nunca salen del dispositivo en ningún modo. Los
reportes de error llevan solo un id de cuenta, nunca datos personales.

**¿Cómo funcionan exportar e importar?**
Exportar crea un archivo JSON con tus programas, sesiones, series e historial de constancia.
Importar lee ese archivo y añade sus filas a tu cuenta con ids nuevos, así que importar el
mismo archivo dos veces lo duplica. Los dos necesitan una cuenta gratis. El **prompt de IA**
de la misma pantalla es un texto listo: pégalo en cualquier asistente, describe tu historial
de entrenamiento y te devuelve un archivo de importación válido.

**¿Qué significa el anillo alrededor de mi avatar?**
Es el indicador de sincronización y solo aparece con Premium. Verde es respaldado, azul es
sincronizando, gris es sin conexión con cambios en cola, rojo es que la última
sincronización falló. Toca el avatar para ver detalles. Fuera de eso, los fallos de
sincronización son silenciosos a propósito.

## La versión beta

**¿Por qué un APK y no la Play Store?**
metri está en beta abierta. Distribuir el APK directamente permite que las actualizaciones
te lleguen el mismo día sin pasar por la revisión de la tienda, y la mayoría llegan por
aire sin reinstalar.

**¿Por qué no hay versión para iOS?**
Apple exige TestFlight para las betas y ese paso aún no está preparado. El código ya corre
en iOS, así que llegará cuando la beta se estabilice.

## Uso diario

**¿Cómo se comportan las notificaciones de descanso con el teléfono bloqueado?**
En Android, el temporizador publica una notificación con cuenta regresiva en vivo dibujada
por el sistema, así que sigue corriendo con la app en segundo plano o la pantalla apagada.
Tiene botones **Saltar**, **+30 s** y **+1 min** que funcionan desde la pantalla de
bloqueo, y tocarla te devuelve a la siguiente serie. Cuando se acaba el tiempo, cambia a
"Descanso terminado".

**¿Cómo cambio el idioma, el formato de fecha o el de reloj?**
Abre tu perfil desde el avatar. Idioma, Apariencia, Formato de hora y Formato de fecha
están ahí y se aplican al instante.

**¿Cómo envío comentarios?**
Abre las respuestas rápidas (el signo de interrogación de la barra superior) y toca
**Enviar comentarios**. Llega directo al equipo y define lo que sigue.

Relacionado: [Qué significan los iconos y enlaces](/docs/app-conventions),
[¿Qué es metri?](/docs/welcome).`,
  },
];

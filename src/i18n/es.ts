import type { TranslationKey } from './en';

/** Spanish strings. Must cover every key in `en`. */
export const es: Record<TranslationKey, string> = {
  // Common
  'common.continue': 'Continuar',
  'common.save': 'Guardar',
  'common.saveChanges': 'Guardar cambios',
  'common.cancel': 'Cancelar',
  'common.back': 'Atrás',
  'common.skip': 'Omitir',
  'common.required': 'Requerido',

  // Languages
  'lang.en': 'Inglés',
  'lang.es': 'Español',

  // Units
  'units.metric': 'Métrico',
  'units.imperial': 'Imperial',

  // Auth — sign in
  'auth.welcomeBack': 'Bienvenido de nuevo',
  'auth.signInSubtitle': 'Inicia sesión en tu cuenta local de Metri.',
  'auth.identifier': 'Correo o usuario',
  'auth.password': 'Contraseña',
  'auth.signIn': 'Iniciar sesión',
  'auth.newHere': '¿Nuevo aquí?',
  'auth.createAccount': 'Crea una cuenta',
  'auth.errEnterCreds': 'Ingresa tu correo/usuario y contraseña.',
  'auth.errSignIn': 'Correo/usuario o contraseña incorrectos.',
  'auth.welcomeToast': 'Bienvenido de nuevo',

  // Auth — sign up
  'auth.createTitle': 'Crear cuenta',
  'auth.localSubtitle': 'Tus datos se quedan en este dispositivo',
  'auth.name': 'Nombre',
  'auth.email': 'Correo',
  'auth.username': 'Usuario',
  'auth.usernameHint': 'Minúsculas, al menos 3 caracteres.',
  'auth.confirmPassword': 'Confirmar contraseña',
  'auth.passwordMin': 'Al menos 6 caracteres',
  'auth.passwordRepeat': 'Repite tu contraseña',
  'auth.alreadyHave': '¿Ya tienes una cuenta?',
  'auth.errName': 'Dinos tu nombre.',
  'auth.errEmail': 'Ingresa un correo válido.',
  'auth.errUsername': 'El usuario necesita al menos 3 caracteres.',
  'auth.errPassword': 'La contraseña necesita al menos 6 caracteres.',
  'auth.errMismatch': 'Las contraseñas no coinciden.',
  'auth.createCta': 'Crear cuenta',
  'auth.createdToast': 'Cuenta creada',

  // Tabs
  'tab.home': 'Inicio',
  'tab.tools': 'Herramientas',
  'tab.profile': 'Perfil',
  'tab.admin': 'Admin',

  // Home
  'home.greeting': 'Hola, {name}',
  'home.lifter': 'atleta',
  'home.subtitle': 'Tu panel local',
  'home.energy': 'Gasto energético',
  'home.bmr': 'TMB',
  'home.tdee': 'GET',
  'home.kcalDay': 'kcal/día',
  'home.noMetrics': 'Aún sin métricas',
  'home.noMetricsBody': 'Calcula tu tasa metabólica basal para llenar tu panel.',
  'home.openBmr': 'Abrir la calculadora de TMB',
  'home.quickActions': 'Acciones rápidas',
  'home.hbTitle': 'Calculadora Harris–Benedict',
  'home.hbSubtitle': 'Estima TMB y calorías diarias en segundos.',

  // Tools
  'tools.title': 'Herramientas',
  'tools.subtitle': 'Calculadoras rápidas para el gym',
  'tools.hbTitle': 'Harris–Benedict',
  'tools.hbDesc': 'Tasa metabólica basal y gasto energético total diario.',
  'tools.comingSoon': 'Más herramientas pronto.',

  // BMR calculator
  'bmr.title': 'Harris–Benedict',
  'bmr.subtitle': 'Tasa metabólica basal',
  'bmr.prompt': 'Ingresa tus datos para ver tu TMB y calorías diarias.',
  'bmr.sex': 'Sexo',
  'bmr.male': 'Hombre',
  'bmr.female': 'Mujer',
  'bmr.age': 'Edad',
  'bmr.heightCm': 'Altura (cm)',
  'bmr.weight': 'Peso',
  'bmr.activity': 'Nivel de actividad',
  'bmr.formula': 'Fórmula',
  'bmr.explainer':
    'La TMB es la energía que tu cuerpo quema en reposo. El GET la multiplica por tu nivel de actividad para estimar las calorías diarias de mantenimiento.',
  'bmr.save': 'Guardar en mi perfil',
  'bmr.savedToast': 'Guardado en tu perfil',
  'bmr.fillValid': 'Primero ingresa valores válidos.',

  // Activity levels
  'activity.sedentary': 'Sedentario',
  'activity.light': 'Ligero',
  'activity.moderate': 'Moderado',
  'activity.active': 'Activo',
  'activity.very_active': 'Muy activo',
  'activityHint.sedentary': 'Poco o nada de ejercicio',
  'activityHint.light': 'Ejercicio 1–3 días/semana',
  'activityHint.moderate': 'Ejercicio 3–5 días/semana',
  'activityHint.active': 'Ejercicio 6–7 días/semana',
  'activityHint.very_active': 'Entrenamiento diario intenso / trabajo físico',

  // Profile
  'profile.title': 'Perfil',
  'profile.account': 'Cuenta',
  'profile.displayName': 'Nombre visible',
  'profile.avatarColor': 'Color de avatar',
  'profile.editAccount': 'Editar cuenta',
  'profile.changePassword': 'Cambiar contraseña',
  'profile.currentPassword': 'Contraseña actual',
  'profile.newPassword': 'Nueva contraseña',
  'profile.updatePassword': 'Actualizar contraseña',
  'profile.bodyMetrics': 'Métricas corporales',
  'profile.sex': 'Sexo',
  'profile.age': 'Edad',
  'profile.height': 'Altura',
  'profile.weight': 'Peso',
  'profile.activity': 'Actividad',
  'profile.noMetricsSaved': 'Aún no hay métricas. Usa la calculadora de TMB para llenarlas.',
  'profile.addMetrics': 'Agregar métricas',
  'profile.updateViaCalc': 'Actualizar con la calculadora',
  'profile.adminPanel': 'Panel de admin',
  'profile.adminPanelDesc': 'Solo para cuentas de administrador.',
  'profile.signOut': 'Cerrar sesión',
  'profile.language': 'Idioma',
  'profile.updatedToast': 'Perfil actualizado',
  'profile.accountUpdatedToast': 'Cuenta actualizada',
  'profile.passwordUpdatedToast': 'Contraseña actualizada',
  'profile.errNameEmpty': 'El nombre no puede estar vacío.',
  'profile.errCurrentPassword': 'La contraseña actual es incorrecta.',

  // Admin
  'admin.title': 'Admin',
  'admin.subtitle': 'Área restringida',
  'admin.accessGranted': 'Acceso concedido',
  'admin.signedInAs': 'Has iniciado sesión como {username} con el rol de administrador.',
  'admin.registeredAccounts': 'Cuentas registradas',
  'admin.userMgmtSoon': 'La gestión de usuarios llegará con la sincronización en la nube.',

  // Onboarding
  'onb.welcome': 'Bienvenido a Metri',
  'onb.subtitle': 'Configuremos lo básico. Puedes cambiar todo esto después.',
  'onb.language': 'Idioma',
  'onb.units': 'Unidades',
  'onb.aboutYou': 'Sobre ti',
  'onb.aboutYouHint': 'Se usa para pre-llenar calculadoras. Opcional — puedes omitir.',
  'onb.finish': 'Finalizar',
  'onb.savedToast': 'Todo listo',
};

/**
 * English strings — the source of truth for translation keys.
 * `es.ts` must provide the same keys. Use `{name}`-style placeholders for
 * interpolation (see `t()` in `./index`).
 */
export const en = {
  // Common
  'common.continue': 'Continue',
  'common.save': 'Save',
  'common.saveChanges': 'Save changes',
  'common.cancel': 'Cancel',
  'common.back': 'Back',
  'common.skip': 'Skip',
  'common.required': 'Required',

  // Languages
  'lang.en': 'English',
  'lang.es': 'Spanish',

  // Units
  'units.metric': 'Metric',
  'units.imperial': 'Imperial',

  // Auth — sign in
  'auth.welcomeBack': 'Welcome back',
  'auth.signInSubtitle': 'Sign in to your local Metri account.',
  'auth.identifier': 'Email or username',
  'auth.password': 'Password',
  'auth.signIn': 'Sign in',
  'auth.newHere': 'New here?',
  'auth.createAccount': 'Create an account',
  'auth.errEnterCreds': 'Enter your email/username and password.',
  'auth.errSignIn': 'Wrong email/username or password.',
  'auth.welcomeToast': 'Welcome back',

  // Auth — sign up
  'auth.createTitle': 'Create account',
  'auth.localSubtitle': 'Your data stays on this device',
  'auth.name': 'Name',
  'auth.email': 'Email',
  'auth.username': 'Username',
  'auth.usernameHint': 'Lowercase, at least 3 characters.',
  'auth.confirmPassword': 'Confirm password',
  'auth.passwordMin': 'At least 6 characters',
  'auth.passwordRepeat': 'Repeat your password',
  'auth.alreadyHave': 'Already have an account?',
  'auth.errName': 'Tell us your name.',
  'auth.errEmail': 'Enter a valid email.',
  'auth.errUsername': 'Username needs at least 3 characters.',
  'auth.errPassword': 'Password needs at least 6 characters.',
  'auth.errMismatch': 'Passwords do not match.',
  'auth.createCta': 'Create account',
  'auth.createdToast': 'Account created',

  // Tabs
  'tab.home': 'Home',
  'tab.tools': 'Tools',
  'tab.profile': 'Profile',
  'tab.admin': 'Admin',

  // Home
  'home.greeting': 'Hi, {name}',
  'home.lifter': 'lifter',
  'home.subtitle': 'Your local dashboard',
  'home.energy': 'Energy expenditure',
  'home.bmr': 'BMR',
  'home.tdee': 'TDEE',
  'home.kcalDay': 'kcal/day',
  'home.noMetrics': 'No metrics yet',
  'home.noMetricsBody': 'Calculate your basal metabolic rate to populate your dashboard.',
  'home.openBmr': 'Open the BMR calculator',
  'home.quickActions': 'Quick actions',
  'home.hbTitle': 'Harris–Benedict calculator',
  'home.hbSubtitle': 'Estimate BMR & daily calories in seconds.',

  // Tools
  'tools.title': 'Tools',
  'tools.subtitle': 'Fast calculators for the gym',
  'tools.hbTitle': 'Harris–Benedict',
  'tools.hbDesc': 'Basal metabolic rate & total daily energy expenditure.',
  'tools.comingSoon': 'More tools coming soon.',

  // BMR calculator
  'bmr.title': 'Harris–Benedict',
  'bmr.subtitle': 'Basal metabolic rate',
  'bmr.prompt': 'Enter your details below to see your BMR & daily calories.',
  'bmr.sex': 'Sex',
  'bmr.male': 'Male',
  'bmr.female': 'Female',
  'bmr.age': 'Age',
  'bmr.heightCm': 'Height (cm)',
  'bmr.weight': 'Weight',
  'bmr.activity': 'Activity level',
  'bmr.formula': 'Formula',
  'bmr.explainer':
    'BMR is the energy your body burns at rest. TDEE multiplies it by your activity level for an estimate of daily calories to maintain weight.',
  'bmr.save': 'Save to my profile',
  'bmr.savedToast': 'Saved to your profile',
  'bmr.fillValid': 'Fill in valid values first.',

  // Activity levels
  'activity.sedentary': 'Sedentary',
  'activity.light': 'Light',
  'activity.moderate': 'Moderate',
  'activity.active': 'Active',
  'activity.very_active': 'Very active',
  'activityHint.sedentary': 'Little or no exercise',
  'activityHint.light': 'Exercise 1–3 days/week',
  'activityHint.moderate': 'Exercise 3–5 days/week',
  'activityHint.active': 'Exercise 6–7 days/week',
  'activityHint.very_active': 'Hard daily training / physical job',

  // Profile
  'profile.title': 'Profile',
  'profile.account': 'Account',
  'profile.displayName': 'Display name',
  'profile.avatarColor': 'Avatar color',
  'profile.editAccount': 'Edit account',
  'profile.changePassword': 'Change password',
  'profile.currentPassword': 'Current password',
  'profile.newPassword': 'New password',
  'profile.updatePassword': 'Update password',
  'profile.bodyMetrics': 'Body metrics',
  'profile.sex': 'Sex',
  'profile.age': 'Age',
  'profile.height': 'Height',
  'profile.weight': 'Weight',
  'profile.activity': 'Activity',
  'profile.noMetricsSaved': 'No metrics saved yet. Run the BMR calculator to fill these in.',
  'profile.addMetrics': 'Add metrics',
  'profile.updateViaCalc': 'Update via calculator',
  'profile.adminPanel': 'Admin panel',
  'profile.adminPanelDesc': 'Restricted to admin accounts.',
  'profile.signOut': 'Sign out',
  'profile.language': 'Language',
  'profile.updatedToast': 'Profile updated',
  'profile.accountUpdatedToast': 'Account updated',
  'profile.passwordUpdatedToast': 'Password updated',
  'profile.errNameEmpty': 'Name cannot be empty.',
  'profile.errCurrentPassword': 'Current password is incorrect.',

  // Admin
  'admin.title': 'Admin',
  'admin.subtitle': 'Restricted area',
  'admin.accessGranted': 'Access granted',
  'admin.signedInAs': 'You are signed in as {username} with the admin role.',
  'admin.registeredAccounts': 'Registered accounts',
  'admin.userMgmtSoon': 'User management lands when cloud sync is wired up.',

  // Onboarding
  'onb.welcome': 'Welcome to Metri',
  'onb.subtitle': "Let's set things up. You can change all of this later.",
  'onb.language': 'Language',
  'onb.units': 'Units',
  'onb.aboutYou': 'About you',
  'onb.aboutYouHint': 'Used to pre-fill calculators. Optional — you can skip.',
  'onb.finish': 'Finish setup',
  'onb.savedToast': 'All set',
} as const;

export type TranslationKey = keyof typeof en;

export type Language = "it" | "en";

const translations = {
  // ── Navigation ──
  "nav.dashboard": { it: "Dashboard", en: "Dashboard" },
  "nav.meals": { it: "Pasti", en: "Meals" },
  "nav.workouts": { it: "Allenamenti", en: "Workouts" },
  "nav.stats": { it: "Statistiche", en: "Statistics" },
  "nav.settings": { it: "Impostazioni", en: "Settings" },
  "nav.assistant": { it: "Assistente", en: "Assistant" },
  "nav.home": { it: "Home", en: "Home" },
  "nav.workoutsShort": { it: "Allenam.", en: "Workouts" },
  "nav.settingsShort": { it: "Impostaz.", en: "Settings" },
  "nav.logout": { it: "Esci", en: "Logout" },
  "nav.user": { it: "Utente", en: "User" },

  // ── Settings page ──
  "settings.title": { it: "Impostazioni", en: "Settings" },

  // Account
  "settings.account": { it: "Account", en: "Account" },
  "settings.email": { it: "Email", en: "Email" },
  "settings.emailNotSet": { it: "Non impostata", en: "Not set" },
  "settings.password": { it: "Password", en: "Password" },
  "settings.changePassword": { it: "Cambio Password", en: "Change Password" },
  "settings.cancel": { it: "Annulla", en: "Cancel" },
  "settings.newPassword": { it: "Nuova password", en: "New password" },
  "settings.confirmPassword": { it: "Conferma password", en: "Confirm password" },
  "settings.passwordMismatch": { it: "Le password non corrispondono", en: "Passwords don't match" },
  "settings.passwordTooShort": { it: "La password deve essere di almeno 6 caratteri", en: "Password must be at least 6 characters" },
  "settings.passwordUpdated": { it: "Password aggiornata con successo", en: "Password updated successfully" },
  "settings.passwordError": { it: "Errore durante l'aggiornamento", en: "Error during update" },
  "settings.updatePassword": { it: "Aggiorna Password", en: "Update Password" },
  "settings.updating": { it: "Aggiornamento...", en: "Updating..." },

  // Telegram
  "settings.telegram": { it: "Telegram", en: "Telegram" },
  "settings.unlink": { it: "Scollega", en: "Unlink" },
  "settings.link": { it: "Collega", en: "Link" },
  "settings.telegramInvalid": { it: "ID Telegram non valido", en: "Invalid Telegram ID" },
  "settings.telegramLinked": { it: "Telegram collegato con successo", en: "Telegram linked successfully" },
  "settings.telegramLinkError": { it: "Errore durante il collegamento", en: "Error linking Telegram" },
  "settings.telegramUnlinked": { it: "Telegram scollegato", en: "Telegram unlinked" },
  "settings.telegramUnlinkError": { it: "Errore durante lo scollegamento", en: "Error unlinking Telegram" },

  // Profile
  "settings.profile": { it: "Profilo", en: "Profile" },
  "settings.name": { it: "Nome", en: "Name" },
  "settings.username": { it: "Username", en: "Username" },

  // Goals
  "settings.goals": { it: "Obiettivi", en: "Goals" },
  "settings.calorieGoal": { it: "Obiettivo calorie", en: "Calorie goal" },
  "settings.waterGoal": { it: "Obiettivo acqua", en: "Water goal" },
  "settings.waterGoalDesc": { it: "Consumo giornaliero target", en: "Daily target consumption" },
  "settings.trackingMode": { it: "Modalita tracciamento", en: "Tracking mode" },
  "settings.trackingModeDesc": { it: "Bicchieri o millilitri", en: "Glasses or milliliters" },
  "settings.glasses": { it: "Bicchieri", en: "Glasses" },
  "settings.weightGoal": { it: "Peso obiettivo", en: "Weight goal" },
  "settings.weightGoalDesc": { it: "Il tuo peso target", en: "Your target weight" },
  "settings.notSet": { it: "Non impostato", en: "Not set" },
  "settings.height": { it: "Altezza", en: "Height" },
  "settings.heightDesc": { it: "Per il calcolo del BMI", en: "For BMI calculation" },
  "settings.save": { it: "Salva", en: "Save" },
  "settings.saved": { it: "Salvato", en: "Saved" },
  "settings.saving": { it: "...", en: "..." },

  // Personalization
  "settings.personalization": { it: "Personalizzazione", en: "Personalization" },
  "settings.accentColor": { it: "Colore accento", en: "Accent color" },
  "settings.layout": { it: "Layout", en: "Layout" },
  "settings.layoutDesc": { it: "Compatto o espanso", en: "Compact or expanded" },
  "settings.compact": { it: "Compatto", en: "Compact" },
  "settings.expanded": { it: "Espanso", en: "Expanded" },
  "settings.sectionOrder": { it: "Ordine sezioni dashboard", en: "Dashboard section order" },
  "settings.preview": { it: "Anteprima", en: "Preview" },

  // Section labels
  "section.greeting": { it: "Saluto", en: "Greeting" },
  "section.quickadd": { it: "Azioni rapide", en: "Quick actions" },
  "section.calories": { it: "Calorie e Macro", en: "Calories & Macros" },
  "section.waterStreak": { it: "Acqua e Streak", en: "Water & Streak" },
  "section.weight": { it: "Peso", en: "Weight" },
  "section.meals": { it: "Pasti", en: "Meals" },
  "section.workouts": { it: "Allenamenti", en: "Workouts" },

  // Appearance
  "settings.appearance": { it: "Aspetto", en: "Appearance" },
  "settings.theme": { it: "Tema", en: "Theme" },
  "settings.themeDark": { it: "Scuro", en: "Dark" },
  "settings.themeLight": { it: "Chiaro", en: "Light" },
  "settings.themeAuto": { it: "Auto", en: "Auto" },
  "settings.language": { it: "Lingua", en: "Language" },
  "settings.langIt": { it: "Italiano", en: "Italiano" },
  "settings.langEn": { it: "English", en: "English" },
  "settings.units": { it: "Unita di misura", en: "Units" },
  "settings.metric": { it: "Metrico (kg/cm)", en: "Metric (kg/cm)" },
  "settings.imperial": { it: "Imperiale (lbs/in)", en: "Imperial (lbs/in)" },

  // Notifications
  "settings.notifications": { it: "Notifiche", en: "Notifications" },
  "settings.notificationsActive": { it: "Notifiche attive", en: "Notifications active" },
  "settings.notificationsOff": { it: "Notifiche disattivate", en: "Notifications disabled" },
  "settings.notificationsDesc": { it: "Ricevi promemoria e aggiornamenti", en: "Receive reminders and updates" },

  // Data management
  "settings.dataManagement": { it: "Gestione Dati", en: "Data Management" },
  "settings.resetMeals": { it: "Azzera dati dieta", en: "Reset diet data" },
  "settings.resetMealsDesc": { it: "Elimina tutti i pasti registrati", en: "Delete all recorded meals" },
  "settings.resetWorkouts": { it: "Azzera dati allenamento", en: "Reset workout data" },
  "settings.resetWorkoutsDesc": { it: "Elimina tutti gli allenamenti registrati", en: "Delete all recorded workouts" },
  "settings.resetAll": { it: "Azzera tutti i dati", en: "Reset all data" },
  "settings.resetAllDesc": { it: "Elimina TUTTI i dati (pasti, allenamenti, acqua, peso)", en: "Delete ALL data (meals, workouts, water, weight)" },
  "settings.reset": { it: "Azzera", en: "Reset" },
  "settings.resetAllBtn": { it: "Azzera tutto", en: "Reset all" },
  "settings.exportData": { it: "Esporta Dati", en: "Export Data" },
  "settings.exportDataDesc": { it: "Scarica tutti i tuoi dati", en: "Download all your data" },
  "settings.export": { it: "Esporta", en: "Export" },
  "settings.logoutBtn": { it: "Esci dall'account", en: "Log out" },

  // Reset modals
  "settings.resetMealsTitle": { it: "Azzera dati dieta", en: "Reset diet data" },
  "settings.resetMealsMsg": { it: "Tutti i pasti registrati verranno eliminati. Questa azione è irreversibile.", en: "All recorded meals will be deleted. This action is irreversible." },
  "settings.resetMealsConfirm": { it: "Azzera dieta", en: "Reset diet" },
  "settings.resetWorkoutsTitle": { it: "Azzera dati allenamento", en: "Reset workout data" },
  "settings.resetWorkoutsMsg": { it: "Tutti gli allenamenti registrati verranno eliminati. Questa azione è irreversibile.", en: "All recorded workouts will be deleted. This action is irreversible." },
  "settings.resetWorkoutsConfirm": { it: "Azzera allenamenti", en: "Reset workouts" },
  "settings.resetAllTitle": { it: "Azzera tutti i dati", en: "Reset all data" },
  "settings.resetAllMsg": { it: "Questa azione eliminera TUTTI i tuoi dati: pasti, allenamenti, acqua e peso. Non sara possibile recuperarli.", en: "This action will delete ALL your data: meals, workouts, water, and weight. Recovery is not possible." },
  "settings.resetAllType": { it: "Digita", en: "Type" },
  "settings.resetAllToProceed": { it: "per procedere:", en: "to proceed:" },
  "settings.deleteAll": { it: "Elimina tutto", en: "Delete all" },
  "settings.resetSuccessMeals": { it: "Dati dieta azzerati", en: "Diet data reset" },
  "settings.resetSuccessWorkouts": { it: "Dati allenamento azzerati", en: "Workout data reset" },
  "settings.resetSuccessAll": { it: "Tutti i dati azzerati", en: "All data reset" },
  "settings.resetError": { it: "Errore durante l'eliminazione", en: "Error during deletion" },

  // Save errors
  "error.saveGoal": { it: "Errore nel salvare l'obiettivo calorie", en: "Error saving calorie goal" },
  "error.saveSetting": { it: "Errore nel salvare l'impostazione", en: "Error saving setting" },
  "error.connection": { it: "Errore di connessione. Riprova.", en: "Connection error. Try again." },
  "error.savePreference": { it: "Errore nel salvare la personalizzazione", en: "Error saving preference" },

  // Dashboard
  "dashboard.todaysMeals": { it: "Pasti di oggi", en: "Today's meals" },
  "dashboard.viewAll": { it: "Vedi tutti", en: "View all" },
  "dashboard.todaysWorkouts": { it: "Allenamenti di oggi", en: "Today's workouts" },

  // Chat
  "chat.title": { it: "Assistente ViTrack", en: "ViTrack Assistant" },
  "chat.subtitle": { it: "Stessa chat di Telegram", en: "Same chat as Telegram" },
  "chat.placeholder": { it: "Scrivi un messaggio...", en: "Write a message..." },
  "chat.emptyTitle": { it: "Scrivi cosa hai mangiato o il tuo allenamento", en: "Write what you ate or your workout" },
  "chat.emptySubtitle": { it: "I messaggi da Telegram appariranno qui", en: "Messages from Telegram will appear here" },
  "chat.error": { it: "Errore nella comunicazione. Riprova.", en: "Communication error. Try again." },
  "chat.networkError": { it: "Errore di rete. Controlla la connessione.", en: "Network error. Check your connection." },
  "chat.viaTelegram": { it: "via Telegram", en: "via Telegram" },
} as const;

export type TranslationKey = keyof typeof translations;

export function getTranslation(key: TranslationKey, lang: Language): string {
  const entry = translations[key];
  return entry?.[lang] ?? entry?.it ?? key;
}

export default translations;

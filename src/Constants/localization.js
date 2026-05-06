// SAHAYYA LOCALIZATION MOCK (TO KILL 'S' CRASH)
// This replaces the library dependency with a pure JS object.

const translations = {
  en: {
    Home: { Home: 'Home', Good_morn: 'Good Morning!', sunrise: 'Sunrise', sunset: 'Sunset', today_pan: 'Today Panchang', calandar: 'Calendar', upcoming: 'Upcoming Festivals', tips: 'Tip of the Day' },
    // ... adding basic keys to prevent early crashes
  }
};

class LocalizationMock {
  constructor(props) {
    this.props = props;
    this.language = 'en';
  }
  setLanguage(l) { this.language = l; }
  getInterfaceLanguage() { return 'en'; }
}

// We create a proxy that always returns something even if the key is missing
const safeTranslations = new Proxy(translations, {
  get(target, lang) {
    const section = target[lang] || target['en'];
    return new Proxy(section, {
      get(t, key) {
        return t[key] || key; // Return the key itself if translation is missing
      }
    });
  }
});

const localization = new LocalizationMock(safeTranslations);

// Manually adding the translation proxy to the localization object
Object.assign(localization, translations.en);

export default localization;

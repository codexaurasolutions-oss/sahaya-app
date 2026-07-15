/* eslint-env jest */

require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-localization', () =>
  class LocalizedStrings {
    constructor(translations) {
      this.translations = translations;
      this.language = 'en';
      Object.assign(this, translations.en || {});
    }

    setLanguage(language) {
      this.language = language;
      Object.assign(this, this.translations[language] || this.translations.en || {});
    }

    getLanguage() {
      return this.language;
    }
  },
);

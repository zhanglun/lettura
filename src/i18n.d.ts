// import the original type declarations
import "i18next";
// import all namespaces (for the default language, only)
import zh from "./locales/zh.json";
import en from "./locales/en.json";

declare module "i18next" {
  // Extend CustomTypeOptions
  interface CustomTypeOptions {
    // custom resources type
    resources: {
      en: {
        translation: typeof en;
      },
      zh: {
        translation: typeof zh;
      }
    };
    // other
  }
}

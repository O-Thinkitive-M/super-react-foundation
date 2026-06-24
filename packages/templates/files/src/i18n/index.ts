// i18n setup — the single entry point for all user-facing text.
//
// Usage in components:
//   import { useTranslation } from '@/i18n';
//   const { t } = useTranslation();
//   <Button>{t('buttons.getStarted')}</Button>
//
// Anywhere outside React (toasts, utils):
//   import { t } from '@/i18n';
//   toast.success(t('labels.featureCount', { count }));
//
// Default ships one locale (en) loaded eagerly so the app boots with zero config.
// To add locales, mirror `en/` into `es/`, `ar/`, ... and switch this to the
// lazy `i18next-resources-to-backend` loader described in project-setup/i18n.md.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./en";

void i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  ns: ["common"],
  defaultNS: "common",
  resources: { en },
  interpolation: { escapeValue: false }, // React already escapes
});

/** Switch locale and flip text direction (RTL for ar/he). */
export function setLocale(lng: string): void {
  void i18n.changeLanguage(lng);
  document.dir = i18n.dir();
}

export default i18n;
export { useTranslation, Trans } from "react-i18next";
export const t = i18n.t.bind(i18n);

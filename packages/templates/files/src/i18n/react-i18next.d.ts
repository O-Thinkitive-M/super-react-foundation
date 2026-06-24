// Makes t() typed: every key in the `en` bundle is autocompleted, and a typo
// like t('buttons.getStrated') becomes a compile error. The default namespace is
// `common`, so keys are written without the `common:` prefix (t('buttons.getStarted')).
import "react-i18next";
import type { en } from "./en";

declare module "react-i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: typeof en;
  }
}

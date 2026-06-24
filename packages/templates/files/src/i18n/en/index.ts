// English bundle. One `common` namespace is enough for the default app; add a
// portal-specific namespace (e.g. `provider`) here when a feature needs one, and
// mirror it under each locale (es/, ar/, ...). See project-setup/i18n.md.
import { buttons } from "./buttons";
import { titles } from "./titles";
import { labels } from "./labels";
import { descriptions } from "./descriptions";

export const en = {
  common: { buttons, titles, labels, descriptions },
} as const;

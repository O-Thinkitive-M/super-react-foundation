// Field + UI labels (non-button, non-title). Supports interpolation, e.g. {{count}}.
export const labels = {
  foundationReady: "Your foundation is ready. This is a demo screen.",
  // Pluralized example: i18next picks _one / _other from the count argument.
  featureCount_one: "{{count}} feature wired",
  featureCount_other: "{{count}} features wired",
} as const;

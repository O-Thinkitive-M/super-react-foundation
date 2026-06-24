import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // dist output, the generated SDK, and CommonJS tooling files are not linted
  // with the app's TS rules.
  { ignores: ["dist/", "src/sdk/", "**/*.cjs"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Allow intentionally-unused args/vars prefixed with `_` (e.g. `_e`).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);

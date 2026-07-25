import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Human Interface Spec v1.0 — ban browser dialogs in product UI
    files: ["components/**/*.{ts,tsx}", "app/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    rules: {
      "no-alert": "error",
      "no-restricted-globals": [
        "error",
        { name: "confirm", message: "Use appConfirm / useConfirm (HIG AlertDialog)." },
        { name: "alert", message: "Use appAlert / useConfirm.alert (HIG AlertDialog)." },
      ],
    },
  },
]);

export default eslintConfig;

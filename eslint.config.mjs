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
    // Backup files
    "**/*.bak.tsx",
    "**/*.bak.ts",
    // Vendor / non-project directories that shouldn't be linted
    "New folder/**",
    "**/vendor/**",
    "node_modules/**",
    "*.js",
    "*.ts",
    "scripts/**",
    "!prisma/**",
  ]),
  // Relax specific rules for view files that deal with untyped API data
  {
    files: ["src/views/**/*.tsx", "src/views/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@next/next/no-img-element": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  // Relax any-type, ban-ts-comment, and hook errors for service/utility/infrastructure layers
  // that legitimately deal with external API data and require escape hatches
  {
    files: [
      "src/services/**/*.ts",
      "src/services/**/*.tsx",
      "src/utils/**/*.ts",
      "src/utils/**/*.tsx",
      "src/types/**/*.ts",
      "src/actions/**/*.ts",
      "src/actions/**/*.tsx",
      "src/components/**/*.tsx",
      "src/components/**/*.ts",
      "src/hooks/**/*.ts",
      "src/hooks/**/*.tsx",
      "src/contexts/**/*.tsx",
      "src/contexts/**/*.ts",
      "src/data/**/*.ts",
      "src/app/**/*.ts",
      "src/app/**/*.tsx",
      "src/middleware/**/*.ts",
      "src/middleware/**/*.tsx",
      "src/pages/**/*.ts",
      "src/pages/**/*.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/immutability": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
]);

export default eslintConfig;

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The panel names a role only through src/features/admin/lib/roles.ts (ROLES, useRole) and the API types.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/features/admin/lib/roles.ts", "src/types/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^(DEVELOPER|OWNER|SUPERADMIN|ADMIN)$/]",
          message: "Name a role through src/features/admin/lib/roles.ts (ROLES, useRole), not as a string.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

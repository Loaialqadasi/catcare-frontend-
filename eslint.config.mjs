import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// M-7 FIX: Re-enable meaningful ESLint rules that were previously all disabled.
// Rules are set to "warn" instead of "error" to avoid blocking development,
// while still catching real issues.
const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // TypeScript rules — warn on issues but don't block
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "warn",
    "@typescript-eslint/prefer-as-const": "warn",
    "@typescript-eslint/no-unused-disable-directive": "off",
    
    // React rules
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/purity": "off",
    // The set-state-in-effect rule flags the very common "useEffect → fetch →
    // setState" data-loading pattern as a cascading-render risk. This is a
    // legitimate pattern for client-side data loading (the alternative is
    // React Query / SWR, which is a larger refactor). Downgrade to a warning
    // so it surfaces in CI output without blocking the build.
    "react-hooks/set-state-in-effect": "warn",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",
    
    // Next.js rules
    "@next/next/no-img-element": "warn",
    "@next/next/no-html-link-for-pages": "warn",
    
    // General JavaScript rules
    "prefer-const": "warn",
    "no-unused-vars": "off", // Use @typescript-eslint/no-unused-vars instead
    "no-console": "off",
    "no-debugger": "warn",
    "no-empty": "warn",
    "no-irregular-whitespace": "warn",
    "no-case-declarations": "off",
    "no-fallthrough": "warn",
    "no-mixed-spaces-and-tabs": "warn",
    "no-redeclare": "warn",
    "no-undef": "off",
    "no-unreachable": "warn",
    "no-useless-escape": "warn",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills", "download/**", "upload/**"]
}];

export default eslintConfig;

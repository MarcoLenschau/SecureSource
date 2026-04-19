import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import jsdoc from "eslint-plugin-jsdoc";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
    },
    plugins: {
      "@typescript-eslint": tseslint,
      jsdoc,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      semi: ["error", "always"],
      "max-lines-per-function": ["error", { max: 14 }],
      "jsdoc/require-jsdoc": ["warn", { require: { FunctionDeclaration: true, ArrowFunctionExpression: true } }],
    },
  },
  {
    files: ["**/__tests__/**/*.test.ts", "**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "max-lines-per-function": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", ".angular/**", "coverage/**"],
  },
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      "@angular-eslint/prefer-on-push-component-change-detection": "warn",
      "@angular-eslint/component-max-inline-declarations": [
        "error",
        {
          template: 0,
          styles: 3,
          animations: 5,
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-empty": "warn",
      "max-lines": [
        "warn",
        {
          max: 500,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      "no-restricted-syntax": [
        "warn",
        {
          selector: "AssignmentExpression[left.property.name='innerHTML']",
          message: "Evita asignar innerHTML directamente en TypeScript. Usa plantillas Angular o bindings seguros.",
        },
        {
          selector: "TemplateElement[value.raw=/<div|<span|<p|<ul|<li|<table|<h[1-6]/]",
          message: "HTML incrustado detectado dentro de TypeScript. Separa la vista en un archivo .html o subcomponente.",
        },
        {
          selector: "Literal[value=/<div|<span|<p|<ul|<li|<table|<h[1-6]/]",
          message: "HTML incrustado detectado dentro de cadena literal en TypeScript.",
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
    ],
    rules: {
      "@angular-eslint/template/no-negated-async": "warn",
      "@angular-eslint/template/eqeqeq": "warn",
    },
  }
);

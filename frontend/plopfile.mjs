/**
 * Plop generator for scaffolding a new CRUD feature module.
 * Run with: npm run generate
 *
 * Generates a features/<resource>/ folder with the four standard subdirs -
 * api/ (raw fetch functions), hooks/ (TanStack Query wrappers), components/
 * (form + page), types/ (zod schema + response type) - following the same
 * conventions as the facilities, permits, and inspections features. The
 * generated files are a starting skeleton with TODOs - fill in real fields,
 * zod validation, and columns, then add a route in src/App.tsx and a nav
 * link in src/components/layout/AppShell.tsx.
 */
export default function (plop) {
  plop.setGenerator('feature', {
    description: 'Scaffold a new CRUD feature (types, api, hooks, form, and page)',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Entity name, singular, PascalCase (e.g. Vehicle):',
        validate: (value) => (/^[A-Z][A-Za-z0-9]*$/.test(value) ? true : 'Use PascalCase, e.g. Vehicle'),
      },
      {
        type: 'input',
        name: 'apiPath',
        message: 'Backend resource path, plural, kebab-case (e.g. vehicles):',
        default: (answers) => `${plop.getHelper('kebabCase')(answers.name)}s`,
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/features/{{kebabCase apiPath}}/types/{{camelCase name}}.ts',
        templateFile: 'plop-templates/feature/types.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{kebabCase apiPath}}/api/{{kebabCase apiPath}}.ts',
        templateFile: 'plop-templates/feature/api.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{kebabCase apiPath}}/hooks/use{{pascalCase name}}s.ts',
        templateFile: 'plop-templates/feature/hooks.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{kebabCase apiPath}}/components/{{pascalCase name}}Form.tsx',
        templateFile: 'plop-templates/feature/Form.tsx.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{kebabCase apiPath}}/components/{{pascalCase name}}Page.tsx',
        templateFile: 'plop-templates/feature/Page.tsx.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{kebabCase apiPath}}/index.ts',
        templateFile: 'plop-templates/feature/index.ts.hbs',
      },
      (answers) => {
        const apiPath = plop.getHelper('kebabCase')(answers.apiPath);
        const camelName = plop.getHelper('camelCase')(answers.name);
        const routeName = `${plop.getHelper('camelCase')(answers.apiPath)}Route`;
        return (
          `Generated the ${answers.name} feature (api/, hooks/, components/, types/). Next steps:\n` +
          `  1. Add real fields to src/features/${apiPath}/types/${camelName}.ts (zod schema + response type)\n` +
          `  2. Fill in the form fields in src/features/${apiPath}/components/${answers.name}Form.tsx\n` +
          `  3. Fill in the table columns in src/features/${apiPath}/components/${answers.name}Page.tsx\n` +
          `  4. Import ${routeName} into src/app-routes.ts and add it to APP_ROUTES - that's the only place the page list lives, so App.tsx and AppShell.tsx need no changes\n` +
          `  5. Add the matching @RestController/@Entity/@Service on the backend\n` +
          `  6. If another feature needs something from this one, export it from this feature's index.ts rather than importing the internal file directly`
        );
      },
    ],
  });
}

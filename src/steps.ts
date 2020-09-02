import * as fs from 'fs';
import * as execa from 'execa';
import * as url from 'url';

class StringOutput {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  toFile(filePath: string): void {
    fs.writeFileSync(filePath, this.value);
  }

  toConsole(): void {
    console.log(this.value);
  }

  asString(): string {
    return this.value;
  }
}

export function exists(path: string): boolean {
  return fs.existsSync(path);
}

export function cd(path: string): void {
  process.chdir(path);
}

export function mkdir(path: string, recursive: boolean = true) {
  console.log(`Creating ${path}`);
  fs.mkdirSync(path, { recursive: recursive });
}

export function echo(value: string): StringOutput {
  return new StringOutput(value);
}

export function execute(command: string, args?: string[]): string {
  console.log(`Running ${command} ${args ? args?.join(' ') : ''}`);
  const returnValue = execa.sync(command, args);
  return returnValue.stdout;
}

export function writePackageJson(name: string, repo?: string, license: string = 'ISC', version: string = '1.0.0') {
  console.log('Writing package.json');

  let content = `{
    "name": "${name}",
    "version": "${version}",
    "description": "",
    "main": "lib/index.js",
    "scripts": {
        "run": "npm run build && node lib/index.js",
        "test": "jest --config jestconfig.json",
        "build": "tsc && ncc build -o dist src/index.ts",
        "format": "prettier --write \\"src/**/*.ts\\"",
        "lint": "tslint -p tsconfig.json"
    },
    "keywords": [],
    "author": "",
    "license": "${license}"`;

  if (repo) {
    const url = repo.endsWith('.git') ? repo.substring(0, repo.length - 4) : repo;

    content += `,
    "repository": {
        "type": "git",
        "url": "git+${repo}"
    },
    "bugs": {
        "url": "${url}/issues"
    },
    "homepage": "${url}#readme"`;
  }

  content += `
}`;

  echo(content).toFile('package.json');
}

export function writeTslintJson() {
  console.log('Writing tslint.json');

  echo(`{
    "extends": ["tslint:recommended", "tslint-config-prettier"]
}`).toFile('tslint.json');
}

export function writeTsconfigJson() {
  console.log('Writing tsconfig.json');

  echo(`{
    "compilerOptions": {
        "target": "es6",
        "module": "commonjs",
        "outDir": "./lib",
        "strict": true
    },
    "include": ["src"],
    "exclude": ["node_modules", "**/__tests__/*"]
}`).toFile('tsconfig.json');
}

export function writeJestConfigJson() {
  console.log('Writing jestconfig.json');

  echo(`{
    "transform": {
        "^.+\\\\.(t|j)sx?$": "ts-jest"
    },
    "testRegex": "(/__tests__/.*|(\\\\.|/)(test|spec))\\\\.(jsx?|tsx?)$",
    "moduleFileExtensions": ["ts", "tsx", "js", "jsx", "json", "node"]
}`).toFile('jestconfig.json');
}

export function writePrettierRc() {
  console.log('Writing .prettierrc');

  echo(`{
    "printWidth": 120,
    "trailingComma": "all",
    "singleQuote": true
}`).toFile('.prettierrc');
}

export function writeIndexJs() {
  console.log('Writing src/index.ts');

  echo(`import * as core from '@actions/core'

export function greet(name: string) {
    return \`Hello \${name}\`
}

const nameInput = core.getInput("name")
core.info(greet(nameInput))
`).toFile('src/index.ts');
}

export function writeTestJs() {
  console.log('Writing src/__tests__/index.test.ts');

  echo(`import { greet } from '../index'

test('greet', () => {
    expect(greet("Dave")).toBe("Hello Dave")
})
`).toFile('src/__tests__/index.test.ts');
}

export function writeGitIgnore() {
  console.log('Writing .gitignore');

  echo(`node_modules/
lib/`).toFile('.gitignore');
}

export function writeActionYml(name: string) {
  console.log('Writing action.yml');

  echo(`name: '${name}'
description: ''
inputs:
  name:
    description: 'Your name'
    required: true
runs:
  using: 'node12'
  main: 'dist/index.js'`).toFile('action.yml');
}

export function writeCIAction() {
  console.log('Writing .github/workflows/main.yml');

  echo(`name: CI

on:
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run build
      - run: npm run test
      - run: npm run lint
`).toFile('.github/workflows/main.yml');
}

export function writeReadme(name: string, repo?: string) {
  console.log('Writing README.md');

  let content = `# ${name}`;

  if (repo) {
    const repoUrl = url.parse(repo);
    const path = repoUrl.path;
    const nwo = path?.substring(1, path.length - 4);

    content += `

This is a starter workflow produced by [actions-starter](https://www.npmjs.com/package/actions-starter). To use this action, add the following step to your workflow:
\`\`\`
- name: Say hi to Dave
  uses: ${nwo}@master
  with:
    name: Dave
\`\`\`
`;
  }

  echo(content).toFile('README.md');
}

#!/usr/bin/env node

import * as program from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import * as execa from 'execa'

class StringOutput {
    value: string

    constructor(value: string) {
        this.value = value
    }

    toFile(filePath: string): void {
        fs.writeFileSync(filePath, this.value)
    }

    toConsole(): void {
        console.log(this.value)
    }

    asString(): string {
        return this.value
    }
}

function exists(path: string): boolean {
    return fs.existsSync(path)
}

function cd(path: string): void {
    process.chdir(path)
}

function mkdir(path: string, recursive: boolean = true) {
    console.log(`Creating ${path}`)
    fs.mkdirSync(path, { recursive: recursive })
}

function echo(value: string): StringOutput {
    return new StringOutput(value)
}

function execute(command: string, args?: string[]): string {
    console.log(`Running ${command} ${args ? args?.join(" "): ""}`)
    const returnValue = execa.sync(command, args)
    return returnValue.stdout
}

function writePackageJson(name: string, repo?: string, license: string = "ISC", version: string = "1.0.0") {
    console.log("Writing package.json")

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
    "license": "${license}"`

    if (repo) {
        const url = repo.endsWith(".git") ? repo.substring(0, repo.length-4) : repo

        content += `,
    "repository": {
        "type": "git",
        "url": "git+${repo}"
    },
    "bugs": {
        "url": "${url}/issues"
    },
    "homepage": "${url}#readme"`
    }

    content += `
}`

    echo(content).toFile("package.json")
}

function writeTslintJson() {
    console.log("Writing tslint.json")

    echo(`{
    "extends": ["tslint:recommended", "tslint-config-prettier"]
}`).toFile("tslint.json")
}

function writeTsconfigJson() {
    console.log("Writing tsconfig.json")

    echo(`{
    "compilerOptions": {
        "target": "es6",
        "module": "commonjs",
        "outDir": "./lib",
        "strict": true
    },
    "include": ["src"],
    "exclude": ["node_modules", "**/__tests__/*"]
}`).toFile("tsconfig.json")
}

function writeJestConfigJson() {
    console.log("Writing jestconfig.json")

    echo(`{
    "transform": {
        "^.+\\\\.(t|j)sx?$": "ts-jest"
    },
    "testRegex": "(/__tests__/.*|(\\\\.|/)(test|spec))\\\\.(jsx?|tsx?)$",
    "moduleFileExtensions": ["ts", "tsx", "js", "jsx", "json", "node"]
}`).toFile("jestconfig.json")
}

function writePrettierRc() {
    console.log("Writing .prettierrc")

    echo(`{
    "printWidth": 120,
    "trailingComma": "all",
    "singleQuote": true
}`).toFile(".prettierrc")
}

function writeIndexJs() {
    console.log("Writing src/index.ts")

    echo(`import * as core from '@actions/core'

export function greet(name: string) {
    return \`Hello \${name}\`
}

const nameInput = core.getInput("name")
core.info(greet(nameInput))
`).toFile("src/index.ts")
}

function writeTestJs() {
    console.log("Writing src/__tests__/index.test.ts")

    echo(`import { greet } from '../index'

test('greet', () => {
    expect(greet("Dave")).toBe("Hello Dave")
})
`).toFile("src/__tests__/index.test.ts")
}

function writeGitIgnore() {
    console.log("Writing .gitignore")

    echo(`node_modules/
lib/`).toFile(".gitignore")
}

function writeActionYml(name: string) {
    console.log("Writing action.yml")

    echo(`name: '${name}'
description: ''
inputs:
  name:
    description: 'Your name'
    required: true
runs:
  using: 'node12'
  main: 'dist/index.js'`).toFile("action.yml")
}

function writeCIAction() {
    console.log("Writing .github/workflows/main.yml")

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
`).toFile(".github/workflows/main.yml")
}

function writeReadme(name: string) {
    console.log("Writing README.md")

    echo(`# ${name}`).toFile("README.md")
}

program
    .version('1.0.0')
    .name("actions")
    .description("Generate starter projects for NodeJS, Typescript, or GitHub Actions")

program
    .command("open")
    .action((inputs) => {
        execute("code", [process.cwd()])
    })

program
    .command("init")
    .option('-t, --template <str>', 'The template to follow (default \'node\')')
    .option('-p, --project <str>', 'The name of the project')
    .option('-l, --license <str>', 'The license to use (default \'ISC\')')
    .option('-v, --initialVaersion <str>', 'The intial version (default \'1.0.0\')')
    .option('-r, --repo <str>', 'The repo to clone')
    .action((inputs) => {
        let type = 'typescript'
        let name = path.basename(process.cwd())
        let repo: string | undefined = undefined
        let license = "ISC"
        let version = "1.0.0"

        for (let file of fs.readdirSync(".")) {
            if (file !== ".git" && file !== "package.json") {
                console.warn("Directory is not empty")
                process.exit(-1)
            }
        }
        
        if (inputs.type) {
            type = inputs.type.toLowerCase()
        }
        
        if (inputs.project) {
            name = inputs.project
        }
        
        if (inputs.license) {
            license = inputs.license
        }
        
        if (inputs.initialVersion) {
            version = inputs.initialVersion
        }
        
        if (inputs.repo) {
            repo = inputs.repo
        }
        
        if (exists(".git")) {
            try {
                repo = execute("git", ["remote", "get-url", "origin"])
            } catch (error) {
                console.log("Unable to determine remote repo")
            }
        } else {
            execute("git", ["init"])
        
            if (repo) {
                execute("git", ["remote", "add", "origin", repo])
            }
        }
        
        writePackageJson(name, repo, license, version)
        writeTslintJson()
        writeTsconfigJson()
        writeJestConfigJson()
        writePrettierRc()
        writeGitIgnore()
        writeActionYml(name)
        writeReadme(name)
        mkdir("src")
        writeIndexJs()
        mkdir("src/__tests__")
        writeTestJs()
        execute("npm", ["install", "--save-dev", "@types/jest", "jest", "ts-jest", "prettier", "tslint", "tslint-config-prettier", "typescript", "@zeit/ncc"])
        execute("npm", ["install", "@actions/core"])
        mkdir(".github/workflows")
        writeCIAction()
    })

program.parse(process.argv);
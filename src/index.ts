#!/usr/bin/env node

import * as program from 'commander'
import * as chalk from 'chalk'
import * as path from 'path'
import * as fs from 'fs'
import * as semver from 'semver'
import {
    execute,
    exists,
    writePackageJson,
    writeTslintJson,
    writeTsconfigJson,
    writeJestConfigJson,
    writePrettierRc,
    writeGitIgnore,
    writeActionYml,
    writeReadme,
    mkdir,
    writeIndexJs,
    writeTestJs,
    writeCIAction
} from './steps'

program
    .version('1.0.0')
    .name("actions")
    .description("Quickly configure repos for writing new GitHub Actions")

program
    .command("edit")
    .description("Edit project in VSCode")
    .action((inputs) => {
        execute("code", [process.cwd()])
    })

program
    .command("open")
    .description("Open project on GitHub")
    .action((inputs) => {
        const repo = execute("git", ["remote", "get-url", "origin"])
        const url = repo.endsWith(".git") ? repo.substring(0, repo.length-4) : repo
        execute("start", ["/max", url])
    })

program
    .command("init")
    .description("Initialize a new project")
    .option('-p, --project <str>', 'The name of the project')
    .option('-l, --license <str>', 'The license to use (default \'ISC\')')
    .option('-v, --initialVaersion <str>', 'The intial version (default \'1.0.0\')')
    .option('-r, --repo <str>', 'The repo to clone')
    .action((inputs) => {
        let name = path.basename(process.cwd())
        let repo: string | undefined = undefined
        let branch: string | undefined = undefined
        let license = "ISC"
        let version = "1.0.0"

        for (let file of fs.readdirSync(".")) {
            if (file !== ".git" && file !== "package.json") {
                console.warn("Directory is not empty")
                process.exit(-1)
            }
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

        console.log(chalk.bold.underline(`Generating GitHub Actions project ${name}`))
        
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

        branch = execute("git", ["branch", "--show-current"])
        
        writePackageJson(name, repo, license, version)
        writeTslintJson()
        writeTsconfigJson()
        writeJestConfigJson()
        writePrettierRc()
        writeGitIgnore()
        writeActionYml(name)
        writeReadme(name, repo)
        mkdir("src")
        writeIndexJs()
        mkdir("src/__tests__")
        writeTestJs()
        execute("npm", ["install", "--save-dev", "@types/jest", "jest", "ts-jest", "prettier", "tslint", "tslint-config-prettier", "typescript", "@zeit/ncc"])
        execute("npm", ["install", "@actions/core"])
        mkdir(".github/workflows")
        writeCIAction()

        let counter = 0
        console.log("")
        console.log(chalk.bold.underline(`Your new Action is ready! To publish:`))
        console.log(`${++counter}. Run your tests: ` + chalk.bold("npm test"))
        console.log(`${++counter}. Build the action: ` + chalk.bold("npm run build"))
        if (!repo) {
            console.log(`${++counter}. Set your git remote: ` + chalk.bold("git remote add origin <url>"))
        }
        console.log(`${++counter}. Commit and push changes:`)
        console.log("      " + chalk.bold("git add ."))
        console.log("      " + chalk.bold(`git commit -m \"Publish version ${version}\"`))
        console.log("      " + chalk.bold(`git push origin ${branch}`))
    })

program
    .command("publish [type]")
    .action((type, options) => { 
        if (execute("git", ["status", "--porcelain"]).toString() !== '') {
            console.error(`Found uncommitted changes, please commit first before publishing`)
            process.exit(-1)
        }
        
        if (!type) {
            const project = JSON.parse("package.json")
            type = project.version
        }

        if (type === 'major' || type == 'minor' || type == 'patch') {
            execute("npm", ["version", type])
        } else if (semver.valid(type)) {
            execute("npm", ["version", type])
        } else {
            console.error(`'${type} is not a valid option. Must be 'major', 'minor', 'patch', or a version number like '1.6.2'`)
            process.exit(-1)
        }
    })

program.parse(process.argv);
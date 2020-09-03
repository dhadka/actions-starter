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
    writeCIAction,
    getVersion,
    browse
} from './steps'

program
    .version(require('../package.json').version)
    .name("actions")
    .description("Quickly configure repos for writing new GitHub Actions")

program
    .command("edit")
    .description("edit project in VSCode")
    .action((inputs) => {
        execute("code", [process.cwd()], true)
    })

program
    .command("open")
    .description("open project on GitHub")
    .action((inputs) => {
        const repo = execute("git", ["remote", "get-url", "origin"])
        const url = repo.endsWith(".git") ? repo.substring(0, repo.length-4) : repo
        browse(url)
    })

program
    .command("docs")
    .description("open GitHub Actions documentation")
    .action((inputs) => {
        browse("https://docs.github.com/en/actions")
    })

program
    .command("init")
    .description("initialize a new GitHub Actions project")
    .option('-p, --project <str>', 'The name of the project')
    .option('-l, --license <str>', 'The license to use (default \'ISC\')')
    .option('-d, --shortDescription <str>', 'A short description of the project')
    .option('-v, --initialVaersion <str>', 'The intial version (default \'1.0.0\')')
    .option('-r, --repo <str>', 'The repo to clone')
    .option('--deps <dependencies...>', 'List of additional dependencies to install')
    .option('--dev-deps <dependencies...>', 'List of additional dev dependencies to install')
    .action((inputs) => {
        let name = path.basename(process.cwd())
        let repo: string | undefined = undefined
        let branch: string | undefined = undefined
        let license = "ISC"
        let description = ""
        let version = "1.0.0"
        let devDeps = ["@types/jest", "jest", "ts-jest", "prettier", "tslint", "tslint-config-prettier", "typescript", "@zeit/ncc"]
        let deps = ["@actions/core"]

        for (let file of fs.readdirSync(".")) {
            if (file !== ".git") {
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

        if (inputs.shortDescription) {
            description = inputs.shortDescription
        }
        
        if (inputs.initialVersion) {
            version = inputs.initialVersion
        }
        
        if (inputs.repo) {
            repo = inputs.repo
        }

        if (inputs.devDeps) {
            devDeps = devDeps.concat(inputs.devDeps)
        }

        if (inputs.deps) {
            deps = deps.concat(inputs.deps)
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
        
        writePackageJson(name, repo, license, description, version)
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
        execute("npm", ["install", "--save-dev"].concat(devDeps))
        execute("npm", ["install"].concat(deps))
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
    .command("publish [version]")
    .description("publish the action by bumping the version number, creating version tags, and pushing to GitHub")
    .option("-l, --latest", "Create or update the tag 'latest'")
    .action((version, options) => { 
        if (execute("git", ["status", "--porcelain"], true).toString().trim() !== '') {
            console.error(`Found uncommitted changes, please commit first before publishing`)
            process.exit(-1)
        }

        if (!version) {
            version = getVersion()

            if (execute("git", ["tag", "-l", `v${version}`], true).toString().trim() !== '') {
                console.error(`Tag v${version} already exists, can not publish`)
                process.exit(-1)
            }

            execute("git", ["tag", `v${version}`])
        } else {
            execute("npm", ["version", version])
            console.log(`New version is ${getVersion()}`)
        }

        const major = semver.major(getVersion())
        if (version.toLowerCase().startsWith("pre")) {
            console.log(`Will not update v${major} tag since this is a pre-release`)
        } else {
            execute("git", ["tag", "-f", `v${major}`])
        }

        if (options.latest) {
            execute("git", ["tag", "-f", `latest`])
        }

        if (execute("git", ["remote", "-v"], true).toString().trim() === '') {
            console.log("No Git remote is configured. Will not push changes.")
        } else {
            // TODO: Only publish from master
            execute("git", ["push", "origin", "master"])
            execute("git", ["push", "--tags", "-f"])
        }
    })

program.parse(process.argv);
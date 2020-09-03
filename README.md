# Actions Starter

Quickly configure repos for writing new GitHub Actions

## Installation

Install with `npm` globally:
```
npm install --global actions-starter
```
or as a development dependency for your project:
```
npm install --save-dev actions-starter
```

## Setup Project

Before running this command, create an empty repository on GitHub and an empty folder on your
local computer.  Then run `actions init --repo <url>` to initialize the repo.  For example:

```
mkdir test-starter
cd test-starter
actions init --repo https://github.com/dhadka/test-starter
```

The result is a simple hello world example with default settings, including Lint, prettier,
Jest for testing, and a GitHub Actions CI workflow.  This simple project can be further
configured with the various options, including:

**`--project`** - The project name. If not specified, defaults to the folder name.

**`--shortDescription`** - A short description for the project.

**`--license`** - The license to use, such as `MIT`. This will also add the LICENSE text.

**`--test`** - Use `jest` (default) or `mocha` for testing.

**`--initialVersion`** - The initial version. If not specified, defaults to `1.0.0`.

**`--deps`** - One or more additional dependencies to install.

**`--devDeps`** - One or more additional development dependencies to install.

## Publish Project

Use `actions publish` to increment the package version, commit and tag the new version, and push
everything to GitHub.  Similar to `npm version`, you can specify the version field to increment,
such as `major`, `minor`, or `patch`.

```
actions publish           # Publish the current version
actions publish minor     # Increment the minor version field and publish
```

In addition to creating the full version number, such as `v1.2.0`, this command also creates a
tag for the major version number, such as `v1`.  This encourages consumers of your action to target
the major version only so they are always running the most recent version.
You can optionally use `--latest` to also create or update the `latest` tag.

## Other Commands

```
actions edit     # Open in VSCode
actions open     # Open the GitHub repo in your browser
actions docs     # Open the GitHub Actions documentation
```

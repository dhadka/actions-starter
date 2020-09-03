# Actions Starter

Quickly configure repos for writing new GitHub Actions

## Setup Project

Before running this command, create an empty repository on GitHub and an empty folder on your
local computer.  Then run `actions init --repo <url>` to initialize the repo.  For example:

```
mkdir test-starter
cd test-starter
actions init --repo https://github.com/dhadka/test-starter
```

## Publish Project

Use `actions publish` to increment the package version, generate a new tag, commit and tag the
new version, and push everything to GitHub.  Similar to `npm version`, you can specify the version
field to increment, such as `major`, `minor`, or `patch`.

```
actions publish           # Publish the current version
actions publish minor     # Increment the minor version field and publish
```

In addition to creating the full version number, such as `v1.2.0`, this command also creates a
tag for the major version number, such as `v1`.  This encourages consumers of your action to target
the major version only, meaning they automatically run the latest version of your action.
You can optionally use `--latest` to also create or update the `latest` tag, so consumers can always
reference the most recently published version of your action.

## Other Commands

```
actions edit     # Open in VSCode
actions open     # Open the GitHub repo in your browser
actions docs     # Open the GitHub Actions documentation
```

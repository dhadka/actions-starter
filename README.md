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
new version, and push all changes to GitHub.  Similar to `npm version`, you can specify the version
field to increment, such as `major`, `minor`, or `patch`.

```
actions publish           # Publish the current version
actions publish minor     # Increment the minor version field and publish
```

You can also add the `-u` option to add or update a "major version" tag.  For example, if the current
version is `v2.1.0`, the major version tag is `v2`.  Additionally, each time you increment the minor
or patch numbers, it will update `v2` to the latest version.  This way, consumers of your action
can always use the latest major version of your action.

## Open in Editor

```
actions edit
```

## Open GitHub Repo in Browser

```
actions open
```

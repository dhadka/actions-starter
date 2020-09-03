# Actions Starter

Quickly configure repos for writing new GitHub Actions

## Setup Project

Create an empty repository on GitHub and an empty folder on your local computer.  Then
run `actions init --repo <url>` to initialize the repo.  For example:

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
actions publish minor
```

## Open in Editor

```
actions edit
```

## Open GitHub Repo in Browser

```
actions open
```

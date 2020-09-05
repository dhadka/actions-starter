import * as path from 'path'
import * as fs from 'fs'
import * as execa from 'execa'

async function cli(args: string[], cwd: string = "."): Promise<execa.ExecaReturnValue<string>> {
    return await execa(
        'node',
        [path.resolve('./lib/index')].concat(args),
        {
            cwd: cwd,
            reject: false // return error instead of throwing
        }
    )
}

function expectSuccess(result: execa.ExecaReturnValue<string>): void {
    expect(result).toBeDefined()
    expect(result.exitCode).toBe(0)
    expect(result.stderr).toBe('')
}

function expectFailure(result: execa.ExecaReturnValue<string>): void {
    expect(result).toBeDefined()
    expect(result.exitCode).toBeTruthy() // any non-zero result
}

function readJson(path: string): any {
    return JSON.parse(fs.readFileSync(path).toString())
}

function expectVersion(dir: string, version: string): void {
    expect(readJson(path.join(dir, "package.json")).version).toBe(version)
    expect(readJson(path.join(dir, "package-lock.json")).version).toBe(version)  
}

async function expectTags(dir: string, tags: string[]): Promise<void> {
    let expectedCommit: string | null = null

    for (const tag of tags) {
        let result = await execa("git", ["tag", "-l", tag], { cwd: dir })
        expect(result.exitCode).toBe(0)
        expect(result.stdout.trim()).toBe(tag)

        result = await execa("git", ["rev-list", "-n", "1", tag], { cwd: dir })
        const commit = result.stdout.trim()

        if (!expectedCommit) {
            expectedCommit = commit
        } else {
            expect(commit).toBe(expectedCommit)
        }
    }
}

async function testInit(dir: string, options: string[] = [], shouldSucceed: boolean = true): Promise<void> {
    jest.setTimeout(150000);

    if (fs.existsSync(dir)) {
        fs.rmdirSync(dir, { recursive: true })
    }

    fs.mkdirSync(dir, { recursive: true })
    
    let initResult = await cli(['init'].concat(options), dir)

    if (shouldSucceed) {
        expectSuccess(initResult)

        let buildResult = await execa("npm", ["run", "build"], { cwd: dir })
        expect(buildResult.exitCode).toBe(0)
    
        let testResult = await execa("npm", ["test"], { cwd: dir })
        expect(testResult.exitCode).toBe(0)
    
        let lintResult = await execa("npm", ["run", "lint"], { cwd: dir })
        expect(lintResult.exitCode).toBe(0)
    } else {
        expectFailure(initResult)
    }
}

test('help should work', async () => {
    let result = await cli(['-h'])
    expectSuccess(result)
    expect(result.stdout).toContain('Usage:')
})

test('init with no args should produce a valid repo', async() => {
    await testInit("temp/test_noargs")
})

test('init works with mocha test framework', async() => {
    await testInit("temp/test_mocha", ["--test", "mocha"])
})

test('init fails when given unsupported test framework', async() => {
    await testInit("temp/test_invalid_test", ["--test", "foo"], false)
})

test('publish works', async() => {
    const dir = "temp/test_publish"

    await testInit(dir)

    let publishResult = await cli(["publish"], dir)
    expectFailure(publishResult) // uncommitted changes

    await execa("git", ["add", "."], { cwd: dir })
    await execa("git", ["commit", "-m", "Initial commit"], { cwd: dir })

    publishResult = await cli(["publish"], dir)
    expectSuccess(publishResult)
    expectVersion(dir, "1.0.0")
    expectTags(dir, ["v1", "v1.0.0"])

    publishResult = await cli(["publish"], dir)
    expectFailure(publishResult) // version already published
    expectVersion(dir, "1.0.0")

    publishResult = await cli(["publish", "patch"], dir)
    expectSuccess(publishResult)
    expectVersion(dir, "1.0.1")
    expectTags(dir, ["v1", "v1.0.1"])

    publishResult = await cli(["publish", "patch"], dir)
    expectSuccess(publishResult)
    expectVersion(dir, "1.0.2")
    expectTags(dir, ["v1", "v1.0.2"])

    publishResult = await cli(["publish", "major"], dir)
    expectSuccess(publishResult)
    expectVersion(dir, "2.0.0")
    expectTags(dir, ["v2", "v2.0.0"])

    publishResult = await cli(["publish", "patch"], dir)
    expectSuccess(publishResult)
    expectVersion(dir, "2.0.1")
    expectTags(dir, ["v2", "v2.0.1"])

    publishResult = await cli(["publish", "minor"], dir)
    expectSuccess(publishResult)
    expectVersion(dir, "2.1.0")
    expectTags(dir, ["v2", "v2.1.0"])
})



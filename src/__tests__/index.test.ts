import * as path from 'path'
import * as fs from 'fs'
import * as execa from 'execa'
import { exec } from 'child_process'

interface Result {
    code: number,
    error: Error | null,
    stdout: string,
    stderr: string
}

function cli(args: string[], cwd: string = "."): Promise<Result> {
    return new Promise(resolve => { 
        exec(`node ${path.resolve('./lib/index')} ${args.join(' ')}`,
            { cwd }, 
            (error, stdout, stderr) => { 
                resolve({
                    code: error && error.code ? error.code : 0,
                    error,
                    stdout,
                    stderr
                })
            }
        )
    })
}

function expectSuccess(result: Result) {
    expect(result).toBeDefined()
    expect(result.code).toBe(0)
    expect(result.error).toBeNull()
    expect(result.stderr).toBe('')
}

async function testInit(dir: string, options: string[] = [], shouldSucceed: boolean = true) {
    jest.setTimeout(150000);
    fs.rmdirSync(dir, { recursive: true })
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
        expect(initResult.code).toBeTruthy() // any non-zero result
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



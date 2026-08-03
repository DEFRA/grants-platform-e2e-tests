import fs from 'node:fs'
import path from 'node:path'

function hasFailedTests(results) {
  if ((results.stats?.unexpected ?? 0) > 0) {
    return true
  }

  if ((results.errors?.length ?? 0) > 0) {
    return true
  }

  function walkSuites(suites = []) {
    for (const suite of suites) {
      for (const spec of suite.specs ?? []) {
        if (spec.ok === false) {
          return true
        }
      }

      if (walkSuites(suite.suites)) {
        return true
      }
    }

    return false
  }

  return walkSuites(results.suites)
}

export default async function globalTeardown() {
  const resultsFile = path.resolve(
    process.env.PLAYWRIGHT_JSON_REPORT || 'test-results/results.json'
  )

  if (!fs.existsSync(resultsFile)) {
    console.warn(`Playwright JSON report not found at ${resultsFile}`)
    return
  }

  const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'))

  if (hasFailedTests(results)) {
    fs.writeFileSync(path.resolve('FAILED'), JSON.stringify(results))
  }
}

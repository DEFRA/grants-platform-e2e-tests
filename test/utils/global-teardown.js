import fs from 'node:fs'

export default async function globalTeardown() {
  const resultsFile =
    process.env.PLAYWRIGHT_JSON_REPORT || 'test-results/results.json'

  if (!fs.existsSync(resultsFile)) {
    return
  }

  const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'))
  const failed = (results.stats?.unexpected ?? 0) > 0

  if (failed) {
    fs.writeFileSync('FAILED', JSON.stringify(results))
  }
}

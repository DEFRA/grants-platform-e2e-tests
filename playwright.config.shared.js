import './test/utils/load-env.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const fiveMinutes = 5 * 60 * 1000

function resolveWorkerCount(profile) {
  const fromEnv = Number(process.env.PW_WORKERS)

  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return fromEnv
  }

  // Local headed runs stay serial by default. CI / CDP / GitHub can overlap
  // specs that use different farmer CRNs.
  return profile === 'local' ? 1 : 3
}

export function createPlaywrightConfig({
  profile,
  timeout = fiveMinutes,
  headless = true,
  baseURL,
  proxy,
  channel
}) {
  process.env.PLAYWRIGHT_PROFILE = profile

  const headedLaunchArgs = [
    '--start-maximized',
    '--disable-infobars',
    '--ignore-certificate-errors'
  ]

  const headlessLaunchArgs = [
    '--no-sandbox',
    '--disable-infobars',
    '--disable-gpu',
    '--window-size=1920,1080',
    '--disable-dev-shm-usage',
    '--ignore-certificate-errors'
  ]

  return defineConfig({
    testDir: path.join(__dirname, 'test/specs'),
    testMatch: '**/*.js',
    fullyParallel: false,
    workers: resolveWorkerCount(profile),
    timeout,
    expect: {
      timeout: 10000
    },
    retries: 0,
    reporter: [
      ['list'],
      [
        'allure-playwright',
        { resultsDir: 'allure-results', detail: false, suiteTitle: false }
      ],
      ['json', { outputFile: 'test-results/results.json' }]
    ],
    globalTeardown: path.join(__dirname, 'test/utils/global-teardown.js'),
    use: {
      ...(headless ? devices['Desktop Chrome'] : {}),
      channel,
      baseURL,
      headless,
      viewport: headless ? { width: 1920, height: 1080 } : null,
      ignoreHTTPSErrors: true,
      actionTimeout: 15000,
      navigationTimeout: 60000,
      screenshot: 'on',
      trace: 'retain-on-failure',
      proxy,
      launchOptions: {
        headless,
        slowMo: profile === 'local' && !headless ? 100 : 0,
        args: headless ? headlessLaunchArgs : headedLaunchArgs
      }
    }
  })
}

export function getEnvironmentBaseUrl(fallback = 'http://localhost:3000') {
  return process.env.ENVIRONMENT
    ? `https://grants-ui.${process.env.ENVIRONMENT}.cdp-int.defra.cloud`
    : fallback
}

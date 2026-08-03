grants-platform-e2e-tests

Playwright end-to-end test suite for grants platform journeys.

- [Local](#local-development)
  - [Requirements](#requirements)
  - [Setup](#setup)
  - [Running local tests](#running-local-tests)
  - [Debugging local tests](#debugging-local-tests)
- [Production](#production)
- [Running on GitHub](#running-on-github)
- [Playwright configurations](#playwright-configurations)
- [Licence](#licence)

## Local Development

### Requirements

#### Node.js

Please install [Node.js](http://nodejs.org/) `>= v22.13.1` and [npm](https://nodejs.org/). You will find it
easier to use the Node Version Manager [nvm](https://github.com/creationix/nvm)

To use the correct version of Node.js for this application, via nvm:

```bash
nvm use
```

### Setup

Install application dependencies and Playwright browsers:

```bash
npm install
npm run setup:browsers
```

Copy `.env.example` to `.env` and fill in credentials:

```bash
cp .env.example .env
```

Required variables: `ENVIRONMENT`, `DEFRA_ID_USER_PASSWORD`, `ENTRA_ID_ADMIN_USER`, `ENTRA_ID_USER_PASSWORD`, `GRANTS_UI_BACKEND_API_TOKEN`

### Running local tests

Runs against CDP environments using `playwright.local.config.js` (headed Chrome by default):

```bash
npm run test:local
```

Run a single spec without cleaning reports:

```bash
npm run test:local:spec -- test/specs/woodland_management_journey.js
```

### Debugging local tests

```bash
npm run test:local:debug
```

Set `HEADLESS=true` to run headless locally. Set `PW_CHANNEL` to override the browser channel (default: `chrome`).

## Production

### Running the tests

Tests are run from the CDP Portal under the Test Suites section. Before any changes can be run, a new docker image must be built — this happens automatically when a pull request is merged into the `main` branch.

The results of the test run are made available in the portal.

## Requirements of CDP Environment Tests

1. Your service builds as a docker container using the `.github/workflows/publish.yml`
2. The Dockerfile's entrypoint script should return exit code of 0 if the test suite passes or 1/>0 if it fails
3. Test reports should be published to S3 using the script in `./bin/publish-tests.sh`

## Running on GitHub

Test runs on GitHub execute against docker-compose services on `http://localhost:3000`:

```bash
docker compose up -d
npm run test:github
```

See `compose.yml` for infrastructure setup (mongodb, redis, localstack).

## Playwright Configurations

| Config                        | WDIO equivalent       | Script                | Purpose                               |
| ----------------------------- | --------------------- | --------------------- | ------------------------------------- |
| `playwright.config.js`        | `wdio.conf.js`        | `npm test`            | CDP Portal / Docker (headless, proxy) |
| `playwright.local.config.js`  | `wdio.local.conf.js`  | `npm run test:local`  | Local dev against CDP (headed Chrome) |
| `playwright.github.config.js` | `wdio.github.conf.js` | `npm run test:github` | GitHub Actions / docker-compose       |

URL configuration is resolved in `test/utils/test-config.js` based on the active profile (`cdp`, `local`, `github`).

## Test Specs

| Spec                                   | Description                                    |
| -------------------------------------- | ---------------------------------------------- |
| `single_action_journey.js`             | SFI single action (CMOR1) full journey         |
| `action_with_hefer_consent_journey.js` | SFI with HEFER consent (feature-flagged)       |
| `action_with_sssi_consent_journey.js`  | SFI with SSSI consent (feature-flagged)        |
| `action_with_terminate_journey.js`     | Caseworker terminates after agreement accepted |
| `woodland_management_journey.js`       | Woodland Management Plan full journey          |
| `clig3_action_journey.js`              | CLIG3 action (skipped)                         |
| `upl8_action_journey.js`               | UPL8 action (skipped)                          |

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government licence v3

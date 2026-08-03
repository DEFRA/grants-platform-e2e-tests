# AGENTS.md

## Overview

This repository contains Playwright end-to-end tests for grants platform journeys. Test specs live in `test/specs/`, page objects in `test/page-objects/`, and reusable helpers/API clients in `test/utils/`. Root Playwright configs select the execution target: `playwright.config.js`, `playwright.local.config.js`, and `playwright.github.config.js`. Docker and CI support files are in `Dockerfile`, `compose.yml`, `docker/`, `.github/workflows/`, `entrypoint.sh`, and `run-journey-tests/`. Allure report output is generated into `allure-results/` and `allure-report/`.

## Commands

- `npm run setup:browsers`: install Playwright Chromium (required once after `npm install`).
- `npm run test`: clean reports, then run Playwright using `playwright.config.js` (CDP Portal / Docker).
- `npm run test:local`: run tests against CDP environments via `playwright.local.config.js`.
- `npm run test:local:debug`: local run with extended timeout (1 hour) for debugging.
- `npm run test:github`: run tests against `http://localhost:3000` via `playwright.github.config.js`.
- `npm run report`: generate Allure HTML report from `allure-results/`.
- `npm run lint` / `npm run format:check`: code quality checks.

## Architecture

Tests use Playwright Test with a page object model. Specs import `test` and `expect` from `test/fixtures/base.fixture.js`. Page objects and helpers use `test/utils/test-runtime.js`, which exposes WDIO-compatible `$`, `$$`, `browser`, and `expect` APIs backed by Playwright.

Run `npm run lint` and the relevant Playwright command before opening a PR. When debugging locally, set `ENVIRONMENT` and credentials in `.env`, run `npm run setup:browsers`, then `npm run test:local`.

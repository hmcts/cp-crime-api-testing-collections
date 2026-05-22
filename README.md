# CP Crime API Testing Collections

Two `.http` files covering all CP Crime APIM endpoints (VP and HRDS). Works in IntelliJ HTTP Client, VS Code REST Client, and `httpyac` CLI with no per-tool setup.

---

## Repository structure

```
requests/
  vp/vp.http        — Victim Portal: case details, court schedule, courthouses, URN mapper
  hrds/hrds.http    — HRDS: subscriptions, notifications, document retrieval, court schedule (SLC)

http-client.env.json          — committed · environment template (URLs, scopes, placeholders)
http-client.private.env.json  — git-crypt encrypted · real credentials (decrypted on checkout)
.gitattributes                — marks private env file for git-crypt encryption
scripts/
  sync-collections.js         — weekly auto-sync with SwaggerHub spec versions
cp-crime-api-specs.json       — registry of APIs and their SwaggerHub URLs
```

---

## First-time setup (every developer, once per machine)

### Prerequisites

Install the following if not already present:

```bash
brew install git-crypt       # decrypts credentials on checkout
```

For VS Code, install the **REST Client** extension by Huachao Mao (`ms-vscode.rest-client`).
For IntelliJ Community Edition, install the **HTTP Client** plugin from JetBrains Marketplace.

### 1. Clone the repo

```bash
git clone https://github.com/hmcts/cp-crime-api-testing-collections.git
cd cp-crime-api-testing-collections
```

### 2. Unlock credentials

Get `amp.team.key` from the team (it is stored in the shared GitHub Actions secret `GIT_CRYPT_KEY` — ask a maintainer to export it, or retrieve it from the team vault). Then run:

```bash
git-crypt unlock /path/to/amp.team.key
```

This decrypts `http-client.private.env.json` in place. From this point on, every `git pull` automatically delivers updated credentials — no further steps needed.

To confirm decryption worked:

```bash
git-crypt status
# http-client.private.env.json — should show "encrypted"
cat http-client.private.env.json
# Should show valid JSON, not binary gibberish
```

### 3. Open a request file

You are ready. Open `requests/vp/vp.http` or `requests/hrds/hrds.http` in your IDE and follow the steps in [Running requests](#running-requests) below.

---

## Running requests

### IntelliJ IDEA (Ultimate or Community + HTTP Client plugin)

1. Open `requests/vp/vp.http` or `requests/hrds/hrds.http`
2. Select your environment from the dropdown in the top-right of the editor (e.g. `vp-dev`, `hrds-sit`)
3. Click **Run** on the token request at the top of the file:
   - VP: `Get Entra Access Token`
   - HRDS: `Get Entra Access Token — HRDS scope` (and `SLC scope` if testing court schedule)
4. The Bearer token is stored automatically — run any API request below

### VS Code (REST Client extension)

1. Open the file
2. Press `Ctrl+Alt+E` (Mac: `Cmd+Alt+E`) to select your environment
3. Click **Send Request** above the token request — token chains into all requests automatically via `# @name` response variables
4. Click **Send Request** on any API request

### Terminal (httpyac CLI)

```bash
brew install httpyac

# Run all requests in a file
httpyac requests/vp/vp.http --env vp-dev --all

# Run a single named request
httpyac requests/hrds/hrds.http --env hrds-sit --name getHrdsToken
```

---

## Environments

Select the environment that matches where you are testing. The WAF vs APIM split for HRDS is controlled by the profile — no manual URL switching needed.

| Environment | Service | Gateway |
|---|---|---|
| `vp-dev` | Victim Portal | Development |
| `vp-sit` | Victim Portal | SIT |
| `vp-preprod` | Victim Portal | Pre-production |
| `vp-prod` | Victim Portal | Production — use with care |
| `hrds-dev` | HRDS | Development via WAF |
| `hrds-dev-apim` | HRDS | Development via APIM |
| `hrds-sit` | HRDS | SIT via WAF |
| `hrds-sit-apim` | HRDS | SIT via APIM |
| `hrds-preprod` | HRDS | Pre-production via WAF |
| `hrds-preprod-apim` | HRDS | Pre-production via APIM |
| `hrds-prod` | HRDS | Production via WAF |
| `hrds-prod-apim` | HRDS | Production via APIM |

---

## Token flow

All APIs use OAuth 2.0 Client Credentials (Entra ID). The auth requests at the top of each file use `# @name` — all subsequent requests reference the token automatically via `{{requestName.response.body.$.access_token}}`. No manual token copy-pasting.

| File | Token requests | Used by |
|---|---|---|
| `vp.http` | `getToken` | All VP requests |
| `hrds.http` | `getHrdsToken` | All HRDS requests |
| `hrds.http` | `getSlcToken` | Court schedule via SLC APIM only |

### HRDS full document flow

Run these in order for the full end-to-end test:

1. `Get Entra Access Token — HRDS scope`
2. `Create a new client subscription` — `client_subscription_id` is captured automatically from the response
3. `Create a notification` — triggers document generation; `documentId` is captured automatically
4. `Get PDF document` — uses the captured `documentId`

To test `Get PDF document` in isolation (without running the full flow), set `document_id` directly in `http-client.private.env.json` and replace the URL variable manually.

---

## Credentials reference

### HRDS profiles (`hrds-*`)

| Variable | Description |
|---|---|
| `hrds_base_url` | HRDS base URL — WAF URL in `hrds-*` profiles, APIM URL in `hrds-*-apim` profiles |
| `court_schedule_hrds_apim_base_url` | Court schedule endpoint via SLC APIM |
| `ingress_base_url` | Ingress base URL |
| `tenant_id` | Entra tenant ID |
| `scope` | HRDS OAuth scope (`api://<app-id>/.default`) |
| `slc_scope` | SLC OAuth scope (`api://<app-id>/.default`) |
| `client_id` | Service principal client ID |
| `client_secret` | Service principal client secret |
| `hrds_subscription_key` | APIM subscription key for HRDS |
| `slc_subscription_key` | APIM subscription key for SLC |
| `client_subscription_id` | Pre-existing subscription UUID for direct endpoint testing |
| `document_id` | Pre-existing document ID for direct GET document testing |
| `case_urn` | Test case URN |
| `key_id` | HMAC key ID used in secret rotation |

### VP profiles (`vp-*`)

| Variable | Description |
|---|---|
| `waf_base_url` | VP base URL via WAF |
| `apim_base_url` | VP base URL via APIM |
| `ingress_base_url` | Ingress base URL (used by URN mapper) |
| `court_schedule_base_url` | Court schedule endpoint |
| `courthouses_base_url` | Courthouses endpoint |
| `tenant_id` | Entra tenant ID |
| `scope` | VP OAuth scope (`api://<app-id>/.default`) |
| `client_id` | Service principal client ID |
| `client_secret` | Service principal client secret |
| `vp_subscription_key` | APIM subscription key for VP |
| `court_id` | Test court ID |
| `court_room_id` | Test court room ID |
| `case_urn` | Test case URN |

---

## Rotating a credential

1. Update the value in `http-client.private.env.json`
2. Commit and push — git-crypt encrypts automatically on commit
3. Teammates receive the new value on next `git pull` and `git-crypt unlock`

---

## Maintainer — adding a new developer

1. They clone the repo and install `git-crypt`
2. Export the team key from the GitHub Actions secret `GIT_CRYPT_KEY`:

```bash
# Retrieve and decode the key from GitHub Actions secret
gh secret list --repo hmcts/cp-crime-api-testing-collections
# Then share amp.team.key with the new developer via a secure channel
```

3. New developer runs `git-crypt unlock /path/to/amp.team.key`

---

## Auto-sync

`scripts/sync-collections.js` runs weekly (Monday 08:00 UTC) via GitHub Actions. For each API in `cp-crime-api-specs.json` it:

1. Fetches the latest version from SwaggerHub
2. Finds the `# Spec: <url> — vX.X.X` line in the `.http` file
3. Updates the version if it has changed
4. Commits directly to `main`

Run locally at any time:

```bash
node scripts/sync-collections.js
```

**Adding a new API:** add an entry to `cp-crime-api-specs.json` and add a `# Spec: <swaggerhub-url> — vX.X.X` comment in the relevant section of the `.http` file.

# CP Crime API Testing Collections

IntelliJ HTTP Client collections for manual and exploratory testing of CP Crime APIM APIs across HMPP and VP environments.

## Collections

| Folder | File | Description |
|--------|------|-------------|
| `hmpp/` | `HearingResultsDocumentSubscription.http` | HRDS subscription and document APIs via APIM |
| `hmpp/` | `HearingResultsDocumentSubscription-ingress.http` | HRDS APIs called directly via ingress |
| `hmpp/` | `Entra.http` | Obtain an Entra ID access token for HMPP |
| `vp/` | `CrimeProsecutionCaseDetails.http` | Prosecution case detail queries |
| `vp/` | `CaseIdMapper.http` | Case ID mapping lookups |
| `vp/` | `CourtSchedule.http` | Court schedule lookup by case URN |
| `vp/` | `Courthouses.http` | Court house lookup by court ID and court room ID |
| `vp/` | `Entra.http` | Obtain an Entra ID access token for VP |

---

## Setup

### 1. Environment config (`http-client.env.json`)

Each folder contains an `http-client.env.json` with non-sensitive base URLs, tenant IDs, and scopes pre-filled for `dev`, `sit`, `preprod`, and `prod`. No changes needed for `dev`.

### 2. Private credentials (`http-client.private.env.json`)

There is **one** private credentials file at the repo root. Create it (it is git-ignored and must never be committed):

```bash
touch http-client.private.env.json
```

Populate it with your credentials:

```json
{
  "dev": {
    "vp_subscription_key": "<your-vp-apim-subscription-key>",
    "hmpp_subscription_key": "<your-hmpp-apim-subscription-key>",
    "client_id": "<your-client-id>",
    "client_secret": "<your-client-secret>"
  }
}
```

| Variable | Description |
|----------|-------------|
| `vp_subscription_key` | APIM subscription key for VP APIs (`Ocp-Apim-Subscription-Key`) |
| `hmpp_subscription_key` | APIM subscription key for HMPP APIs (`Ocp-Apim-Subscription-Key`) |
| `client_id` | Entra ID client (app) ID |
| `client_secret` | Entra ID client secret |

---

## Running requests

1. Open a `.http` file in IntelliJ IDEA or any JetBrains IDE.
2. Select the environment (`dev`, `sit`, etc.) from the environment dropdown in the top-right of the editor.
3. Run `Entra.http` first to obtain an access token — subsequent requests use the token automatically via environment variable chaining.
4. Run the desired request.

---

## Claude Code Skills

This repo includes two [Claude Code](https://claude.ai/claude-code) skills in `.claude/skills/` for automating common tasks.

### `/swagger-to-http`

Generates or updates an IntelliJ HTTP Client collection from a SwaggerHub spec.

```
/swagger-to-http https://app.swaggerhub.com/apis/HMCTS-DTS/api-cp-crime-foo
/swagger-to-http https://app.swaggerhub.com/apis/HMCTS-DTS/api-cp-crime-foo/1.2.0 vp/
```

- Accepts a URL with or without a version — if no version is given, the latest is resolved automatically
- Creates the `.http` file, updates `http-client.env.json`, `swagger-specs.json`, and `README.md`

### `/create-pr`

Raises a GitHub PR with a structured description and posts the PR link as a comment on the JIRA ticket.

```
/create-pr
```

- Checks all HTTP collections are in sync with their Swagger specs before raising the PR (`swagger-specs.json`)
- Extracts the JIRA ticket from the branch name and links it in the PR body
- Optionally creates a Confluence release page when shipping to SIT

---

## Environments

| Environment | APIM base URL |
|-------------|--------------|
| `dev` | `https://spnl-dev-apim-int-gw.cpp.nonlive` |
| `sit` | TBC |
| `preprod` | TBC |
| `prod` | TBC |
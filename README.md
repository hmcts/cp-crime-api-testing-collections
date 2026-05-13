# CP Crime API Testing Collections

IntelliJ HTTP Client collections for manual and exploratory testing of CP Crime APIM APIs across HMPP and VP environments.

## Collections

| Folder | File | Description |
|--------|------|-------------|
| `hmpps/` | `HearingResultsDocumentSubscription.http` | HRDS subscription and document APIs via APIM |
| `hmpps/` | `HearingResultsDocumentSubscription-ingress.http` | HRDS APIs called directly via ingress |
| `hmpps/` | `Entra.http` | Obtain an Entra ID access token for HMPPS |
| `vp/` | `CrimeProsecutionCaseDetails.http` | Prosecution case detail queries |
| `vp/` | `CaseIdMapper.http` | Case ID mapping lookups |
| `vp/` | `CourtSchedule.http` | Court schedule lookup by case URN |
| `vp/` | `Courthouses.http` | Court house lookup by court ID and court room ID |
| `vp/` | `Entra.http` | Obtain an Entra ID access token for VP |

---

## Setup

### 1. Environment config (`http-client.env.json`)

Each folder contains an `http-client.env.json` with placeholder values for base URLs, tenant IDs, and scopes across `dev`, `sit`, `preprod`, and `prod`. This file is tracked in git — do not put real credentials here.

### 2. Private credentials (`http-client.private.env.json`)

Each folder also expects an `http-client.private.env.json` with your real values. This file is gitignored and never committed.

Copy the template from the corresponding `http-client.env.json` and fill in the real values:

```
hmpps/http-client.private.env.json   ← HMPPS credentials (apim_base_url, ingress_base_url, subscription key, client ID/secret, etc.)
vp/http-client.private.env.json      ← VP credentials (waf_base_url, apim_base_url, subscription key, client ID/secret, etc.)
```

IntelliJ merges both files automatically — private values take precedence over the shared env file.

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
/swagger-to-http https://app.swaggerhub.com/apis/HMCTS-DTS/api-cp-crime-prosecution-case-details
/swagger-to-http https://app.swaggerhub.com/apis/HMCTS-DTS/api-cp-crime-schedulingandlisting-courtschedule
/swagger-to-http https://app.swaggerhub.com/apis/HMCTS-DTS/api-cp-refdata-courthearing-courthouses
/swagger-to-http https://app.swaggerhub.com/apis/HMCTS-DTS/api-cp-crime-hearing-results-document-subscription hmpps/
```

- Accepts a URL with or without a version — if no version is given, the latest is resolved automatically
- Creates the `.http` file, updates `http-client.env.json` and `README.md`

### `/create-pr`

Commits and pushes changes directly to `main`.

```
/create-pr
```

- Checks all HTTP collections are in sync with their Swagger specs by comparing the `# Spec:` version in each `.http` file against the latest on SwaggerHub
- Stages, commits, and pushes directly to `main`

---

## Environments

| Environment | APIM base URL |
|-------------|--------------|
| `dev` | `https://spnl-dev-apim-int-gw.cpp.nonlive` |
| `sit` | TBC |
| `preprod` | TBC |
| `prod` | TBC |
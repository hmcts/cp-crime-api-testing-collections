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
| `vp/` | `Entra.http` | Obtain an Entra ID access token for VP |

---

## Setup

### 1. Environment config (`http-client.env.json`)

Each folder contains an `http-client.env.json` with non-sensitive base URLs, tenant IDs, and scopes pre-filled for `dev`, `sit`, `preprod`, and `prod`. No changes needed for `dev`.

### 2. Private credentials (`http-client.private.env.json`)

Copy the sample and fill in your credentials — this file is git-ignored and must never be committed.

```bash
# HMPP
cp hmpp/http-client.private.env.json.sample hmpp/http-client.private.env.json

# VP
cp vp/http-client.private.env.json.sample vp/http-client.private.env.json
```

Edit the copied file and replace the placeholders:

```json
{
  "dev": {
    "subscription_key": "<your-apim-subscription-key>",
    "client_id": "<your-client-id>",
    "client_secret": "<your-client-secret>"
  }
}
```

| Variable | Description |
|----------|-------------|
| `subscription_key` | APIM subscription key (`Ocp-Apim-Subscription-Key`) |
| `client_id` | Entra ID client (app) ID |
| `client_secret` | Entra ID client secret |

---

## Running requests

1. Open a `.http` file in IntelliJ IDEA or any JetBrains IDE.
2. Select the environment (`dev`, `sit`, etc.) from the environment dropdown in the top-right of the editor.
3. Run `Entra.http` first to obtain an access token — subsequent requests use the token automatically via environment variable chaining.
4. Run the desired request.

---

## Environments

| Environment | APIM base URL |
|-------------|--------------|
| `dev` | `https://spnl-dev-apim-int-gw.cpp.nonlive` |
| `sit` | TBC |
| `preprod` | TBC |
| `prod` | TBC |
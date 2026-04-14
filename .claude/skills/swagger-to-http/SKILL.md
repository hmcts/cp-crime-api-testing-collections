# Skill: Swagger to HTTP Collection

## Trigger

Invoke this skill when the user provides a SwaggerHub or OpenAPI URL and asks to generate or update an IntelliJ HTTP Client collection (`.http` file).

Invocation command: `/swagger-to-http`

---

## Process

### Step 1 — Resolve the spec URL

The user will provide a SwaggerHub URL, either with or without a version:

**With version:**
```
https://app.swaggerhub.com/apis/HMCTS-DTS/api-cp-crime-foo/1.1.0
```
Convert directly to the raw JSON spec URL:
```
https://api.swaggerhub.com/apis/HMCTS-DTS/api-cp-crime-foo/1.1.0/swagger.json
```

**Without version (auto-resolve latest):**
```
https://app.swaggerhub.com/apis/HMCTS-DTS/api-cp-crime-foo
```
Fetch the API index to discover the latest version:
```
https://api.swaggerhub.com/apis/HMCTS-DTS/api-cp-crime-foo
```
From the JSON response, find the latest version by reading `apis[0].properties` — look for the entry where `type` is `"X-Version"` and take its `value`. Then construct:
```
https://api.swaggerhub.com/apis/HMCTS-DTS/api-cp-crime-foo/<latest-version>/swagger.json
```

Fetch the spec using WebFetch.

---

### Step 2 — Parse the spec

From the fetched OpenAPI/Swagger JSON, extract:
- `info.title` and `info.version` — for the file header comment
- `servers[0].url` or `basePath` — note it but do NOT hardcode it (use env vars instead)
- All `paths` entries:
  - HTTP method (GET, POST, PUT, DELETE, PATCH)
  - Path string (e.g. `/case/{case_urn}/courtschedule`)
  - `summary` — used as the request comment
  - `parameters` — path, query, and header params
  - `requestBody` — schema for POST/PUT bodies

---

### Step 3 — Determine target folder and env file

Ask the user (or infer from context) which folder to write to — `hmpp/` or `vp/` — based on the API domain:
- HRDS / subscription APIs → `hmpp/`
- Reference data, scheduling, prosecution case → `vp/`

Read the existing `http-client.env.json` in that folder to understand what variables are already available (e.g. `access_token`, `waf_base_url`, `apim_base_url`).

---

### Step 4 — Generate the `.http` file

**Naming:** derive from the API title, e.g. `CourtSchedule.http`, `Courthouses.http`.

**Format rules:**
- Start with a versioned spec comment on the first line: `# Spec: https://app.swaggerhub.com/apis/HMCTS-DTS/<api-name> — v<resolved-version>`
- One `###` block per endpoint
- Each block:
  - Comment line: `### <HTTP METHOD> <summary>`
  - Request line: `<METHOD> {{<service>_base_url}}<path>`
  - Standard headers:
    ```
    Authorization: Bearer {{access_token}}
    Ocp-Apim-Subscription-Key: {{vp_subscription_key}}   ← use vp_subscription_key for vp/ folder
    Ocp-Apim-Subscription-Key: {{hmpp_subscription_key}} ← use hmpp_subscription_key for hmpp/ folder
    ```
  - For POST/PUT, add `Content-Type: application/json` and a sample JSON body derived from the request schema (use placeholder values, not real data)
  - For path parameters like `{court_id}`, replace with `{{court_id}}` (IntelliJ double-brace syntax)
  - For query parameters, append as `?param={{param_name}}`
- Where the API has both WAF and APIM variants, generate two blocks per endpoint (WAF first, then APIM), using `{{waf_base_url}}` and `{{apim_base_url}}` respectively
- End each block with `###`

**Example output (vp/ folder):**
```
# Spec: https://app.swaggerhub.com/apis/HMCTS-DTS/api-cp-refdata-courthearing-courthouses — v1.1.0

### GET Retrieve court house by court ID
GET {{courthouses_base_url}}/courthouses/{{court_id}}
Authorization: Bearer {{access_token}}
Ocp-Apim-Subscription-Key: {{vp_subscription_key}}

###

### GET Retrieve court house by court ID and court room ID
GET {{courthouses_base_url}}/courthouses/{{court_id}}/courtrooms/{{court_room_id}}
Authorization: Bearer {{access_token}}
Ocp-Apim-Subscription-Key: {{vp_subscription_key}}

###
```

---

### Step 5 — Update `http-client.env.json` and `swagger-specs.json`

**`http-client.env.json`:** For each new base URL or path parameter variable introduced in Step 4:
- Add a placeholder entry to every environment block (`dev`, `sit`, `preprod`, `prod`) in the folder's `http-client.env.json`
- Use the naming convention: `<env>-<variable-name>`, e.g. `<dev-courthouses-base-url>`
- Do NOT overwrite existing variables
- For subscription key, use the namespaced form: `vp_subscription_key` for `vp/` collections, `hmpp_subscription_key` for `hmpp/` collections

**`swagger-specs.json`:** Add a new entry mapping the `.http` file to the base SwaggerHub URL (without version):
```json
"vp/NewCollection.http": "https://app.swaggerhub.com/apis/HMCTS-DTS/api-cp-crime-new-api"
```
Do NOT include the version in the URL stored here — the version is resolved dynamically at runtime.

**Private credentials:** There is ONE `http-client.private.env.json` at the repo root (gitignored). Do NOT create per-folder private env files. If the user doesn't have this file yet, instruct them to create it at the repo root with `vp_subscription_key`, `hmpp_subscription_key`, `client_id`, and `client_secret` per environment.

---

### Step 6 — Update README

In `README.md` at the repo root, add a row to the collections table:
```
| `<folder>/` | `<FileName>.http` | <one-line description> |
```

---

### Step 7 — Commit and push

```bash
git add <folder>/<FileName>.http <folder>/http-client.env.json swagger-specs.json README.md
git commit -m "Add <FileName> collection for <FOLDER> — <summary of endpoints>"
git push origin main
```

---

## Rules

- **Never hardcode real values** — all URLs, IDs, keys, and secrets must be `{{variable}}` placeholders
- **Always use double braces** `{{var}}` not single `{var}` — IntelliJ HTTP Client syntax
- **Always add `access_token`** — assume `Entra.http` in the same folder provides it via `client.global.set`
- **Derive the base URL variable name** from the API name, e.g. `courthouses_base_url`, `court_schedule_base_url`
- **Use namespaced subscription key** — `{{vp_subscription_key}}` in `vp/`, `{{hmpp_subscription_key}}` in `hmpp/`
- **One `.http` file per API** — do not merge multiple unrelated APIs into one file
- **Check existing env file** before adding variables — avoid duplicates
- **Update README and swagger-specs.json** — always keep both current

---

## Example invocations

```
# With explicit version
/swagger-to-http https://app.swaggerhub.com/apis/HMCTS-DTS/api-cp-caseadmin-case-urn-mapper/1.0.8

# Auto-resolve latest version
/swagger-to-http https://app.swaggerhub.com/apis/HMCTS-DTS/api-cp-crime-prosecution-case-details
/swagger-to-http https://app.swaggerhub.com/apis/HMCTS-DTS/api-cp-crime-schedulingandlisting-courtschedule
/swagger-to-http https://app.swaggerhub.com/apis/HMCTS-DTS/api-cp-refdata-courthearing-courthouses
/swagger-to-http https://app.swaggerhub.com/apis/HMCTS-DTS/api-cp-crime-hearing-results-document-subscription

```
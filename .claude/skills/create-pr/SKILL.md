# Skill: Commit to main

## Trigger

Invoke this skill when a user asks to create a pull request, raise a PR, open a PR, commit, or push changes.

Invocation command: `/create-pr`

> **Note:** This repo uses direct commits to `main` — no branches or PRs.

---

## Process

### Step 0 — Check HTTP collections are up to date with their Swagger specs

Before doing anything else, verify every `.http` collection was generated from the latest spec version.

**0a. Find all collections with a spec**

Grep all `.http` files for lines matching `# Spec:`:
```bash
grep -r "# Spec:" --include="*.http" -l .
```

Each matching file contains a line in this format:
```
# Spec: https://app.swaggerhub.com/apis/HMCTS-DTS/<api-name> — v<version>
```

Parse out the base URL and the pinned version from that line.

**0b. Resolve the latest version for each**

For each base URL found, fetch the SwaggerHub index:
```
https://api.swaggerhub.com/apis/HMCTS-DTS/<api-name>
```
Find the highest version by scanning all entries in the `apis` array for `properties` entries where `type` is `"X-Version"`, collect all their `value` fields, and take the highest semver.

**0c. Compare pinned vs latest**

For each `.http` file, compare the pinned version from the `# Spec:` comment against the resolved latest version.

**0d. Act on findings**

- **If all pinned versions match latest:** print `✓ All HTTP collections are up to date.` and proceed to Step 1.

- **If any collection is behind:** stop and report:
  ```
  ⚠ HTTP collection out of date: vp/Courthouses.http
    Pinned: v1.1.0 — Latest: v1.2.0

  Run /swagger-to-http https://app.swaggerhub.com/apis/HMCTS-DTS/api-cp-refdata-courthearing-courthouses to regenerate, then re-run /create-pr.
  ```
  Do NOT proceed until the user updates the collection or explicitly confirms they want to skip.

- **If the SwaggerHub index is unreachable** (network error, 404): warn but do not block:
  ```
  ⚠ Could not reach SwaggerHub for vp/Courthouses.http. Skipping freshness check for this file.
  ```

---

### Step 1 — Check git state

```bash
git status
git diff --stat
```

- If on a branch other than `main`, switch: `git checkout main`
- If there are **no uncommitted changes**, stop: *"Nothing to commit."*

### Step 2 — Stage and commit

Stage all changed files:
```bash
git add <files>
```

Draft a concise commit message describing what changed — follow the style of recent commits in this repo (descriptive, no ticket prefix):
```
Add <FileName> collection for <FOLDER> — <summary of endpoints>
```

Commit:
```bash
git commit -m "$(cat <<'EOF'
<message>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### Step 3 — Push to main

```bash
git push origin main
```

---

## Rules

- **Always commit directly to `main`** — no branches, no PRs
- **Never force-push**
- **Follow the commit message style** of this repo: descriptive, no ticket prefix (e.g. `Add CaseIdMapper collection for VP — GET /urnmapper/{case_urn}`)
- If `git push` fails due to a remote conflict, run `git pull --rebase origin main` then push again

---

## Example commit message

```
Add CaseIdMapper collection for VP — GET /urnmapper/{case_urn}
```
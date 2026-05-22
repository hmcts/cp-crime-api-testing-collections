#!/usr/bin/env node
'use strict';

// Checks each spec registered in cp-crime-api-specs.json against SwaggerHub.
// For any version bump, updates the matching `# Spec: <url> — vX.X.X` line in the .http file.
// Runs weekly via GitHub Actions (sync-api-collections.yml). Safe to run locally too.

const https = require('https');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SPECS_FILE = path.join(REPO_ROOT, 'cp-crime-api-specs.json');

const { swaggerhub: { owner }, collections } = JSON.parse(fs.readFileSync(SPECS_FILE, 'utf8'));

// ── SwaggerHub helpers ────────────────────────────────────────────────────────

function get(url) {
  return new Promise((resolve, reject) => {
    const { hostname, pathname, search } = new URL(url);
    https.get({ hostname, path: pathname + search }, (res) => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function latestVersion(apiUrl) {
  const apiName = apiUrl.split('/').pop();
  const info = await get(`https://api.swaggerhub.com/apis/${owner}/${apiName}?limit=1&sort=CREATED&order=DESC`);
  return info?.apis?.[0]?.properties?.find(p => p.type === 'X-Version')?.value ?? null;
}

// ── Per-file update ───────────────────────────────────────────────────────────

function updateSpecLine(content, apiUrl, version) {
  // Matches: # Spec: https://.../<api-name> — vX.X.X
  const apiName = apiUrl.split('/').pop();
  const re = new RegExp(`(# Spec: https://[^\\s]*${apiName}[^\\s]* — )v[\\d.]+`, 'g');
  return content.replace(re, `$1v${version}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function sync() {
  let anyChanged = false;

  for (const [filePath, apis] of Object.entries(collections)) {
    const absPath = path.join(REPO_ROOT, filePath);
    if (!fs.existsSync(absPath)) {
      console.warn(`[SKIP] File not found: ${filePath}`);
      continue;
    }

    let content = fs.readFileSync(absPath, 'utf8');
    let fileChanged = false;
    const apiList = Array.isArray(apis) ? apis : [apis];

    for (const apiUrl of apiList) {
      const apiName = apiUrl.split('/').pop();
      let version;
      try {
        version = await latestVersion(apiUrl);
      } catch (e) {
        console.error(`[ERROR] ${apiName}: ${e.message}`);
        continue;
      }

      if (!version) {
        console.log(`[SKIP] ${apiName}: no version found`);
        continue;
      }

      const updated = updateSpecLine(content, apiUrl, version);
      if (updated !== content) {
        content = updated;
        fileChanged = true;
        console.log(`[UPDATED] ${filePath} — ${apiName} → v${version}`);
      } else {
        console.log(`[OK] ${filePath} — ${apiName} v${version}`);
      }
    }

    if (fileChanged) {
      fs.writeFileSync(absPath, content, 'utf8');
      anyChanged = true;
    }
  }

  if (!anyChanged) console.log('\nAll collections are up to date.');
}

sync().catch(err => { console.error(err); process.exit(1); });

# Phase 2 — Supabase Secret Setup

The bridge now knows how to publish files into the private Supabase Storage bucket.

One user-side secret is required before the publish step can actually run:

## Add the GitHub Actions secret

1. Open the **Shannon-AI-File-Bridge** repository on GitHub.
2. Go to **Settings** → **Secrets and variables** → **Actions**.
3. Choose **New repository secret**.
4. Name it exactly:

`SUPABASE_SERVICE_ROLE_KEY`

5. In a separate browser tab, open the **Shannon AI File Bridge** Supabase project.
6. Open the project's API/settings area and copy the **service role key**.
7. Paste that key into the GitHub secret value.
8. Save the secret.

**Never put the service role key into a repository file, commit, issue, chat message, or screenshot.** The bridge only reads it through GitHub Actions secrets.

## What happens after the secret exists

The next bridge run will:

1. Download the Proton file as before.
2. Calculate its SHA-256 hash.
3. Upload it to the private `bridge-files` bucket.
4. Record the file in `public.bridge_files`.
5. Record the sync run in `public.bridge_runs`.
6. Leave the GitHub artifact in place for short-term diagnostics.

The first target path is:

`proton/<original filename>`

Later, Phase 3 will replace the single public-share source with whole-Drive discovery and preserve the actual Proton folder path.


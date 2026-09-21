# Shannon AI File Bridge — Project Roadmap

## Current status

- [x] Phase 1 — Proton public-share browser extraction
- [x] Capture Proton's decrypted browser blob
- [x] Produce a real Excel file from Proton Drive
- [x] Upload the recovered file as a GitHub Actions artifact
- [x] Preserve the original Proton filename
- [x] Clean GitHub Actions runtime warnings
- [x] Verify end-to-end with multiple green runs

## Phase 2 — Persistent Supabase storage

- [x] Create dedicated Supabase project: Shannon AI File Bridge
- [x] Create private Storage bucket: bridge-files
- [x] Create bridge_runs registry table
- [x] Create bridge_files registry table
- [x] Verify bucket is private and database foundation exists
- [x] Add GitHub Actions secret: SUPABASE_SERVICE_ROLE_KEY
- [x] Add Supabase upload step to the bridge workflow
- [x] Upload recovered files into private Supabase Storage
- [x] Record file metadata and SHA-256 in bridge_files
- [x] Record sync execution status in bridge_runs
- [x] Verify uploaded file can be downloaded from Supabase
- [x] Keep GitHub artifact as a short-term diagnostic backup
- [ ] Add retention/cleanup policy after Supabase storage is verified

## Phase 3 — Whole Proton Drive access

- [x] Add persistent Proton Drive CLI bridge-host foundation and read-only inventory probe
- [ ] Provision the persistent bridge host and establish an authenticated Proton session
- [ ] Capture and inspect a real Proton Drive JSON inventory
- [ ] List Proton Drive folders/files
- [ ] Detect new and changed files
- [ ] Preserve Proton folder paths in Supabase
- [ ] Incrementally sync only changed files
- [ ] Handle deletions/renames safely
- [ ] Add integrity verification and retry handling

> Proton now provides an official Proton Drive CLI for Windows, macOS and Linux. It supports browser-based authentication, folder/file listing, downloads, uploads, sharing, and JSON output for automation. The remaining infrastructure challenge for this project is obtaining a persistent authenticated bridge host because the current restricted computer does not provide a reliable command-line environment.

## Phase 4 — Floot file-control panel

- [x] Connect Floot to Bridge HQ
- [x] Show registered files from Supabase
- [x] Show sync status and last-seen time
- [x] Search files by name/path/source/status
- [ ] Show Proton folder hierarchy
- [ ] Fully verify the user-facing download action
- [ ] Show version/history information
- [ ] Add safe file actions

## Anchor integration

- [x] Map Anchor as an AI-connected workspace in Bridge HQ
- [x] Confirm the connected Anchor workspace is available to ChatGPT
- [ ] Define the Bridge HQ ↔ Anchor routing model
- [ ] Add an actual automated Anchor transfer path if a supported backend/API integration becomes available
- [ ] Keep Anchor useful for durable project notes, documentation and AI collaboration even when automatic binary-file transfer is not available

## Phase 5 — ChatGPT working layer

- [ ] Find files by name/path/content metadata
- [ ] Retrieve the current file
- [ ] Inspect and analyse files
- [ ] Create new versions safely
- [ ] Preserve backups and change history
- [ ] Return updated files to the cloud
- [ ] Build a reliable human + AI editing workflow

## Future bulk-storage candidates

- [ ] Evaluate TeraBox as a large-capacity bulk storage option after the core bridge project is complete
- [ ] Compare privacy, API/automation support, reliability, limits and suitability before adopting it

## Operating rules

1. Never commit credentials or secrets to GitHub.
2. Keep important source files private in Supabase Storage.
3. Do not casually overwrite master files.
4. Preserve version history and backups.
5. Validate every meaningful transfer.
6. Keep the working bridge observable through logs and registry records.
7. Treat each storage provider as a replaceable connector rather than rebuilding the bridge around one provider.

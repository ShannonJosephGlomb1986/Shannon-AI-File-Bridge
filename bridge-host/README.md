# Persistent Proton Drive Bridge Host

This directory contains the host-side foundation for Phase 3 of Shannon AI File Bridge.

## Why this exists

The current GitHub Actions bridge is intentionally preserved as the working public-share compatibility path. GitHub Actions runners are ephemeral, so they are not the right place to keep a long-lived Proton Drive login session.

The next architecture is:

```
Restricted PC
    ↓
Proton Drive
    ↓
Persistent Bridge Host
    ↓
Proton Drive CLI
    ↓
Bridge inventory / transfer engine
    ↓
Supabase private vault + registry
    ↓
Floot Bridge HQ / Anchor / ChatGPT
```

The bridge host will eventually keep an authenticated Proton Drive CLI session, maintain a local encrypted/cache state, receive change events, and transfer only the files that need to move.

## Current Phase 3 milestone

**Host foundation only.**

The files here deliberately do not modify Proton Drive and do not yet perform an unattended recurring sync. First we verify the host, CLI installation, authentication, and real JSON inventory output. The inventory format is then used to build the event-driven sync layer.

## Official Proton CLI

Proton's official Proton Drive CLI currently runs on Linux, Windows, and macOS. It uses browser-based authentication and stores the authenticated session in the operating system's credential store. It supports machine-readable JSON output with `--json` / `-j`. See the official documentation before installing a release:

- https://proton.me/support/drive-cli
- https://proton.me/download/drive/cli
- https://github.com/ProtonDriveApps/sdk/tree/main/cli

For Linux, the official CLI documents `libsecret` as the credential-store backend.

## Host bootstrap

The intended first host is a small Linux VM with persistent disk.

### 1. Install the official CLI

Install the official Proton Drive CLI release on the VM and make sure:

```bash
proton-drive version
```

returns a version.

Do not download or execute an unofficial Proton-branded client for this bridge.

### 2. Authenticate the bridge account

Run:

```bash
proton-drive auth login
```

The login flow is browser-based. The host must therefore provide a practical way for the user to complete the browser authentication flow.

**Important:** a completely headless server may require an additional browser-access arrangement. Do not put a Proton password into a shell script, GitHub secret, or this repository.

### 3. Verify access without changing Drive

Run:

```bash
proton-drive filesystem list -j /my-files
```

Then run the repository probe:

```bash
chmod +x bridge-host/inventory-probe.sh
./bridge-host/inventory-probe.sh
```

The probe saves the raw JSON inventory locally and prints a compact summary. It does not upload, rename, delete, move, or modify anything in Proton Drive.

### 4. What comes next

After a real inventory capture is available, the bridge will add:

1. folder-aware inventory records;
2. stable provider/path identity;
3. event-driven change detection;
4. download of new/changed files;
5. SHA-256 verification;
6. safe Supabase registry updates;
7. history, retry, and deletion/rename handling.

We will not treat a CLI exit code alone as proof that an entire transfer succeeded. Proton's current SDK issue tracker has documented cases where a transfer can report success while some files are missing, so integrity verification belongs in our design. This is particularly important for large Drive trees.

## Security rules

- Never commit Proton credentials or session files.
- Prefer the operating system credential store.
- Do not use the CLI's `unsafe_file` credential store in production.
- Keep the Proton session on the private bridge host.
- Keep Supabase service-role credentials out of source control.
- Do not expose a raw Proton authenticated session through Floot.
- Keep the existing public-share GitHub Actions bridge as a known-good compatibility path until the whole-Drive host path has passed validation.

## Current status

- GitHub Actions public-share bridge: working
- Supabase private vault/registry: working
- Floot Bridge HQ: working
- Anchor mapping: working
- Persistent Proton host: not provisioned yet
- Whole-Drive inventory: pending first host login
- Event-driven sync: pending

# Shannon AI File Bridge

Cloud bridge for moving files between Proton Drive, Supabase, Floot, Anchor, and other AI-accessible services.

## Current milestone

**Phase 1 complete:** Proton public-share → GitHub Actions → real decrypted file → GitHub artifact.

**Phase 2 complete except retention/cleanup:** GitHub Actions → private Supabase Storage + file/sync registry.

**Phase 3 started:** persistent Proton Drive CLI bridge-host foundation added. The existing GitHub Actions bridge remains intact as the known-good compatibility path.

See [BRIDGE-ROADMAP.md](BRIDGE-ROADMAP.md) for the full checklist and project plan.

## Architecture

```
Restricted PC
   ↓
Provider storage (currently Proton Drive)
   ↓
Provider connector / persistent bridge host
   ↓
Supabase private vault + registry
   ↓
Floot Bridge HQ
   ↙        ↘
Anchor     ChatGPT
```

Storage providers are replaceable connectors. Proton is the first connector; future providers should plug into the same control model rather than require a new bridge architecture.

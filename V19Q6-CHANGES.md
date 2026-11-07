# 7salah Scholar V19q.6 — Shared Academic Content Moderation

## Added
- Explicit submission action from an existing local PDF to the shared academic library.
- Pending / approved / rejected content lifecycle.
- Shared library listing displays approved resources only.
- Admin review panel with PDF preview, approve, and reject actions.
- Private Supabase Storage bucket with owner/admin/approved-resource read policy.
- Separate optional SQL migration: `academic-library-moderation.sql`.

## Safety and compatibility
- Existing local IndexedDB library remains unchanged.
- Existing SQL files are not modified; the new migration is additive and separate.
- No existing Supabase schema was changed remotely by this build.
- No service-role key is used in browser code.
- Students cannot set status to approved; only guarded admin RPC can review pending submissions.
- Upload occurs only after an explicit user action.

## Required setup
Apply `academic-library-moderation.sql` manually in Supabase SQL Editor and assign `profiles.is_admin=true` only to the intended moderator account. Until then, shared-library and moderation calls will show a setup error; local library remains available.

## Validation
Static JavaScript syntax and archive integrity checks are run for this package. Live Supabase RLS, Storage policies, upload, signed URL access, and moderation RPC require testing in the user's Supabase project and are not represented as passed here.

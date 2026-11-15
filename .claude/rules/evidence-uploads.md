---
paths:
  - "portal/it-support-shared.js"
  - "portal/app.js"
  - "supabase/migrations/*evidence*"
  - "supabase/migrations/*storage*"
---

# Evidence uploads and Storage (media)

Updated 2026-11-14. Design: header of `supabase/migrations/20261015120000_lab_evidence_storage.sql`.
The portal has no SCORM packages; this is the only media path.

- Store lab evidence only in the private `lab-evidence` bucket.
- Use the path `<track_code>/<user_id>/<module_key>/<lab_key>/<attempt_id>/<field>.<ext>`.
- Students upload only into their own folder, while enrolled, with a valid site session.
- Never allow uploads or swaps after the attempt row exists.
- Never allow updates to stored evidence objects.
- Let only admins and the course's assigned instructor read evidence.
- Treat the upload and its attempt row as one submission.
- If the attempt write fails, delete the uploaded files and keep the picked files for retry.
- Never keep file bytes in browser storage; keep only name, size and time.
- Never make a bucket public.

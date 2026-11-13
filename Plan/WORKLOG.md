

## 20. Blog categories and compressed cover uploads — 2026-11-14

The Super Admin Blog Editor now supports adding categories from the editor. New names are normalized into safe slugs, duplicate categories are rejected, and the newly added category is selected for the current post.

Cover image upload now accepts JPEG, PNG, and WebP files, rejects unsupported types and originals above 12 MB, resizes the longest edge to 1600px, converts to WebP, and iteratively compresses to a maximum of 450 KB. The compressed file is sent as multipart form data with `folder=blog-posts` to `VITE_BLOG_MEDIA_UPLOAD_ENDPOINT`; a successful endpoint response supplies the durable R2 URL/key used by the Blog Post cover field.

Because this repository currently has no deployed Cloudflare Worker/Pages Function or R2 binding, an unset endpoint uses a local data-URL fallback for preview only. Production still needs the authenticated R2 endpoint, bucket binding, public/custom-domain or signed URL policy, CORS, database persistence, orphan cleanup, and audit/rate-limit controls.

Typecheck and production build passed. Lint passed with the repository's existing seven non-blocking warnings.

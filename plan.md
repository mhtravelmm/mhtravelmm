

### Super Admin Blog category and Cloudflare R2 media update — 2026-11-14
- Blog Post Editor now lets Super Admin add a new category during post creation. Category names are normalized to safe slugs, duplicate names are rejected, and the new category is selected immediately for the current editor session.
- Cover images now accept JPEG, PNG, and WebP uploads. The browser validates the file type and original size, resizes the longest edge to at most 1600px, converts the image to WebP, and repeatedly compresses it to a maximum of 450 KB before upload.
- `src/lib/blogMediaApi.ts` sends the compressed file as multipart form data to `VITE_BLOG_MEDIA_UPLOAD_ENDPOINT`, with `folder=blog-posts`. The expected endpoint returns the durable Cloudflare R2 URL and object key; the editor stores that URL in the Blog Post cover-image field and reports the final KB size.
- When the upload endpoint is not configured, the editor uses a local data-URL preview fallback so design testing remains usable. Production still requires the Cloudflare Worker/Pages Function endpoint, R2 binding, authenticated Super Admin authorization, object-key sanitization, content-type/size validation, and the public URL/CDN policy.

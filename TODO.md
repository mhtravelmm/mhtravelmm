

## Super Admin Blog categories and Cloudflare R2 cover images — 2026-11-14

### Completed frontend behavior
- [x] Add a Blog Editor control that creates a new category, normalizes its slug, rejects duplicates, and selects the new category for the current post.
- [x] Accept JPEG, PNG, and WebP cover images and reject unsupported types or originals larger than 12 MB.
- [x] Resize cover images to a maximum 1600px longest edge, convert them to WebP, and compress them to no more than 450 KB before upload.
- [x] Show the final compressed size and whether the image used the R2 endpoint or local preview fallback.
- [x] Send compressed cover images as multipart form data with `folder=blog-posts` to the configured media endpoint and store the returned URL in the Blog Post editor.

### Production R2 integration still required
- [ ] Configure `VITE_BLOG_MEDIA_UPLOAD_ENDPOINT` to a deployed authenticated Cloudflare Worker/Pages Function that binds the intended R2 bucket.
- [ ] Implement the server-side multipart endpoint to validate the Super Admin session, enforce `blog-posts/` object keys, validate WebP content/size, upload to R2, and return the durable URL/key.
- [ ] Configure the R2 public/custom-domain URL or signed-download policy and CORS for the admin origin.
- [ ] Persist the R2 URL/key and custom category in Blog Post/category database records; replace local editor state and preview data URLs with API records.
- [ ] Add orphan-image cleanup when a draft is abandoned or a cover image is replaced, plus audit logging and rate limits.

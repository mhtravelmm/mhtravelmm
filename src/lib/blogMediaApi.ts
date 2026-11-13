const MAX_COVER_BYTES = 450 * 1024;
const MAX_COVER_DIMENSION = 1600;

export type BlogCoverUploadResult =
  | { ok: true; url: string; key: string; bytes: number; source: 'r2' | 'preview' }
  | { ok: false; message: string };

type CompressedImage = { file: File; dataUrl: string };

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('The selected image could not be read.')); };
    image.src = url;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('The compressed image preview could not be created.'));
    reader.readAsDataURL(blob);
  });
}

async function compressCoverImage(source: File): Promise<CompressedImage> {
  const image = await loadImage(source);
  const scale = Math.min(1, MAX_COVER_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image compression is not supported in this browser.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let blob: Blob | null = null;
  for (const quality of [0.82, 0.68, 0.54, 0.4]) {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (blob && blob.size <= MAX_COVER_BYTES) break;
  }
  if (!blob) throw new Error('The browser could not compress this image.');
  if (blob.size > MAX_COVER_BYTES) throw new Error('Image is still larger than 450 KB after compression. Choose a smaller image.');
  const file = new File([blob], `${source.name.replace(/\.[^.]+$/, '') || 'blog-cover'}.webp`, { type: 'image/webp' });
  return { file, dataUrl: await blobToDataUrl(blob) };
}

export async function uploadBlogCoverImage(source: File): Promise<BlogCoverUploadResult> {
  if (!source.type.startsWith('image/')) return { ok: false, message: 'Choose an image file.' };
  if (source.size > 12 * 1024 * 1024) return { ok: false, message: 'Original image must be 12 MB or smaller.' };

  try {
    const compressed = await compressCoverImage(source);
    const endpoint = import.meta.env.VITE_BLOG_MEDIA_UPLOAD_ENDPOINT as string | undefined;
    if (!endpoint) return { ok: true, url: compressed.dataUrl, key: `preview/blog-posts/${compressed.file.name}`, bytes: compressed.file.size, source: 'preview' };

    const body = new FormData();
    body.append('file', compressed.file, compressed.file.name);
    body.append('folder', 'blog-posts');
    body.append('contentType', compressed.file.type);
    const response = await fetch(endpoint, { method: 'POST', body });
    const payload = await response.json().catch(() => ({})) as { url?: string; key?: string; message?: string };
    if (!response.ok || !payload.url) return { ok: false, message: payload.message || 'Cloudflare R2 upload failed. Check the media API.' };
    return { ok: true, url: payload.url, key: payload.key || `blog-posts/${compressed.file.name}`, bytes: compressed.file.size, source: 'r2' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Image compression/upload failed.' };
  }
}

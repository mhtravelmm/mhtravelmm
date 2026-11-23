import {
  AD_VIDEO,
  MAX_ORIGINAL_BYTES,
  MEDIA_RULES,
  checkMedia,
  mediaKind,
  type MediaFolder,
  type MediaKind,
  type MediaRejection,
} from './mediaRules';

class MediaError extends Error {
  constructor(readonly code: MediaErrorCode) {
    super(code);
  }
}

/** Failures carry a code so the editor can translate them; see `cw_media_*`. */
export type MediaErrorCode =
  | 'choose_image'
  | 'original_too_large'
  | 'unreadable'
  | 'preview_failed'
  | 'unsupported'
  | 'compress_failed'
  | 'still_large'
  | 'r2_failed'
  | 'generic'
  | MediaRejection;

export type MediaUploadResult =
  | { ok: true; url: string; key: string; bytes: number; kind: MediaKind; source: 'r2' | 'preview' }
  | { ok: false; code: MediaErrorCode; message: string };

export interface UploadOptions {
  /** Required for `shops`; ignored for the fixed folders. */
  shopId?: string;
  /** How many photos the shop already has, for the quota check. */
  shopPhotoCount?: number;
  shopQuota?: number;
}

type CompressedImage = { file: File; dataUrl: string };

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new MediaError('unreadable')); };
    image.src = url;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new MediaError('preview_failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts to WebP and walks the quality down until the folder's ceiling is met.
 * A detailed photo can miss 450 KB at full size even at low quality, so the
 * longest edge is halved twice more before the upload is refused.
 */
async function compressImage(source: File, maxBytes: number, maxEdge: number): Promise<CompressedImage> {
  const image = await loadImage(source);
  const longest = Math.max(image.naturalWidth, image.naturalHeight);
  let blob: Blob | null = null;

  for (const edge of [maxEdge, Math.round(maxEdge * 0.7), Math.round(maxEdge * 0.5)]) {
    const scale = Math.min(1, edge / longest);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new MediaError('unsupported');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.82, 0.68, 0.54, 0.4]) {
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
      if (blob && blob.size <= maxBytes) break;
    }
    if (blob && blob.size <= maxBytes) break;
  }

  if (!blob) throw new MediaError('compress_failed');
  if (blob.size > maxBytes) throw new MediaError('still_large');
  const base = source.name.replace(/\.[^.]+$/, '') || 'upload';
  const file = new File([blob], `${base}.webp`, { type: 'image/webp' });
  return { file, dataUrl: await blobToDataUrl(blob) };
}

/** Reads a video's length, which is what the §16A.8 fifteen-second limit needs. */
function videoSeconds(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration || 0); };
    video.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    video.src = url;
  });
}

const MESSAGES: Record<MediaErrorCode, string> = {
  choose_image: 'Choose an image file.',
  original_too_large: 'Original image must be 12 MB or smaller.',
  unreadable: 'The selected file could not be read.',
  preview_failed: 'The compressed preview could not be created.',
  unsupported: 'This browser cannot compress the image.',
  compress_failed: 'The browser could not compress this image.',
  still_large: 'The file is still above the folder limit after compression.',
  r2_failed: 'Cloudflare R2 upload failed. Check the media API.',
  generic: 'Upload failed.',
  unsupported_type: 'That file type is not allowed in this folder.',
  too_large: 'The file is larger than this folder allows.',
  video_too_long: 'The video must be 15 seconds or shorter.',
  shop_required: 'A shop id is required to upload a shop photo.',
  quota_reached: 'This shop has reached its photo quota.',
};

function fail(code: MediaErrorCode, message?: string): MediaUploadResult {
  return { ok: false, code, message: message || MESSAGES[code] };
}

/**
 * Plan §16B.6: every upload goes through here, and the folder decides the
 * limits. An image is converted to WebP before it leaves the browser; an ad
 * video is sent as MP4 unchanged because re-encoding it would take seconds and
 * lose quality. With no Worker configured the data URL is returned, so a
 * preview build still shows the picture.
 */
export async function uploadMedia(source: File, folder: MediaFolder, options: UploadOptions = {}): Promise<MediaUploadResult> {
  const kind = mediaKind(source.type);
  if (!kind) return fail('unsupported_type');

  const seconds = kind === 'video' ? await videoSeconds(source) : undefined;
  const check = checkMedia(folder, source, { ...options, seconds });
  if (!check.ok) return fail(check.code);

  if (kind === 'image' && source.size > MAX_ORIGINAL_BYTES) return fail('original_too_large');

  try {
    const prepared = kind === 'image'
      ? await compressImage(source, check.rule.maxBytes, check.rule.maxEdge ?? 1600)
      : { file: source, dataUrl: '' };
    if (kind === 'image') {
      const stored = checkMedia(folder, { type: prepared.file.type, size: prepared.file.size }, { ...options, stage: 'final' });
      if (!stored.ok) return fail(stored.code);
    }
    const bytes = prepared.file.size;
    const endpoint = import.meta.env.VITE_BLOG_MEDIA_UPLOAD_ENDPOINT as string | undefined;
    const key = `${check.prefix}${prepared.file.name}`;

    if (!endpoint) {
      return { ok: true, url: prepared.dataUrl || URL.createObjectURL(prepared.file), key: `preview/${key}`, bytes, kind, source: 'preview' };
    }

    const body = new FormData();
    body.append('file', prepared.file, prepared.file.name);
    body.append('folder', folder);
    body.append('prefix', check.prefix);
    body.append('contentType', kind === 'video' ? AD_VIDEO.accepts[0] : prepared.file.type);
    if (seconds !== undefined) body.append('seconds', String(Math.round(seconds)));
    const response = await fetch(endpoint, { method: 'POST', body });
    const payload = await response.json().catch(() => ({})) as { url?: string; key?: string; message?: string };
    if (!response.ok || !payload.url) return fail('r2_failed', payload.message);
    return { ok: true, url: payload.url, key: payload.key || key, bytes, kind, source: 'r2' };
  } catch (error) {
    if (error instanceof MediaError) return fail(error.code, error.message);
    return fail('generic', error instanceof Error ? error.message : undefined);
  }
}

/** The blog and guide editors name their own folder; the rules stay in one place. */
export function uploadContentImage(
  source: File,
  folder: Extract<MediaFolder, 'blog-posts' | 'guide-stops'>,
): Promise<MediaUploadResult> {
  return uploadMedia(source, folder);
}

/** The five folders in the order Plan §16B.6 lists them, for tests and the Worker contract. */
export const MEDIA_FOLDERS = Object.keys(MEDIA_RULES) as MediaFolder[];

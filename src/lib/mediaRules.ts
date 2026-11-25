/**
 * Plan §16B.6: every upload lands in one of five R2 folders, and the folder
 * decides the type, the size and the dimensions. The rules live here, not in
 * the upload call, so the editor, the Worker contract and the tests read one
 * table. `mediaApi.ts` is the caller; `SQL/
 * 20261123000500_media_objects.sql` repeats the size limits as a check.
 */

export type MediaFolder = 'blog-posts' | 'guide-stops' | 'ads' | 'rentals' | 'shops';

export type MediaKind = 'image' | 'video';

export interface MediaRule {
  /** Where the object is stored, relative to the bucket root. */
  prefix: string;
  /** Formats the Worker accepts before it converts. */
  accepts: readonly string[];
  /** What R2 holds after conversion. */
  stores: 'image/webp' | 'video/mp4';
  /** Ceiling after compression, in bytes. */
  maxBytes: number;
  /** A video also has a duration ceiling, in seconds. */
  maxSeconds?: number;
  /** Longest edge kept for an image, in pixels. */
  maxEdge?: number;
  /** `shops/<shop-id>/` needs the id; the others are a fixed prefix. */
  perShop?: boolean;
}

export const MEDIA_RULES: Record<MediaFolder, MediaRule> = {
  'blog-posts': {
    prefix: 'blog-posts/',
    accepts: ['image/jpeg', 'image/png', 'image/webp'],
    stores: 'image/webp',
    maxBytes: 450 * 1024,
    maxEdge: 1600,
  },
  'guide-stops': {
    prefix: 'guide-stops/',
    accepts: ['image/jpeg', 'image/png', 'image/webp'],
    stores: 'image/webp',
    maxBytes: 450 * 1024,
    maxEdge: 1600,
  },
  ads: {
    prefix: 'ads/',
    accepts: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
    stores: 'image/webp',
    maxBytes: 300 * 1024,
    maxEdge: 1600,
  },
  rentals: {
    prefix: 'rentals/',
    accepts: ['image/jpeg', 'image/png', 'image/webp'],
    stores: 'image/webp',
    maxBytes: 450 * 1024,
    maxEdge: 1600,
  },
  shops: {
    prefix: 'shops/',
    accepts: ['image/jpeg', 'image/png', 'image/webp'],
    stores: 'image/webp',
    maxBytes: 450 * 1024,
    maxEdge: 1600,
    perShop: true,
  },
};

/** Plan §16B.6 and §16A.8: ad video is MP4, at most 3 MB and 15 seconds. */
export const AD_VIDEO = {
  accepts: ['video/mp4'],
  maxBytes: 3 * 1024 * 1024,
  maxSeconds: 15,
} as const;

/** A shop's photo count is an Admin-set quota; this is the value until it is one. */
export const DEFAULT_SHOP_PHOTO_QUOTA = 20;

/** A nightly job removes an object nothing has referenced for this long. */
export const ORPHAN_MEDIA_DAYS = 30;

/** Why a file was refused, as a code the editor translates (`cw_media_*`). */
export type MediaRejection =
  | 'unsupported_type'
  | 'too_large'
  | 'video_too_long'
  | 'shop_required'
  | 'quota_reached';

export type MediaCheck =
  | { ok: true; folder: MediaFolder; kind: MediaKind; rule: MediaRule; prefix: string }
  | { ok: false; code: MediaRejection };

/**
 * The folder an object is stored under. A shop photo is namespaced by the shop
 * id so one owner can never write over another's file; the rest are fixed.
 */
export function folderPrefix(folder: MediaFolder, shopId?: string): string | null {
  const rule = MEDIA_RULES[folder];
  if (!rule.perShop) return rule.prefix;
  const id = (shopId ?? '').trim();
  if (!id) return null;
  // The id becomes part of a path, so a slash or a dot-dot would escape the folder.
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return null;
  return `${rule.prefix}${id}/`;
}

export function mediaKind(type: string): MediaKind | null {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  return null;
}

/** A source image may be this large; it is compressed before it is stored. */
export const MAX_ORIGINAL_BYTES = 12 * 1024 * 1024;

export interface MediaCheckOptions {
  shopId?: string;
  seconds?: number;
  shopPhotoCount?: number;
  shopQuota?: number;
  /**
   * `original` (the default) checks a file about to be compressed: type, video
   * length and the 12 MB source ceiling. `final` checks what will be stored, so
   * the folder's own byte limit applies.
   */
  stage?: 'original' | 'final';
}

/**
 * One answer for every upload: which folder, which kind, which limit. An ad
 * video is checked against the §16A.8 limits instead of the image ones, because
 * a 3 MB / 15 s video and a 300 KB banner are both allowed in `ads/`.
 */
export function checkMedia(
  folder: MediaFolder,
  file: { type: string; size: number },
  options: MediaCheckOptions = {},
): MediaCheck {
  const rule = MEDIA_RULES[folder];
  const kind = mediaKind(file.type);
  if (!kind) return { ok: false, code: 'unsupported_type' };

  const prefix = folderPrefix(folder, options.shopId);
  if (!prefix) return { ok: false, code: 'shop_required' };

  const isAdVideo = folder === 'ads' && kind === 'video';
  const accepted = isAdVideo ? AD_VIDEO.accepts : rule.accepts;
  if (!accepted.includes(file.type)) return { ok: false, code: 'unsupported_type' };

  // An image is compressed after this check, so the original may be much larger
  // than the stored file; only a video is measured as it arrives. `final` is the
  // second pass over the compressed result, where the ceiling does apply.
  const maxBytes = isAdVideo ? AD_VIDEO.maxBytes : rule.maxBytes;
  if (options.stage === 'final' || isAdVideo) {
    if (file.size > maxBytes) return { ok: false, code: 'too_large' };
  } else if (file.size > MAX_ORIGINAL_BYTES) {
    return { ok: false, code: 'too_large' };
  }

  if (isAdVideo && options.seconds !== undefined && options.seconds > AD_VIDEO.maxSeconds) {
    return { ok: false, code: 'video_too_long' };
  }

  if (folder === 'shops') {
    const quota = options.shopQuota ?? DEFAULT_SHOP_PHOTO_QUOTA;
    if ((options.shopPhotoCount ?? 0) >= quota) return { ok: false, code: 'quota_reached' };
  }

  // The caller reads the limits back off the rule, so an ad video reports the
  // video limits rather than the 300 KB banner ceiling it is not held to.
  const effective: MediaRule = isAdVideo
    ? { ...rule, accepts: AD_VIDEO.accepts, stores: 'video/mp4', maxBytes: AD_VIDEO.maxBytes, maxSeconds: AD_VIDEO.maxSeconds }
    : rule;
  return { ok: true, folder, kind, rule: effective, prefix };
}

/** The largest file a folder accepts, for the editor's hint and the Worker. */
export function maxBytesFor(folder: MediaFolder, kind: MediaKind = 'image'): number {
  if (folder === 'ads' && kind === 'video') return AD_VIDEO.maxBytes;
  return MEDIA_RULES[folder].maxBytes;
}

/** The `accept` attribute for a file input, so the picker offers only what passes. */
export function acceptFor(folder: MediaFolder): string {
  return MEDIA_RULES[folder].accepts.join(',');
}

export interface MediaObjectRef {
  /** R2 key, e.g. `blog-posts/bagan.webp`. */
  key: string;
  /** When the object was last referenced by a row that still exists. */
  lastReferencedAt: string;
}

/**
 * Plan §16B.6: the nightly cleanup removes what nothing has referenced for 30
 * days. An object referenced yesterday is kept even if today's content dropped
 * it, so an editor who undoes a change does not lose the file.
 */
export function isOrphan(object: MediaObjectRef, now: Date, days = ORPHAN_MEDIA_DAYS): boolean {
  const last = new Date(object.lastReferencedAt).getTime();
  if (Number.isNaN(last)) return false;
  return now.getTime() - last > days * 24 * 60 * 60 * 1000;
}

export function orphanCandidates(objects: MediaObjectRef[], now: Date, days = ORPHAN_MEDIA_DAYS): MediaObjectRef[] {
  return objects.filter((object) => isOrphan(object, now, days));
}

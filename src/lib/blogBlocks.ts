/** Block kinds the Blog composer can place. The order is the reading order. */
export type BlogBlock =
  | { id: string; type: 'text'; textEn: string; textMm: string }
  | {
      id: string;
      type: 'image';
      imageUrl: string;
      altEn: string;
      altMm: string;
      caption: string;
      credit: string;
    }
  | { id: string; type: 'ad' };

export type BlogPostStatus = 'Draft' | 'Published' | 'Scheduled';

/** Plan §10: a post carries at most this many ad slots. */
export const MAX_AD_SLOTS_PER_POST = 3;

export function createTextBlock(): BlogBlock {
  return { id: `text-${Date.now()}-${Math.random()}`, type: 'text', textEn: '', textMm: '' };
}

export function createImageBlock(imageUrl: string): BlogBlock {
  return { id: `image-${Date.now()}-${Math.random()}`, type: 'image', imageUrl, altEn: '', altMm: '', caption: '', credit: '' };
}

export function createAdBlock(): BlogBlock {
  return { id: `ad-${Date.now()}-${Math.random()}`, type: 'ad' };
}

/** Swaps a block with its neighbour. `offset` is -1 to move up, 1 to move down. */
export function moveBlock(blocks: BlogBlock[], index: number, offset: -1 | 1): BlogBlock[] {
  const target = index + offset;
  if (index < 0 || index >= blocks.length || target < 0 || target >= blocks.length) return blocks;
  const next = [...blocks];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * Explains why another ad slot cannot be added at `index`, or returns null when
 * the slot is allowed. A slot cannot open the post or sit beside another slot.
 */
export function adSlotProblem(blocks: BlogBlock[], index: number): string | null {
  const count = blocks.filter((block) => block.type === 'ad').length;
  if (count >= MAX_AD_SLOTS_PER_POST) return `A post can carry at most ${MAX_AD_SLOTS_PER_POST} ad slots.`;
  if (index === 0) return 'An ad slot cannot be the first block.';
  if (blocks[index - 1]?.type === 'ad' || blocks[index]?.type === 'ad') return 'Two ad slots cannot sit side by side.';
  return null;
}

/** Removes slots that break the placement rules, e.g. after a neighbour was deleted. */
export function normalizeAdSlots(blocks: BlogBlock[]): BlogBlock[] {
  const kept: BlogBlock[] = [];
  for (const block of blocks) {
    if (block.type !== 'ad') { kept.push(block); continue; }
    if (kept.length === 0) continue;
    if (kept[kept.length - 1].type === 'ad') continue;
    if (kept.filter((item) => item.type === 'ad').length >= MAX_AD_SLOTS_PER_POST) continue;
    kept.push(block);
  }
  return kept;
}

export type PublishCheck = { ok: boolean; problems: string[] };

type PublishInput = {
  status: BlogPostStatus;
  titleEn: string;
  titleMm: string;
  excerptEn: string;
  excerptMm: string;
  category: string;
  coverUrl: string;
  blocks: BlogBlock[];
  scheduledDate: string;
  scheduledTime: string;
};

/** Plan §10 item 5: what must be true before a post may leave Draft. */
export function blogPublishCheck(input: PublishInput): PublishCheck {
  const problems: string[] = [];
  if (!input.titleEn.trim() || !input.titleMm.trim()) problems.push('Both title languages are required.');
  if (!input.excerptEn.trim() || !input.excerptMm.trim()) problems.push('Both excerpt languages are required.');
  if (!input.category.trim()) problems.push('Choose a category.');
  if (!input.coverUrl.trim()) problems.push('A cover photo is required.');
  if (!input.blocks.some((block) => block.type === 'text' && (block.textEn.trim() || block.textMm.trim()))) {
    problems.push('Add at least one paragraph of story text.');
  }
  const missingAlt = input.blocks.filter((block) => block.type === 'image' && (!block.altEn.trim() || !block.altMm.trim())).length;
  if (missingAlt > 0) problems.push(`Alt text is missing in both languages on ${missingAlt} photo${missingAlt === 1 ? '' : 's'}.`);
  if (input.status === 'Scheduled' && (!input.scheduledDate || !input.scheduledTime)) {
    problems.push('A scheduled post needs a date and a time.');
  }
  return { ok: problems.length === 0, problems };
}

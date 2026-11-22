import { describe, expect, it } from 'vitest';
import {
  adSlotProblem,
  blogPublishCheck,
  createAdBlock,
  createImageBlock,
  createTextBlock,
  MAX_AD_SLOTS_PER_POST,
  moveBlock,
  normalizeAdSlots,
} from './blogBlocks';

const base = {
  status: 'Published' as const,
  titleEn: 'Bagan at dawn', titleMm: 'အရုဏ်ဦးပုဂံ',
  excerptEn: 'A short walk through the temples.', excerptMm: 'ဘုရားများကြား လမ်းလျှောက်ခရီး။',
  category: 'culture', coverUrl: '/images/blog/bagan-sunrise.webp',
  scheduledDate: '', scheduledTime: '',
};

function withAlt() {
  const image = createImageBlock('/images/blog/bagan-sunrise.webp');
  if (image.type !== 'image') throw new Error('expected an image block');
  return { ...image, altEn: 'Temples at sunrise', altMm: 'အရုဏ်ဦး ဘုရားများ' };
}

describe('moveBlock', () => {
  it('swaps a block with the one above it', () => {
    const blocks = [createTextBlock(), createTextBlock()];
    const moved = moveBlock(blocks, 1, -1);
    expect(moved.map((block) => block.id)).toEqual([blocks[1].id, blocks[0].id]);
  });

  it('leaves the list alone at the edges', () => {
    const blocks = [createTextBlock(), createTextBlock()];
    expect(moveBlock(blocks, 0, -1)).toBe(blocks);
    expect(moveBlock(blocks, 1, 1)).toBe(blocks);
  });
});

describe('ad slot placement', () => {
  it('refuses a slot as the first block', () => {
    expect(adSlotProblem([], 0)).toEqual({ code: 'ad_first' });
  });

  it('refuses two slots side by side', () => {
    const blocks = [createTextBlock(), createAdBlock()];
    expect(adSlotProblem(blocks, 1)).toEqual({ code: 'ad_adjacent' });
  });

  it('refuses a slot beyond the per-post maximum', () => {
    const blocks = [createTextBlock()];
    for (let index = 0; index < MAX_AD_SLOTS_PER_POST; index += 1) blocks.push(createAdBlock(), createTextBlock());
    expect(adSlotProblem(blocks, blocks.length)).toEqual({ code: 'ad_max', count: MAX_AD_SLOTS_PER_POST });
  });

  it('allows a slot after a paragraph', () => {
    expect(adSlotProblem([createTextBlock()], 1)).toBeNull();
  });

  it('drops a slot left at the top or beside another slot', () => {
    const kept = normalizeAdSlots([createAdBlock(), createTextBlock(), createAdBlock(), createAdBlock()]);
    expect(kept.map((block) => block.type)).toEqual(['text', 'ad']);
  });
});

describe('blogPublishCheck', () => {
  it('passes a complete post', () => {
    const text = { ...createTextBlock(), textEn: 'The plain opens at first light.', textMm: 'အရုဏ်ဦးမှာ လွင်ပြင်ပွင့်သည်။' };
    expect(blogPublishCheck({ ...base, blocks: [text, withAlt()] })).toEqual({ ok: true, problems: [] });
  });

  it('reports every missing language and the missing cover', () => {
    const result = blogPublishCheck({ ...base, titleMm: '', coverUrl: '', blocks: [createTextBlock()] });
    expect(result.ok).toBe(false);
    expect(result.problems).toContainEqual({ code: 'title_languages' });
    expect(result.problems).toContainEqual({ code: 'cover' });
    expect(result.problems).toContainEqual({ code: 'story_text' });
  });

  it('requires alt text in both languages', () => {
    const image = createImageBlock('/images/blog/bagan-sunrise.webp');
    const text = { ...createTextBlock(), textEn: 'Draft copy.', textMm: 'မူကြမ်း။' };
    const result = blogPublishCheck({ ...base, blocks: [text, image] });
    expect(result.problems).toContainEqual({ code: 'alt_missing', count: 1 });
  });

  it('requires a date and time when scheduling', () => {
    const text = { ...createTextBlock(), textEn: 'Draft copy.', textMm: 'မူကြမ်း။' };
    const result = blogPublishCheck({ ...base, status: 'Scheduled', blocks: [text] });
    expect(result.problems).toContainEqual({ code: 'schedule' });
  });
});

import type { Language } from '../types';
import type { ShopPageData } from '../lib/shopTemplates';
import type { TranslationKey } from '../lib/i18n';

export type Translate = (key: TranslationKey) => string;

export interface TemplateProps {
  data: ShopPageData;
  language: Language;
  t: Translate;
}

/** §9 price display: the owner decides whether a price is shown at all. */
export function priceVisible(data: ShopPageData): boolean {
  return data.priceDisplay === 'public';
}

export function catalogName(item: { nameMm: string; nameEn: string }, language: Language): string {
  return language === 'mm' ? item.nameMm : item.nameEn;
}

export function photoAlt(photo: { altMm: string; altEn: string }, language: Language): string {
  return language === 'mm' ? photo.altMm : photo.altEn;
}

export function averageRating(reviews: { rating: number }[]): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
}

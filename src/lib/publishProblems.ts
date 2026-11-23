import type { TranslationKey } from './i18n';

/**
 * Publish checks run in plain functions, so they report a code and the editor
 * resolves it through `t()`. A code is also stable for tests and, later, for the
 * server-side check that mirrors these rules.
 */
export type PublishProblemCode =
  | 'title_languages'
  | 'excerpt_languages'
  | 'category'
  | 'cover'
  | 'story_text'
  | 'alt_missing'
  | 'schedule'
  | 'author'
  | 'stop_required'
  | 'stop_listing'
  | 'stop_languages'
  | 'stop_time_format'
  | 'stop_time_order'
  | 'ad_first'
  | 'ad_adjacent'
  | 'ad_max'
  | 'version_conflict';

export type PublishProblem = { code: PublishProblemCode; count?: number };

export const PUBLISH_PROBLEM_KEYS: Record<PublishProblemCode, TranslationKey> = {
  title_languages: 'cw_problem_title_languages',
  excerpt_languages: 'cw_problem_excerpt_languages',
  category: 'cw_problem_category',
  cover: 'cw_problem_cover',
  story_text: 'cw_problem_story_text',
  alt_missing: 'cw_problem_alt_missing',
  schedule: 'cw_problem_schedule',
  author: 'cw_problem_author',
  stop_required: 'cw_problem_stop_required',
  stop_listing: 'cw_problem_stop_listing',
  stop_languages: 'cw_problem_stop_languages',
  stop_time_format: 'cw_problem_stop_time_format',
  stop_time_order: 'cw_problem_stop_time_order',
  ad_first: 'cw_problem_ad_first',
  ad_adjacent: 'cw_problem_ad_adjacent',
  ad_max: 'cw_problem_ad_max',
  version_conflict: 'cw_problem_version_conflict',
};

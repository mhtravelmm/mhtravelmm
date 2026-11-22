import { fill } from '../../lib/fill';
import type { TranslationKey } from '../../lib/i18n';
import { PUBLISH_PROBLEM_KEYS, type PublishProblem } from '../../lib/publishProblems';

/** Renders a publish-check failure in the reader's language. */
export function problemMessage(t: (key: TranslationKey) => string, problem: PublishProblem): string {
  return fill(t(PUBLISH_PROBLEM_KEYS[problem.code]), { count: problem.count ?? 0 });
}

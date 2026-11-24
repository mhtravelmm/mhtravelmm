import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { ListingCard } from '../../components/ui/ListingCard';
import { useLanguage } from '../../lib/i18n';
import { CATEGORIES } from './categories';
import { fill } from '../../lib/fill';
import { cardGridStyle } from '../../lib/cardGrid';

export function CategoryPage({ slug }: { slug: string }) {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const category = CATEGORIES.find((item) => item.slug === slug);
  if (!category) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-text-muted">{t('category_not_found')}</p>
      </div>
    );
  }

  const locale = language === 'mm' ? 'my-MM' : 'en-US';
  const needle = query.trim().toLocaleLowerCase(locale);
  const filtered = category.items.filter((item) => !needle || item.title.toLocaleLowerCase(locale).includes(needle));
  const visible = showAll ? filtered : filtered.slice(0, 12);

  return (
    <div className="mx-auto max-w-7xl pb-10 pt-3 sm:pt-5">
      <section className="mh-page-hero relative isolate mb-5 overflow-hidden rounded-2xl bg-slate-950">
        <img src={category.image} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06162c]/95 via-[#071a31]/72 to-[#071a31]/15" />
        <div className="relative z-10 flex h-full items-center px-4 sm:px-7 md:px-10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
              {t('category_kicker')}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-[40px]">
              {language === 'mm' ? category.mm : category.en}
            </h1>
            <p className="mt-1 text-[11px] text-slate-200 sm:text-xs">
              {fill(t('category_results'), { count: filtered.length })}
            </p>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-border bg-bg-card p-3 sm:p-4">
        <label className="relative block">
          <span className="sr-only">{t('category_search_label')}</span>
          <SearchIcon size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setShowAll(false); }}
            placeholder={t('category_search_placeholder')}
            className="w-full rounded-md border border-border bg-bg py-2.5 pl-9 pr-3 text-xs text-text-primary outline-none placeholder:text-text-faint focus:border-brand-blue/60"
          />
        </label>

        {visible.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 justify-items-center gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" style={cardGridStyle(5, 'md')}>
            {visible.map((item) => (
              <ListingCard key={`${category.id}-${item.id}`} listing={item} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-10 text-center text-xs text-text-muted">
            {t('category_no_results')}
          </div>
        )}

        {filtered.length > 12 && (
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="mt-4 w-full rounded-md border border-brand-blue/30 px-4 py-2.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue/10"
          >
            {showAll
              ? t('category_show_less')
              : fill(t('category_show_more'), { count: filtered.length - 12 })}
          </button>
        )}
      </div>
    </div>
  );
}

export function CategoryIndexPage() {
  const { language, t } = useLanguage();
  const total = CATEGORIES.reduce((sum, category) => sum + category.items.length, 0);

  return (
    <div className="mx-auto max-w-7xl pb-10 pt-3 sm:pt-5">
      <section className="mh-page-hero relative isolate mb-5 overflow-hidden rounded-2xl bg-slate-950">
        <img src="/images/blog/shwedagon-evening.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06162c]/95 via-[#071a31]/72 to-[#071a31]/15" />
        <div className="relative z-10 flex h-full items-center px-4 sm:px-7 md:px-10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
              {t('category_browse_kicker')}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-[40px]">
              {t('category_index_title')}
            </h1>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((category) => (
          <Link
            key={category.id}
            to={`/${category.slug}`}
            className="group overflow-hidden rounded-xl border border-border bg-bg-card p-4 transition hover:border-brand-blue/50"
          >
            <p className="text-sm font-semibold text-text-primary">{language === 'mm' ? category.mm : category.en}</p>
            <p className="mt-1 text-[10px] text-text-muted">
              {fill(t('category_item_count'), { count: category.items.length })}
            </p>
          </Link>
        ))}
      </div>

      <p className="mt-5 text-center text-[11px] text-text-muted">
        {fill(t('category_total_count'), { count: total })}
      </p>
    </div>
  );
}

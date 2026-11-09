import { useMemo, useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { ListingCard } from '../../components/ui/ListingCard';
import { BLOGS, POPULARS, TRAVEL_GUIDES, TRAVEL_PLANS } from '../../data/homeData';
import { useLanguage } from '../../lib/i18n';

type SearchFilter = 'all' | 'plans' | 'guides' | 'blogs' | 'popular';
const groups = { plans: TRAVEL_PLANS, guides: TRAVEL_GUIDES, blogs: BLOGS, popular: POPULARS };

export function SearchPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const source = filter === 'all' ? Object.values(groups).flat() : groups[filter];
  const results = useMemo(() => { const term = query.trim().toLowerCase(); return source.filter((item) => !term || `${item.title} ${item.subtitle ?? ''}`.toLowerCase().includes(term)); }, [query, source]);
  const filters: { id: SearchFilter; label: string }[] = [
    { id: 'all', label: t('search_all') }, { id: 'plans', label: t('search_plans') }, { id: 'guides', label: t('search_guides') }, { id: 'blogs', label: t('search_blogs') }, { id: 'popular', label: t('search_popular') },
  ];

  return <div className="mx-auto max-w-7xl py-3"><div className="mb-4"><h1 className="text-lg font-medium text-text-primary">{t('search_title')}</h1><p className="mt-1 text-[11px] text-text-muted">{t('search_intro')}</p></div><label className="flex items-center gap-2 rounded-md border border-border bg-bg-card px-3 py-2.5 focus-within:border-brand-blue"><SearchIcon size={15} className="text-text-faint" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('search_results_placeholder')} className="w-full bg-transparent text-xs text-text-primary outline-none placeholder:text-text-faint" />{query && <button type="button" onClick={() => setQuery('')} className="text-text-faint" aria-label={t('search_clear')}><X size={14} /></button>}</label><div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">{filters.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`shrink-0 rounded-md px-3 py-2 text-[10px] ${filter === item.id ? 'bg-brand-blue text-white' : 'bg-bg-card text-text-muted'}`}>{item.label}</button>)}</div><div className="mb-3 mt-5 flex items-center justify-between"><h2 className="text-sm font-medium text-text-primary">{query ? `${t('search_results_for')} “${query}”` : t('search_all_results')}</h2><span className="text-[10px] text-text-faint">{results.length} {t('search_matches')}</span></div>{results.length ? <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">{results.map((item) => <ListingCard key={item.id} listing={item} size="md" />)}</div> : <div className="rounded-card border border-dashed border-border p-10 text-center text-xs text-text-muted">{t('search_no_results')}</div>}</div>;
}

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '../../../lib/i18n';
import { useAuth } from '../../../lib/auth';
import { canOpenSection } from '../../../lib/adminWorkspace';
import { MIN_QUERY_LENGTH, searchAll, type SearchGroup } from '../../../lib/globalSearch';

/** §3A.14: the header search field; the matching rule lives in `globalSearch.ts`. */

const GROUP_KEYS: Record<SearchGroup, 'gs_group_users' | 'gs_group_bookings' | 'gs_group_owners' | 'gs_group_listings' | 'gs_group_blogs' | 'gs_group_guides'> = {
  users: 'gs_group_users',
  bookings: 'gs_group_bookings',
  owners: 'gs_group_owners',
  listings: 'gs_group_listings',
  blogs: 'gs_group_blogs',
  guides: 'gs_group_guides',
};

export function GlobalSearchBox() {
  const { t } = useLanguage();
  const { adminRole } = useAuth();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => searchAll(query, (section) => canOpenSection(adminRole, section)), [query, adminRole]);
  const tooShort = query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH;

  return (
    <div className="relative">
      <label className="flex items-center gap-2 rounded-lg border border-[#2b527d] bg-[#0b203b] px-2.5 py-1.5">
        <Search size={14} className="text-slate-400" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder={t('gs_placeholder')}
          aria-label={t('gs_placeholder')}
          className="w-40 bg-transparent text-[11px] text-white outline-none placeholder:text-slate-500 sm:w-56"
        />
      </label>

      {open && query.trim().length > 0 && (
        <div className="absolute left-0 top-full z-[60] mt-1 w-[320px] rounded-lg border border-[#315985] bg-[#081a31] p-2 shadow-2xl">
          {tooShort ? (
            <p className="px-1 py-2 text-[11px] text-slate-400">{t('gs_min_chars')}</p>
          ) : results.length === 0 ? (
            <p className="px-1 py-2 text-[11px] text-slate-400">{t('gs_no_results')}</p>
          ) : (
            <div className="max-h-[320px] space-y-2 overflow-y-auto">
              {results.map((group) => (
                <div key={group.group}>
                  <p className="px-1 text-[9px] font-bold uppercase tracking-wide text-cyan-300">{t(GROUP_KEYS[group.group])}</p>
                  <ul>
                    {group.hits.map((hit) => (
                      <li key={hit.id}>
                        <a
                          href={hit.href}
                          className="block rounded px-1 py-1 text-[11px] text-slate-200 hover:bg-white/5 hover:text-white"
                        >
                          <span className="font-semibold">{hit.label}</span>
                          <span className="block text-[10px] text-slate-400">{hit.detail}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

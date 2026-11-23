import { useState } from 'react';
import {
  AlertTriangle,
  Bike,
  Car,
  Check,
  ChevronRight,
  Compass,
  MapPin,
  Plus,
  RotateCcw,
  Save,
  ShipWheel,
  TentTree,
  Trash2,
  UserRound,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { fill } from '../../lib/fill';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import { useRentalCatalog } from '../../lib/rentalCatalogStore';
import {
  activeVariants,
  DEFAULT_RENTAL_CATALOG,
  rentalCatalogProblems,
  type RentalCatalog,
  type RentalFlow,
  type RentalIconName,
  type RentalType,
  type RentalVariant,
} from '../../data/rentalCatalog';

const ICONS: Record<RentalIconName, LucideIcon> = {
  bike: Bike,
  bolt: Zap,
  car: Car,
  compass: Compass,
  tent: TentTree,
  boat: ShipWheel,
  person: UserRound,
  tricycle: ShipWheel,
};

const IMAGE_CHOICES = [
  '/images/blog/shwedagon-evening.webp',
  '/images/blog/bagan-sunrise.webp',
  '/images/blog/ubein-evening.webp',
  '/images/blog/inle-stilt-houses.webp',
];

/** Plan §8 item 1: Rental Admin owns types, rules, availability, branches, rates and terms. */
const PROBLEM_KEYS: Record<string, TranslationKey> = {
  no_types: 'ra_problem_no_types',
  no_cities: 'ra_problem_no_cities',
  duplicate_type: 'ra_problem_duplicate_type',
  duplicate_city: 'ra_problem_duplicate_city',
  duplicate_rate: 'ra_problem_rate',
  terms: 'ra_problem_terms',
  terms_version: 'ra_problem_terms',
  type_no_variant: 'ra_problem_no_variant',
  variant_duplicate: 'ra_problem_variant',
  variant_label: 'ra_problem_variant',
  variant_rate: 'ra_problem_variant',
  rate_value: 'ra_problem_rate',
  rate_category: 'ra_problem_rate',
  rate_city: 'ra_problem_rate',
};

function problemKey(problem: string): TranslationKey {
  const base = problem.split(':')[0];
  return PROBLEM_KEYS[base] ?? 'ra_problem_field';
}

export function RentalAdminPanel({ runAction }: { runAction: (label: string) => void }) {
  const { language, t } = useLanguage();
  const { catalog, save, reset } = useRentalCatalog();
  const [draft, setDraft] = useState<RentalCatalog>(catalog);
  const [openTypeId, setOpenTypeId] = useState<string | null>(catalog.types[0]?.id ?? null);

  const problems = rentalCatalogProblems(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(catalog);

  function patchType(typeId: string, changes: Partial<RentalType>) {
    setDraft((current) => ({
      ...current,
      types: current.types.map((type) => (type.id === typeId ? { ...type, ...changes } : type)),
    }));
  }

  function patchVariant(typeId: string, variantId: string, changes: Partial<RentalVariant>) {
    setDraft((current) => ({
      ...current,
      types: current.types.map((type) =>
        type.id === typeId
          ? { ...type, variants: type.variants.map((variant) => (variant.id === variantId ? { ...variant, ...changes } : variant)) }
          : type,
      ),
    }));
  }

  function newVariant(type: RentalType): RentalVariant {
    const base = `variant_${type.variants.length + 1}`;
    let id = base;
    let index = 2;
    while (type.variants.some((variant) => variant.id === id)) {
      id = `${base}_${index}`;
      index += 1;
    }
    return {
      id,
      label: { mm: '', en: '' },
      seats: null,
      rules: { mm: '', en: '' },
      active: true,
      sortOrder: type.variants.length + 1,
      rateUsd: type.rateUsd,
      foreignRateUsd: type.foreignRateUsd,
    };
  }

  function patchAvailability(cityId: string, typeId: string, on: boolean) {
    setDraft((current) => ({
      ...current,
      availability: { ...current.availability, [cityId]: { ...(current.availability[cityId] ?? {}), [typeId]: on } },
    }));
  }

  function addType() {
    const base = `type_${draft.types.length + 1}`;
    let id = base;
    let index = 2;
    while (draft.types.some((type) => type.id === id)) {
      id = `${base}_${index}`;
      index += 1;
    }
    const next: RentalType = {
      id,
      label: { mm: '', en: '' },
      detail: { mm: '', en: '' },
      image: IMAGE_CHOICES[0],
      icon: 'bike',
      flow: 'simple',
      driverRequired: false,
      minDays: 1,
      rateUsd: 10,
      foreignRateUsd: 12,
      variants: [],
      terms: DEFAULT_RENTAL_CATALOG.types[0].terms,
      active: true,
      sortOrder: draft.types.length + 1,
    };
    setDraft((current) => ({ ...current, types: [...current.types, next] }));
    setOpenTypeId(id);
  }

  function removeType(typeId: string) {
    setDraft((current) => ({
      ...current,
      types: current.types.filter((type) => type.id !== typeId),
      availability: Object.fromEntries(
        Object.entries(current.availability).map(([cityId, row]) => {
          const next = { ...row };
          delete next[typeId];
          return [cityId, next];
        }),
      ),
    }));
  }

  function commit() {
    if (problems.length > 0) return;
    save(draft);
    runAction(t('ra_saved'));
  }

  return (
    <div className="mx-auto max-w-[1150px] space-y-3">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{t('ra_kicker')}</p>
          <h1 className="mt-1 text-lg font-extrabold sm:text-3xl">{t('sa_nav_rentals')}</h1>
          <p className="mt-1 text-sm text-slate-400">{t('ra_intro')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={addType} className="inline-flex items-center gap-2 rounded-lg border border-[#2f6192] px-3 py-2 text-[11px] font-bold text-cyan-200 hover:bg-white/10"><Plus size={15} /> {t('ra_add_type')}</button>
          <button type="button" onClick={() => setDraft(catalog)} disabled={!dirty} className="inline-flex items-center gap-2 rounded-lg border border-[#2f6192] px-3 py-2 text-[11px] font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-40"><RotateCcw size={15} /> {t('ra_discard')}</button>
          <button type="button" onClick={commit} disabled={problems.length > 0 || !dirty} className="inline-flex items-center gap-2 rounded-lg bg-[#168df4] px-3 py-2 text-[11px] font-bold hover:bg-[#2aa6ff] disabled:opacity-40"><Save size={15} /> {t('ra_save')}</button>
        </div>
      </div>

      {problems.length > 0 && (
        <div role="alert" className="rounded-lg border border-amber-300/40 bg-amber-400/10 p-3 text-[11px] text-amber-100">
          <p className="mb-1 flex items-center gap-2 font-bold"><AlertTriangle size={14} /> {t('ra_problems_title')}</p>
          <ul className="list-inside list-disc space-y-0.5">
            {problems.map((problem) => <li key={problem}>{fill(t(problemKey(problem)), { field: problem })}</li>)}
          </ul>
        </div>
      )}

      <section className="rounded-lg border border-[#294d76] bg-[#0b203b] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#244668] px-3 py-2">
          <h2 className="flex items-center gap-2 text-sm font-bold"><Bike size={16} className="text-[#26b8ff]" /> {t('ra_types_title')}</h2>
          <span className="text-[10px] text-slate-400">{draft.types.length} {t('ra_types_count')}</span>
        </div>
        <div className="divide-y divide-[#1d3a5c]">
          {draft.types.map((type) => {
            const Icon = ICONS[type.icon];
            const open = openTypeId === type.id;
            return (
              <div key={type.id}>
                <button type="button" onClick={() => setOpenTypeId(open ? null : type.id)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/5">
                  <Icon size={16} className="shrink-0 text-cyan-300" />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-100">{type.label[language] || type.id}</span>
                  <span className="shrink-0 rounded-full bg-[#102c51] px-2 py-0.5 text-[9px] text-slate-300">{type.rateUsd} USD / {type.foreignRateUsd} USD</span>
                  <span className="shrink-0 rounded-full bg-[#102c51] px-2 py-0.5 text-[9px] text-slate-300">{t('ra_min_days_short')} {type.minDays}</span>
                  {type.driverRequired && <span className="shrink-0 rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold text-amber-200">{t('ra_driver_short')}</span>}
                  <ChevronRight size={14} className={`shrink-0 text-slate-400 transition ${open ? 'rotate-90' : ''}`} />
                </button>
                {open && (
                  <div className="space-y-2 bg-[#091b32] p-3">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <label className="block text-[10px] font-semibold text-slate-300">{t('ra_label_mm')}<input value={type.label.mm} onChange={(event) => patchType(type.id, { label: { ...type.label, mm: event.target.value } })} className="mt-1 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label>
                      <label className="block text-[10px] font-semibold text-slate-300">{t('ra_label_en')}<input value={type.label.en} onChange={(event) => patchType(type.id, { label: { ...type.label, en: event.target.value } })} className="mt-1 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label>
                      <label className="block text-[10px] font-semibold text-slate-300">{t('ra_icon')}<select value={type.icon} onChange={(event) => patchType(type.id, { icon: event.target.value as RentalIconName })} className="mt-1 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300">{(Object.keys(ICONS) as RentalIconName[]).map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
                      <label className="block text-[10px] font-semibold text-slate-300 sm:col-span-2">{t('ra_detail_mm')}<input value={type.detail.mm} onChange={(event) => patchType(type.id, { detail: { ...type.detail, mm: event.target.value } })} className="mt-1 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label>
                      <label className="block text-[10px] font-semibold text-slate-300 sm:col-span-2">{t('ra_detail_en')}<input value={type.detail.en} onChange={(event) => patchType(type.id, { detail: { ...type.detail, en: event.target.value } })} className="mt-1 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label>
                      <label className="block text-[10px] font-semibold text-slate-300">{t('ra_image')}<select value={type.image} onChange={(event) => patchType(type.id, { image: event.target.value })} className="mt-1 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300">{IMAGE_CHOICES.map((url) => <option key={url} value={url}>{url.split('/').pop()}</option>)}</select></label>
                      <label className="block text-[10px] font-semibold text-slate-300">{t('ra_rate_local')}<input type="number" min="1" step="1" value={type.rateUsd} onChange={(event) => patchType(type.id, { rateUsd: Number(event.target.value) })} className="mt-1 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label>
                      <label className="block text-[10px] font-semibold text-slate-300">{t('ra_rate_foreign')}<input type="number" min="1" step="1" value={type.foreignRateUsd} onChange={(event) => patchType(type.id, { foreignRateUsd: Number(event.target.value) })} className="mt-1 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label>
                      <label className="block text-[10px] font-semibold text-slate-300">{t('ra_min_days')}<input type="number" min="1" step="1" value={type.minDays} onChange={(event) => patchType(type.id, { minDays: Number(event.target.value) })} className="mt-1 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label>
                      <label className="block text-[10px] font-semibold text-slate-300">{t('ra_flow')}<select value={type.flow} onChange={(event) => patchType(type.id, { flow: event.target.value as RentalFlow })} className="mt-1 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300"><option value="simple">{t('ra_flow_simple')}</option><option value="driver_vehicle">{t('ra_flow_driver_vehicle')}</option></select></label>
                      <label className="block text-[10px] font-semibold text-slate-300">{t('ra_sort_order')}<input type="number" min="1" step="1" value={type.sortOrder} onChange={(event) => patchType(type.id, { sortOrder: Number(event.target.value) })} className="mt-1 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="flex flex-1 cursor-pointer items-center gap-2 rounded border border-[#2b527d] bg-[#081a31] px-2 py-1.5 text-[10px] text-slate-200">
                        <input type="checkbox" checked={type.active} onChange={(event) => patchType(type.id, { active: event.target.checked })} className="h-3.5 w-3.5 accent-cyan-400" />
                        {t('ra_active')}
                      </label>
                      <span className="flex items-center gap-1 rounded border border-[#2b527d] bg-[#081a31] px-2 py-1.5 text-[10px] text-slate-400">{activeVariants(type).length} {t('ra_options_active')}</span>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 rounded border border-[#2b527d] bg-[#081a31] px-2 py-1.5 text-[10px] text-slate-200">
                      <input type="checkbox" checked={type.driverRequired} onChange={(event) => patchType(type.id, { driverRequired: event.target.checked })} className="h-3.5 w-3.5 accent-cyan-400" />
                      {t('ra_driver_required')}
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="block text-[10px] font-semibold text-slate-300">{t('ra_terms_mm')}<textarea rows={2} value={type.terms.mm} onChange={(event) => patchType(type.id, { terms: { ...type.terms, mm: event.target.value } })} className="mt-1 w-full resize-none rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label>
                      <label className="block text-[10px] font-semibold text-slate-300">{t('ra_terms_en')}<textarea rows={2} value={type.terms.en} onChange={(event) => patchType(type.id, { terms: { ...type.terms, en: event.target.value } })} className="mt-1 w-full resize-none rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label>
                    </div>

                    <div className="rounded border border-[#244668] bg-[#0b203b] p-2">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-200">{t('ra_options_title')}</p>
                        <button type="button" onClick={() => patchType(type.id, { variants: [...type.variants, newVariant(type)] })} className="text-[10px] font-bold text-cyan-300 hover:text-white">+ {t('ra_add_option')}</button>
                      </div>
                      {type.variants.length === 0 && <p className="text-[10px] text-slate-500">{t('ra_options_empty')}</p>}
                      <div className="space-y-1.5">
                        {type.variants.map((variant) => (
                          <div key={variant.id} className="grid grid-cols-2 gap-1.5 sm:grid-cols-7">
                            <input value={variant.label.mm} onChange={(event) => patchVariant(type.id, variant.id, { label: { ...variant.label, mm: event.target.value } })} placeholder={t('ra_label_mm')} className="rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[10px] text-white outline-none" />
                            <input value={variant.label.en} onChange={(event) => patchVariant(type.id, variant.id, { label: { ...variant.label, en: event.target.value } })} placeholder={t('ra_label_en')} className="rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[10px] text-white outline-none" />
                            <input type="number" min="1" value={variant.seats ?? ''} onChange={(event) => patchVariant(type.id, variant.id, { seats: event.target.value === '' ? null : Number(event.target.value) })} placeholder={t('ra_seats')} className="rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[10px] text-white outline-none" />
                            <input type="number" min="1" value={variant.rateUsd} onChange={(event) => patchVariant(type.id, variant.id, { rateUsd: Number(event.target.value) })} placeholder={t('ra_rate_local')} className="rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[10px] text-white outline-none" />
                            <input type="number" min="1" value={variant.foreignRateUsd} onChange={(event) => patchVariant(type.id, variant.id, { foreignRateUsd: Number(event.target.value) })} placeholder={t('ra_rate_foreign')} className="rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[10px] text-white outline-none" />
                            <label className="flex items-center gap-1 rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[10px] text-slate-200">
                              <input type="checkbox" checked={variant.active} onChange={(event) => patchVariant(type.id, variant.id, { active: event.target.checked })} className="h-3 w-3 accent-cyan-400" />
                              {t('ra_active')}
                            </label>
                            <button type="button" aria-label={t('ra_remove_option')} onClick={() => patchType(type.id, { variants: type.variants.filter((item) => item.id !== variant.id) })} className="justify-self-start rounded border border-[#2f6192] px-2 py-1 text-[10px] text-red-300 hover:bg-white/10"><Trash2 size={11} /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button type="button" onClick={() => removeType(type.id)} className="inline-flex items-center gap-1.5 rounded border border-red-400/40 px-2 py-1 text-[10px] font-semibold text-red-300 hover:bg-red-500/10"><Trash2 size={11} /> {t('ra_remove_type')}</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-[#294d76] bg-[#0b203b] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#244668] px-3 py-2">
          <h2 className="flex items-center gap-2 text-sm font-bold"><MapPin size={16} className="text-[#26b8ff]" /> {t('ra_matrix_title')}</h2>
          <span className="text-[10px] text-slate-400">{t('ra_matrix_note')}</span>
        </div>
        <div className="overflow-x-auto p-3">
          <table className="w-full min-w-[680px] text-left text-[10px]">
            <thead className="text-slate-300">
              <tr>
                <th className="sticky left-0 bg-[#0b203b] px-2 py-1.5">{t('ra_col_city')}</th>
                {draft.types.filter((type) => type.active).map((type) => <th key={type.id} className="px-1 py-1.5 text-center font-semibold">{type.label[language] || type.id}</th>)}
              </tr>
            </thead>
            <tbody>
              {draft.cities.map((city) => (
                <tr key={city.id} className="border-t border-[#1d3a5c]">
                  <th scope="row" className="sticky left-0 bg-[#0b203b] px-2 py-1.5 text-left text-[11px] font-semibold text-slate-100">
                    {city.name[language]}
                    <span className="ml-1 text-[9px] font-normal text-slate-500">{city.branches.length} {t('ra_branches_short')}</span>
                  </th>
                  {draft.types.filter((type) => type.active).map((type) => (
                    <td key={type.id} className="px-1 py-1.5 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${city.name.en} ${type.label.en || type.id}`}
                        checked={draft.availability[city.id]?.[type.id] === true}
                        onChange={(event) => patchAvailability(city.id, type.id, event.target.checked)}
                        className="h-3.5 w-3.5 accent-cyan-400"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-[#294d76] bg-[#0b203b] shadow-xl">
        <div className="border-b border-[#244668] px-3 py-2"><h2 className="flex items-center gap-2 text-sm font-bold"><Check size={16} className="text-[#26b8ff]" /> {t('ra_terms_title')}</h2></div>
        <div className="grid gap-2 p-3 sm:grid-cols-2">
          <label className="block text-[10px] font-semibold text-slate-300 sm:col-span-2">{t('ra_terms_version')}<input value={draft.termsVersion} onChange={(event) => setDraft((current) => ({ ...current, termsVersion: event.target.value }))} className="mt-1 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label>
          <label className="block text-[10px] font-semibold text-slate-300">{t('ra_terms_mm')}<textarea rows={3} value={draft.terms.mm} onChange={(event) => setDraft((current) => ({ ...current, terms: { ...current.terms, mm: event.target.value } }))} className="mt-1 w-full resize-none rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label>
          <label className="block text-[10px] font-semibold text-slate-300">{t('ra_terms_en')}<textarea rows={3} value={draft.terms.en} onChange={(event) => setDraft((current) => ({ ...current, terms: { ...current.terms, en: event.target.value } }))} className="mt-1 w-full resize-none rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#244668] px-3 py-2 text-[10px] text-slate-400">
          <p>{t('ra_reset_note')}</p>
          <button type="button" onClick={() => { reset(); setDraft(DEFAULT_RENTAL_CATALOG); runAction(t('ra_reset_done')); }} className="inline-flex items-center gap-1.5 rounded border border-[#2f6192] px-2 py-1 font-semibold text-slate-300 hover:bg-white/10"><RotateCcw size={11} /> {t('ra_reset')}</button>
        </div>
      </section>
    </div>
  );
}

import React from 'react';
import { BookOpenCheck, Check, Edit3, Languages, Plus, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/api/client';
import { useAuth } from '@/hooks/useAuth';

const CATEGORIES = [
  ['NUTRITION', 'Nutrition and healthy eating'],
  ['HYGIENE', 'Hygiene and sanitation'],
  ['PREVENTIVE_CARE', 'Preventive healthcare'],
  ['GENERAL_AWARENESS', 'General health awareness'],
  ['MATERNAL_CHILD_HEALTH', 'Maternal and child health'],
  ['PHYSICAL_ACTIVITY', 'Physical activity'],
  ['MENTAL_WELLNESS', 'Mental wellness'],
  ['VACCINATION', 'Vaccination awareness'],
  ['SEASONAL_HEALTH', 'Seasonal health'],
  ['HEALTHY_LIFESTYLE', 'Healthy lifestyle'],
];

interface TranslationDraft {
  id?: string;
  language: string;
  title: string;
  description: string;
  body: string;
  videoUrl?: string | null;
  readingMinutes: number;
  sourceReferences: string[];
  isMachineTranslated: boolean;
  status?: string;
}

interface EducationResource {
  id: string;
  slug: string;
  category: string;
  format: string;
  status: string;
  version: number;
  authorId: string;
  author: { id: string; firstName: string; lastName: string };
  translations: TranslationDraft[];
}

interface ResourceDraft {
  id?: string;
  slug: string;
  category: string;
  format: string;
  englishVideoUrl: string;
  kannadaVideoUrl: string;
  englishTitle: string;
  englishDescription: string;
  englishBody: string;
  kannadaTitle: string;
  kannadaDescription: string;
  kannadaBody: string;
  sourceReference: string;
}

const emptyDraft: ResourceDraft = {
  slug: '',
  category: 'GENERAL_AWARENESS',
  format: 'ARTICLE',
  englishVideoUrl: '',
  kannadaVideoUrl: '',
  englishTitle: '',
  englishDescription: '',
  englishBody: '',
  kannadaTitle: '',
  kannadaDescription: '',
  kannadaBody: '',
  sourceReference: '',
};

const fieldClass = 'mt-1 block w-full rounded-xl border-slate-300 bg-white text-sm dark:border-slate-700 dark:bg-slate-950';

export default function EducationContentAdmin() {
  const { user } = useAuth();
  const [resources, setResources] = React.useState<EducationResource[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [draft, setDraft] = React.useState<ResourceDraft>(emptyDraft);
  const [isSaving, setIsSaving] = React.useState(false);

  const fetchResources = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/education/admin/resources');
      setResources(response.data.data ?? []);
      setLoadError('');
    } catch (error: any) {
      setLoadError(error.response?.data?.message || 'Education resources could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchResources();
  }, [fetchResources]);

  const resetDraft = () => setDraft(emptyDraft);
  const updateDraft = <K extends keyof ResourceDraft>(key: K, value: ResourceDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const submitDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    const translations: TranslationDraft[] = [
      {
        language: 'en',
        title: draft.englishTitle,
        description: draft.englishDescription,
        body: draft.englishBody,
        readingMinutes: 3,
        sourceReferences: [draft.sourceReference],
        isMachineTranslated: false,
        ...(draft.englishVideoUrl && { videoUrl: draft.englishVideoUrl }),
      },
      {
        language: 'kn',
        title: draft.kannadaTitle,
        description: draft.kannadaDescription,
        body: draft.kannadaBody,
        readingMinutes: 3,
        sourceReferences: [draft.sourceReference],
        isMachineTranslated: false,
        ...(draft.kannadaVideoUrl && { videoUrl: draft.kannadaVideoUrl }),
      },
    ];
    try {
      setIsSaving(true);
      const resourceBody = {
        slug: draft.slug,
        category: draft.category,
        format: draft.format,
        translations,
      };
      if (draft.id) {
        await apiClient.put(`/education/admin/resources/${draft.id}`, resourceBody);
        toast.success('Education resource saved as a draft.');
      } else {
        await apiClient.post('/education/admin/resources', resourceBody);
        toast.success('Education resource created as a draft.');
      }
      resetDraft();
      await fetchResources();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not save this education resource.');
    } finally {
      setIsSaving(false);
    }
  };

  const editResource = (resource: EducationResource) => {
    const english = resource.translations.find((item) => item.language === 'en');
    const kannada = resource.translations.find((item) => item.language === 'kn');
    setDraft({
      id: resource.id,
      slug: resource.slug,
      category: resource.category,
      format: resource.format,
      englishVideoUrl: english?.videoUrl ?? '',
      kannadaVideoUrl: kannada?.videoUrl ?? '',
      englishTitle: english?.title ?? '',
      englishDescription: english?.description ?? '',
      englishBody: english?.body ?? '',
      kannadaTitle: kannada?.title ?? '',
      kannadaDescription: kannada?.description ?? '',
      kannadaBody: kannada?.body ?? '',
      sourceReference: english?.sourceReferences?.[0] ?? kannada?.sourceReferences?.[0] ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const performAction = async (resource: EducationResource, action: 'submit' | 'approve' | 'reject') => {
    try {
      if (action === 'submit') {
        await apiClient.post(`/education/admin/resources/${resource.id}/submit`);
        toast.success('Submitted for review.');
      } else {
        await apiClient.post(`/education/admin/resources/${resource.id}/review`, {
          decision: action === 'approve' ? 'APPROVED' : 'REJECTED',
        });
        toast.success(action === 'approve' ? 'Content and translations approved.' : 'Content returned to its author.');
      }
      await fetchResources();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not update the review status.');
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-7 pb-10">
      <header className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-[#0d2244] to-[#0a1628] p-6 text-white shadow-3d sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-300"><BookOpenCheck className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Editorial workspace</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Health education review</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Draft sourced learning resources in English and Kannada. A different authorized reviewer must approve the resource and its translations before they appear publicly.
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={submitDraft} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{draft.id ? 'Edit draft' : 'Create education resource'}</h2>
          {draft.id && <button type="button" onClick={resetDraft} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"><X className="h-4 w-4" /> Cancel edit</button>}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-semibold">URL slug
            <input required value={draft.slug} onChange={(event) => updateDraft('slug', event.target.value)} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="handwashing-basics" className={fieldClass} />
          </label>
          <label className="text-sm font-semibold">Category
            <select value={draft.category} onChange={(event) => updateDraft('category', event.target.value)} className={fieldClass}>
              {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Format
            <select value={draft.format} onChange={(event) => updateDraft('format', event.target.value)} className={fieldClass}>
              <option value="ARTICLE">Article</option><option value="VIDEO">Video</option>
            </select>
          </label>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {([
            { code: 'en', label: 'English', prefix: 'english' },
            { code: 'kn', label: 'ಕನ್ನಡ', prefix: 'kannada' },
          ] as const).map(({ code, label, prefix }) => (
            <fieldset key={code} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <legend className="px-2 text-sm font-bold"><Languages className="mr-1 inline h-4 w-4" />{label} translation</legend>
              <label className="block text-xs font-semibold">Title
                <input required minLength={3} value={draft[`${prefix}Title`]} onChange={(event) => updateDraft(`${prefix}Title`, event.target.value)} className={fieldClass} />
              </label>
              <label className="block text-xs font-semibold">Short description
                <textarea required minLength={10} rows={2} value={draft[`${prefix}Description`]} onChange={(event) => updateDraft(`${prefix}Description`, event.target.value)} className={fieldClass} />
              </label>
              <label className="block text-xs font-semibold">Lesson content
                <textarea required minLength={20} rows={6} value={draft[`${prefix}Body`]} onChange={(event) => updateDraft(`${prefix}Body`, event.target.value)} className={fieldClass} />
              </label>
              {draft.format === 'VIDEO' && (
                <label className="block text-xs font-semibold">Video URL
                  <input required type="url" value={draft[`${prefix}VideoUrl`]} onChange={(event) => updateDraft(`${prefix}VideoUrl`, event.target.value)} placeholder="https://…" className={fieldClass} />
                </label>
              )}
              <p className="text-xs text-slate-500">Translations are submitted for review as written. Do not submit machine-generated medical instructions without a qualified review.</p>
            </fieldset>
          ))}
        </div>
        <label className="block text-sm font-semibold">Source reference URL
          <input required type="url" value={draft.sourceReference} onChange={(event) => updateDraft('sourceReference', event.target.value)} placeholder="https://…" className={fieldClass} />
        </label>
        <div className="flex justify-end">
          <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-50">
            <Plus className="h-4 w-4" />{isSaving ? 'Saving…' : draft.id ? 'Save draft' : 'Create draft'}
          </button>
        </div>
      </form>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Resources and review queue</h2>
        {loadError && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{loadError}<button type="button" onClick={() => void fetchResources()} className="ml-2 font-bold underline">Retry</button></div>}
        {isLoading ? <p role="status" className="rounded-xl bg-white p-6 text-sm dark:bg-slate-900">Loading resources…</p> : resources.length === 0 && !loadError ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">No education resources have been created yet.</p>
        ) : (
          <div className="space-y-3">
            {resources.map((resource) => {
              const isAuthor = resource.authorId === user?.id;
              const editable = isAuthor && ['DRAFT', 'REJECTED'].includes(resource.status);
              const canReview = resource.status === 'IN_REVIEW' && !isAuthor;
              return (
                <article key={resource.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{resource.translations.find((item) => item.language === 'en')?.title ?? resource.slug}</h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase dark:bg-slate-800">{resource.status.replace('_', ' ')}</span>
                        <span className="text-xs text-slate-500">v{resource.version}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{resource.category.replace(/_/g, ' ')} · By {resource.author.firstName} {resource.author.lastName} · {resource.translations.map((item) => item.language).join(', ')}</p>
                      {resource.translations.some((item) => item.isMachineTranslated) && (
                        <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">Machine-generated translation present — reviewer verification required</p>
                      )}
                      {isAuthor && resource.status === 'IN_REVIEW' && <p className="mt-2 text-xs text-slate-500">Waiting for another authorized reviewer; authors cannot approve their own content.</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editable && <button type="button" onClick={() => editResource(resource)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-700"><Edit3 className="h-3.5 w-3.5" /> Edit</button>}
                      {editable && <button type="button" onClick={() => void performAction(resource, 'submit')} className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500"><Send className="h-3.5 w-3.5" /> Submit for review</button>}
                      {canReview && <>
                        <button type="button" onClick={() => void performAction(resource, 'reject')} className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-900 dark:text-red-300"><X className="h-3.5 w-3.5" /> Reject</button>
                        <button type="button" onClick={() => void performAction(resource, 'approve')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"><Check className="h-3.5 w-3.5" /> Approve</button>
                      </>}
                    </div>
                  </div>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {resource.translations.map((translation) => (
                      <li key={translation.language} className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold">{translation.language}: {translation.title}</span>
                          <span className={translation.status === 'APPROVED' ? 'font-bold text-emerald-700 dark:text-emerald-300' : 'text-slate-500'}>{translation.status}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-slate-500">{translation.description}</p>
                        <p className="mt-1 text-slate-500">{translation.sourceReferences.length} source(s){translation.isMachineTranslated ? ' · machine-generated' : ''}</p>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

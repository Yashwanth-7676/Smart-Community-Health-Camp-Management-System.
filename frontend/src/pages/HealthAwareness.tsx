import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, BookOpen, CheckCircle2, Clock3, ExternalLink, Languages, Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/api/client';
import { useAuth } from '@/hooks/useAuth';

const CATEGORY_LABELS: Record<string, string> = {
  NUTRITION: 'Nutrition and healthy eating',
  HYGIENE: 'Hygiene and sanitation',
  PREVENTIVE_CARE: 'Preventive healthcare',
  GENERAL_AWARENESS: 'General health awareness',
  MATERNAL_CHILD_HEALTH: 'Maternal and child health',
  PHYSICAL_ACTIVITY: 'Physical activity',
  MENTAL_WELLNESS: 'Mental wellness',
  VACCINATION: 'Vaccination awareness',
  SEASONAL_HEALTH: 'Seasonal health',
  HEALTHY_LIFESTYLE: 'Healthy lifestyle',
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  kn: 'ಕನ್ನಡ',
};

interface EducationTranslation {
  id: string;
  language: string;
  title: string;
  description: string;
  body: string;
  imageUrl: string | null;
  videoUrl: string | null;
  readingMinutes: number;
  sourceReferences: string[];
  isMachineTranslated: boolean;
}

interface EducationResource {
  id: string;
  slug: string;
  category: keyof typeof CATEGORY_LABELS;
  format: 'ARTICLE' | 'VIDEO';
  author: { firstName: string; lastName: string };
  translations: EducationTranslation[];
  progress?: Array<{
    translationId: string;
    progressPercent: number;
    isBookmarked: boolean;
    completedAt: string | null;
  }>;
}

interface EducationProgress {
  translationId: string;
  progressPercent: number;
  isBookmarked: boolean;
  completedAt: string | null;
}

export const HealthAwareness: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('ALL');
  const [language, setLanguage] = React.useState('en');
  const [bookmarksOnly, setBookmarksOnly] = React.useState(false);
  const [selectedResourceId, setSelectedResourceId] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [savingTranslationId, setSavingTranslationId] = React.useState<string | null>(null);

  const languagesQuery = useQuery({
    queryKey: ['education-languages'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: string[] }>('/education/languages');
      return response.data.data;
    },
  });

  const resourcesQuery = useQuery({
    queryKey: ['education-resources', search, category, language, page, bookmarksOnly],
    queryFn: async () => {
      const response = await apiClient.get('/education/resources', {
        params: {
          language,
          page,
          limit: 12,
          ...(bookmarksOnly && { bookmarked: true }),
          ...(search.trim() && { q: search.trim() }),
          ...(category !== 'ALL' && { category }),
        },
      });
      return response.data;
    },
    retry: 1,
  });

  const progressQuery = useQuery({
    queryKey: ['education-progress'],
    queryFn: async () => {
      const response = await apiClient.get('/education/progress');
      return response.data.data as EducationProgress[];
    },
    enabled: isAuthenticated,
  });

  const resources = (resourcesQuery.data?.data ?? []) as EducationResource[];
  const progress = progressQuery.data ?? [];
  const visibleResources = resources;
  const availableLanguages = Array.from(new Set(['en', 'kn', ...(languagesQuery.data ?? [])]));
  const totalPages = resourcesQuery.data?.meta?.totalPages ?? 1;

  const saveProgress = async (translationId: string, values: { progressPercent?: number; isBookmarked?: boolean }) => {
    if (!isAuthenticated) {
      toast.error('Sign in to save your learning progress and bookmarks.');
      return;
    }

    try {
      setSavingTranslationId(translationId);
      await apiClient.put(`/education/progress/${translationId}`, values);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['education-progress'] }),
        queryClient.invalidateQueries({ queryKey: ['education-resources'] }),
      ]);
      if (values.progressPercent === 100) toast.success('Lesson marked complete.');
      if (values.isBookmarked !== undefined) {
        toast.success(values.isBookmarked ? 'Lesson bookmarked.' : 'Bookmark removed.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Learning progress could not be saved.');
    } finally {
      setSavingTranslationId(null);
    }
  };

  const onSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const onCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const onLanguageChange = (value: string) => {
    setLanguage(value);
    setPage(1);
    setSelectedResourceId(null);
  };

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-cyan-800 to-blue-900 p-6 text-white shadow-xl sm:p-9">
        <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-100">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            COMMUNITY HEALTH KNOWLEDGE ACADEMY
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Learn. Share. Stay well.</h1>
          <p className="text-sm leading-relaxed text-cyan-50 sm:text-base">
            Explore reviewed community health education in your language. Articles are shown only after their content and translation have been approved.
          </p>
        </div>
      </header>

      <section aria-label="Search and filter lessons" className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Search approved lessons</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search approved lessons"
            className="w-full rounded-xl border-slate-300 bg-white pl-10 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Topic
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="mt-1 block w-full min-w-48 rounded-xl border-slate-300 bg-white text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="ALL">All topics</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          <span className="flex items-center gap-1"><Languages className="h-4 w-4" /> Language</span>
          <select
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
            className="mt-1 block w-full min-w-36 rounded-xl border-slate-300 bg-white text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            {availableLanguages.map((code) => (
              <option key={code} value={code}>{LANGUAGE_LABELS[code] ?? code}</option>
            ))}
          </select>
        </label>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          Reviewed content only · not a substitute for professional advice
        </div>
        <button
          type="button"
          onClick={() => setBookmarksOnly((value) => !value)}
          aria-pressed={bookmarksOnly}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
            bookmarksOnly
              ? 'border-cyan-600 bg-cyan-600 text-white'
              : 'border-slate-300 bg-white text-slate-700 hover:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
          }`}
        >
          <Bookmark className="h-4 w-4" aria-hidden="true" />
          Saved lessons
        </button>
      </div>

      {resourcesQuery.isLoading && (
        <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm dark:border-slate-800 dark:bg-slate-900">
          Loading approved learning resources…
        </div>
      )}
      {resourcesQuery.isError && (
        <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          The learning library could not be loaded.
          <button type="button" className="ml-2 font-bold underline" onClick={() => void resourcesQuery.refetch()}>Retry</button>
        </div>
      )}
      {!resourcesQuery.isLoading && !resourcesQuery.isError && visibleResources.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <BookOpen className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold">No approved lessons found</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500 dark:text-slate-400">
            Try another language or topic. New learning resources appear here after reviewer approval.
          </p>
        </div>
      )}

      <section aria-label="Approved learning resources" className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {visibleResources.map((resource) => {
          const translation = resource.translations[0];
          if (!translation) return null;
          const currentProgress = progress.find((item) => item.translationId === translation.id);
          const isBookmarked = resource.progress?.find((item) => item.translationId === translation.id)?.isBookmarked
            ?? currentProgress?.isBookmarked
            ?? false;
          const isCompleted = Boolean(currentProgress?.completedAt || resource.progress?.find((item) => item.translationId === translation.id)?.completedAt);

          return (
            <article key={resource.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-bold text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-200">
                  {CATEGORY_LABELS[resource.category] ?? resource.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {translation.readingMinutes} min
                </span>
              </div>
              {translation.imageUrl && (
                <img
                  src={translation.imageUrl}
                  alt=""
                  loading="lazy"
                  className="mt-4 max-h-48 w-full rounded-xl object-cover"
                />
              )}
              <h2 className="mt-4 text-lg font-bold leading-snug">{translation.title}</h2>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {translation.description}
              </p>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                By {resource.author.firstName} {resource.author.lastName}
                {translation.language !== 'en' && ` · ${LANGUAGE_LABELS[translation.language] ?? translation.language}`}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedResourceId(selectedResourceId === resource.id ? null : resource.id)}
                  aria-expanded={selectedResourceId === resource.id}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-3 py-2 text-sm font-bold text-white hover:bg-cyan-500"
                >
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  {selectedResourceId === resource.id ? 'Close lesson' : 'Read lesson'}
                </button>
                <button
                  type="button"
                  onClick={() => void saveProgress(translation.id, { isBookmarked: !isBookmarked })}
                  disabled={savingTranslationId === translation.id}
                  aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark lesson'}
                  aria-pressed={isBookmarked}
                  className="rounded-xl border border-slate-300 p-2 text-slate-600 hover:border-cyan-500 hover:text-cyan-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
                >
                  <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-cyan-500 text-cyan-600' : ''}`} aria-hidden="true" />
                </button>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Completed
                  </span>
                )}
              </div>
              {selectedResourceId === resource.id && (
                <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                  {translation.videoUrl && (
                    <a href={translation.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 underline dark:text-cyan-300">
                      Open lesson video <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                  <div className="max-h-96 space-y-3 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {translation.body}
                  </div>
                  <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Sources</h3>
                    <ul className="space-y-1">
                      {translation.sourceReferences.map((source) => (
                        <li key={source}>
                          <a href={source} target="_blank" rel="noopener noreferrer" className="break-all text-xs text-cyan-700 underline dark:text-cyan-300">
                            {source} <ExternalLink className="inline h-3 w-3" aria-hidden="true" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => void saveProgress(translation.id, { progressPercent: 100 })}
                    disabled={savingTranslationId === translation.id || isCompleted}
                    className="w-full rounded-xl border border-emerald-600/30 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                  >
                    {isCompleted ? 'Lesson completed' : 'Mark lesson complete'}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </section>

      {totalPages > 1 && (
        <nav aria-label="Learning resource pages" className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-700"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-300">Page {page} of {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-700"
          >
            Next
          </button>
        </nav>
      )}

      {isAuthenticated && progressQuery.isLoading && (
        <p role="status" className="text-center text-xs text-slate-500">Loading your saved learning progress…</p>
      )}
      {!isAuthenticated && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          <Link to="/login" className="font-semibold text-cyan-700 underline dark:text-cyan-300">Sign in</Link> to bookmark lessons and keep your learning progress.
        </p>
      )}

    </main>
  );
};

export default HealthAwareness;

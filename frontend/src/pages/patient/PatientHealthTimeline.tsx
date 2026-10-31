import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, CalendarDays, ClipboardList, FileText, HeartPulse, Pill, Stethoscope } from 'lucide-react';
import apiClient from '@/api/client';
import { formatDate } from '@/utils/helpers';

const EVENT_TYPES = [
  { value: 'ALL', label: 'All events' },
  { value: 'APPOINTMENT', label: 'Appointments' },
  { value: 'CAMP_VISIT', label: 'Camp visits' },
  { value: 'SCREENING', label: 'Screenings' },
  { value: 'CONSULTATION', label: 'Consultations' },
  { value: 'PRESCRIPTION', label: 'Prescriptions' },
  { value: 'REFERRAL', label: 'Referrals' },
  { value: 'FOLLOW_UP', label: 'Follow-ups' },
] as const;

type EventType = (typeof EVENT_TYPES)[number]['value'];

interface TimelineEvent {
  id: string;
  recordId: string;
  type: Exclude<EventType, 'ALL'>;
  occurredAt: string;
  title: string;
  summary: string;
  source: string;
  author: { id: string; name: string } | null;
  verificationStatus: 'doctor_verified' | 'system_recorded';
  details: {
    fields: Array<{ label: string; value: string }>;
    measurements?: Array<{ label: string; value: string; unit: string }>;
  };
}

interface TimelineResponse {
  data: TimelineEvent[];
  meta: { total: number; limit: number; truncated: boolean };
}

const EVENT_ICONS: Record<Exclude<EventType, 'ALL'>, React.ElementType> = {
  APPOINTMENT: CalendarDays,
  CAMP_VISIT: HeartPulse,
  SCREENING: Activity,
  CONSULTATION: Stethoscope,
  PRESCRIPTION: Pill,
  REFERRAL: FileText,
  FOLLOW_UP: ClipboardList,
};

export default function PatientHealthTimeline() {
  const [type, setType] = React.useState<EventType>('ALL');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  const timelineQuery = useQuery({
    queryKey: ['patient-health-timeline', type, startDate, endDate],
    queryFn: async () => {
      const response = await apiClient.get<TimelineResponse>('/patients/timeline', {
        params: {
          ...(type !== 'ALL' && { type }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        },
      });
      return response.data;
    },
  });

  const events = timelineQuery.data?.data ?? [];

  return (
    <section className="mx-auto max-w-5xl space-y-6 pb-10">
      <header className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-[#0d2244] to-[#0a1628] p-6 text-white shadow-3d sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-300">
            <Activity className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Digital health passport</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Your health timeline</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
              Review your camp visits, published clinical records, prescriptions, referrals, and follow-ups in date order.
              Clinical records are shown with their source and author.
            </p>
          </div>
        </div>
      </header>

      <section aria-label="Timeline filters" className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Event type
          <select
            value={type}
            onChange={(event) => setType(event.target.value as EventType)}
            className="mt-1.5 block w-full rounded-xl border-slate-300 bg-white text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            {EVENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          From
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)}
            className="mt-1.5 block w-full rounded-xl border-slate-300 bg-white text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          To
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
            className="mt-1.5 block w-full rounded-xl border-slate-300 bg-white text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300" aria-label="Record verification legend">
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-700 dark:text-emerald-300">
          Clinician verified
        </span>
        <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 font-semibold dark:border-slate-700 dark:bg-slate-800">
          System recorded
        </span>
        <span>Records are informational and are not a diagnosis.</span>
      </div>

      {timelineQuery.isLoading && (
        <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Loading your health timeline…
        </div>
      )}

      {timelineQuery.isError && (
        <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          Your health timeline could not be loaded. Please try again.
          <button
            type="button"
            onClick={() => void timelineQuery.refetch()}
            className="ml-2 font-bold underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {!timelineQuery.isLoading && !timelineQuery.isError && events.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <Activity className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 font-bold text-slate-900 dark:text-white">No records for these filters</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Try a different date range or event type.</p>
        </div>
      )}

      <ol className="space-y-3">
        {events.map((event) => {
          const Icon = EVENT_ICONS[event.type];
          return (
            <li key={event.id} className="relative rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-start gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                  <span className="mt-0.5 rounded-xl bg-cyan-500/10 p-2.5 text-cyan-600 dark:text-cyan-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{event.title}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {event.type.replace('_', ' ')}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">{event.summary}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <time dateTime={event.occurredAt}>{formatDate(event.occurredAt)}</time>
                      <span>Source: {event.source}</span>
                      <span>By: {event.author?.name ?? 'Health camp system'}</span>
                      <span className={event.verificationStatus === 'doctor_verified' ? 'font-semibold text-emerald-700 dark:text-emerald-300' : ''}>
                        {event.verificationStatus === 'doctor_verified' ? 'Clinician verified' : 'System recorded'}
                      </span>
                    </span>
                  </span>
                  <span className="sr-only">Expand record details</span>
                </summary>
                <div className="space-y-3 border-t border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
                  {event.details.fields.map((field) => (
                    <div key={field.label} className="grid gap-1 text-sm sm:grid-cols-[10rem_1fr]">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">{field.label}</span>
                      <span className="whitespace-pre-wrap text-slate-800 dark:text-slate-200">{field.value}</span>
                    </div>
                  ))}
                  {event.details.measurements && event.details.measurements.length > 0 && (
                    <div className="grid gap-2 pt-2 sm:grid-cols-2">
                      {event.details.measurements.map((measurement) => (
                        <div key={measurement.label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
                          <span className="block text-xs text-slate-500 dark:text-slate-400">{measurement.label}</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {measurement.value} <span className="text-sm font-medium text-slate-500">{measurement.unit}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    Record reference: {event.recordId}
                  </p>
                </div>
              </details>
            </li>
          );
        })}
      </ol>

      {timelineQuery.data?.meta.truncated && (
        <p role="status" className="text-center text-sm text-slate-500 dark:text-slate-400">
          Showing the latest {timelineQuery.data.meta.limit} matching records. Narrow the date range to view older activity.
        </p>
      )}
    </section>
  );
}

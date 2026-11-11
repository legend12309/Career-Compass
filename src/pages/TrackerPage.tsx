import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  listOpportunities,
  saveOpportunity,
  deleteOpportunity,
  awardXp,
} from '../services/db';
import {
  Opportunity,
  OpportunityType,
  OpportunityStatus,
} from '../types';
import { CompyMascot } from '../components/mascot/CompyMascot';
import { sounds } from '../utils/soundEffects';
import { fireConfetti } from '../utils/confetti';
import {
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
  Search,
  Briefcase,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const OPPORTUNITY_TYPES: { value: OpportunityType; label: string }[] = [
  { value: 'job', label: 'Job' },
  { value: 'internship', label: 'Internship / Apprenticeship' },
  { value: 'exam', label: 'Competitive / Entrance Exam' },
  { value: 'scholarship', label: 'Scholarship / Fellowship' },
  { value: 'admission', label: 'Course / University Admission' },
  { value: 'freelance', label: 'Freelance / Client Project' },
];

const OPPORTUNITY_STATUSES: {
  value: OpportunityStatus;
  label: string;
  badge: string;
  border: string;
  next?: OpportunityStatus;
}[] = [
  {
    value: 'saved',
    label: 'Saved',
    badge: 'bg-sky-100 text-sky-800 border-2 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    border: 'border-b-4 border-b-sky-400',
    next: 'applied',
  },
  {
    value: 'applied',
    label: 'Applied',
    badge: 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    border: 'border-b-4 border-b-emerald-400',
    next: 'interview',
  },
  {
    value: 'interview',
    label: 'Interview',
    badge: 'bg-amber-100 text-amber-800 border-2 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    border: 'border-b-4 border-b-amber-400',
    next: 'offer',
  },
  {
    value: 'offer',
    label: 'Offer 🎉',
    badge: 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    border: 'border-b-4 border-b-indigo-500',
  },
  {
    value: 'rejected',
    label: 'Not Selected',
    badge: 'bg-rose-100 text-rose-800 border-2 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    border: 'border-b-4 border-b-rose-400',
  },
  {
    value: 'closed',
    label: 'Closed',
    badge: 'bg-slate-100 text-slate-700 border-2 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    border: 'border-b-4 border-b-slate-400',
  },
];

export const TrackerPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Opportunity[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [type, setType] = useState<OpportunityType>('job');
  const [status, setStatus] = useState<OpportunityStatus>('saved');
  const [deadline, setDeadline] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [xpToast, setXpToast] = useState<{ show: boolean; text: string }>({ show: false, text: '' });

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user) return;
      const list = await listOpportunities();
      if (active) setItems(list);
    }
    load();
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) return null;

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setOrganization('');
    setType('job');
    setStatus('saved');
    setDeadline('');
    setAppliedDate('');
    setNotes('');
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playPopSound();
    if (!title.trim() || !organization.trim()) {
      setError('Please enter both a title and an organization/institution name.');
      return;
    }
    setError(null);
    const saved = await saveOpportunity({
      id: editingId || `opp-${Date.now()}`,
      title: title.trim(),
      organization: organization.trim(),
      type,
      status,
      deadline,
      appliedDate: appliedDate || new Date().toISOString().slice(0, 10),
      notes: notes.trim(),
    });

    setItems((prev) => {
      const idx = prev.findIndex((o) => o.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });

    await awardXp(20, 'Logged Opportunity');
    sounds.playCorrectSound();
    setXpToast({ show: true, text: '+20 XP! Opportunity Tracked 🎯' });
    setTimeout(() => setXpToast({ show: false, text: '' }), 2200);

    resetForm();
  };

  const handleEdit = (opp: Opportunity) => {
    sounds.playPopSound();
    setEditingId(opp.id);
    setTitle(opp.title);
    setOrganization(opp.organization);
    setType(opp.type);
    setStatus(opp.status);
    setDeadline(opp.deadline || '');
    setAppliedDate(opp.appliedDate || '');
    setNotes(opp.notes || '');
  };

  const handleAdvanceStatus = async (opp: Opportunity, nextStatus: OpportunityStatus) => {
    sounds.playPopSound();
    const updated = await saveOpportunity({
      ...opp,
      status: nextStatus,
    });
    setItems((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));

    await awardXp(30, `Advanced to ${nextStatus}`);
    sounds.playCorrectSound();
    if (nextStatus === 'offer') {
      sounds.playFanfare();
      fireConfetti();
    }
    setXpToast({ show: true, text: `+30 XP! Moved to ${nextStatus.toUpperCase()} 🚀` });
    setTimeout(() => setXpToast({ show: false, text: '' }), 2500);
  };

  const handleDelete = async (id: string) => {
    sounds.playPopSound();
    await deleteOpportunity(id);
    setItems((prev) => prev.filter((o) => o.id !== id));
  };

  const isDeadlineSoon = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const target = new Date(dateStr).getTime();
    if (Number.isNaN(target)) return false;
    const diffDays = (target - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays >= -1 && diffDays <= 7;
  };

  const filtered = items.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.organization.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 relative animate-fadeIn">
      {/* Floating Gamified XP Toast */}
      {xpToast.show && (
        <div className="fixed top-20 right-8 z-50 px-4 py-2.5 rounded-2xl bg-amber-400 text-amber-950 font-black text-xs shadow-xl border-b-4 border-amber-600 animate-bounce flex items-center gap-2">
          <Zap className="w-4 h-4 fill-amber-950 text-amber-950" />
          <span>{xpToast.text}</span>
        </div>
      )}

      {/* Compy Mascot Header */}
      <div className="bg-white dark:bg-slate-900 duo-card p-5 flex items-center gap-4 shadow-sm">
        <CompyMascot mood="happy" size="md" />
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-black text-[10px] uppercase tracking-wider mb-1">
            <Briefcase className="w-3 h-3" />
            <span>Opportunity Tracker</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Applications & Milestone Pipeline
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Track jobs, internships, entrance exams, scholarships, and admissions in one centralized pipeline.
          </p>
        </div>
      </div>

      {/* Duolingo 3D Tactile Status Counters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {OPPORTUNITY_STATUSES.map((st) => {
          const count = items.filter((i) => i.status === st.value).length;
          const isActive = filterStatus === st.value;
          return (
            <button
              key={st.value}
              type="button"
              onClick={() => {
                sounds.playPopSound();
                setFilterStatus(isActive ? 'all' : st.value);
              }}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-24 text-left transition-all cursor-pointer ${
                isActive
                  ? 'border-2 border-slate-900 dark:border-white ring-2 ring-slate-900/20'
                  : 'border-2 border-slate-200 dark:border-slate-800'
              } ${st.border}`}
            >
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg w-fit ${st.badge}`}>
                {st.label}
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums leading-none mt-2">
                {count}
              </p>
            </button>
          );
        })}
      </div>

      {/* Add / Edit Form in Duolingo 3D Card */}
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-slate-900 duo-card p-5 sm:p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
            {editingId ? 'Edit Tracked Opportunity' : 'Log New Opportunity (+20 XP)'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {error && <p className="text-xs text-rose-600 font-bold">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Role, Exam, Scholarship, or Course Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="duo-input text-xs"
          />
          <input
            type="text"
            placeholder="Organization / Company / University *"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="duo-input text-xs"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as OpportunityType)}
            className="duo-input text-xs"
          >
            {OPPORTUNITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OpportunityStatus)}
            className="duo-input text-xs"
          >
            {OPPORTUNITY_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
              Deadline Date
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full duo-input text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
              Applied Date
            </label>
            <input
              type="date"
              value={appliedDate}
              onChange={(e) => setAppliedDate(e.target.value)}
              className="w-full duo-input text-xs"
            />
          </div>
        </div>

        <textarea
          rows={2}
          placeholder="Notes, interview round details, preparation links, or follow-ups..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full duo-input text-xs"
        />

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-6 py-2.5 duo-btn-green text-xs flex items-center gap-2 uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{editingId ? 'UPDATE OPPORTUNITY' : 'SAVE OPPORTUNITY (+20 XP)'}</span>
          </button>
        </div>
      </form>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              sounds.playPopSound();
              setFilterStatus('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'duo-btn-green text-white'
                : 'duo-btn-white text-slate-700 dark:text-slate-300'
            }`}
          >
            All Statuses ({items.length})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracked opportunities..."
            className="w-full pl-9 pr-3 py-2 duo-input text-xs"
          />
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 duo-card p-8 text-center text-xs text-slate-400 font-bold">
            No opportunities match your filter.
          </div>
        ) : (
          filtered.map((item) => {
            const statusConfig = OPPORTUNITY_STATUSES.find((s) => s.value === item.status);
            const isUrgent = isDeadlineSoon(item.deadline || '');

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 duo-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${statusConfig?.badge}`}>
                      {statusConfig?.label}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {item.type}
                    </span>
                    {isUrgent && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-md">
                        <AlertTriangle className="w-3 h-3" />
                        Deadline Soon!
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    {item.organization} {item.deadline ? `· Deadline: ${item.deadline}` : ''}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-1">
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {statusConfig?.next && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(item, statusConfig.next!)}
                      className="px-3.5 py-2 duo-btn-green text-xs flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                    >
                      <span>Move to {statusConfig.next}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="p-2 duo-btn-white cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 duo-btn-white hover:text-rose-600 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

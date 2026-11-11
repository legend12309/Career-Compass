import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Resource } from '../types';
import { listUsers, toggleUserActiveStatus } from '../services/auth';
import {
  listResources,
  saveResource,
  deleteResource,
  getPlatformStats,
} from '../services/db';
import { CompyMascot } from '../components/mascot/CompyMascot';
import { sounds } from '../utils/soundEffects';
import {
  ShieldCheck,
  Search,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  UserX,
  UserCheck,
} from 'lucide-react';

export function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState({
    totalProfiles: 0,
    totalResumes: 0,
    totalSkills: 0,
    totalCertificates: 0,
    totalOpportunities: 0,
    totalRoadmaps: 0,
    totalResources: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [editingResId, setEditingResId] = useState<string | null>(null);
  const [resTitle, setResTitle] = useState('');
  const [resCategory, setResCategory] = useState('Technology & Software');
  const [resLink, setResLink] = useState('');
  const [resDesc, setResDesc] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      if (!user || user.role !== 'admin') return;
      setLoading(true);
      try {
        const [uList, rList, pStats] = await Promise.all([
          listUsers(),
          listResources(),
          getPlatformStats(),
        ]);
        setUsers(uList);
        setResources(rList);
        setStats(pStats);
      } catch (err) {
        console.error('Error loading admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleToggleUserActive = async (targetUser: User) => {
    setFeedback(null);
    try {
      const updated = await toggleUserActiveStatus(targetUser.id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setFeedback({
        type: 'success',
        text: `User "${updated.name}" is now ${updated.active ? 'Active' : 'Deactivated'}.`,
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not change user status.',
      });
    }
  };

  const handleSaveResource = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!resTitle.trim() || !resLink.trim() || !resDesc.trim()) {
      setFeedback({ type: 'error', text: 'Title, link URL, and description are required.' });
      return;
    }

    let formattedLink = resLink.trim();
    if (!/^https?:\/\//i.test(formattedLink)) {
      formattedLink = `https://${formattedLink}`;
    }

    try {
      const saved = await saveResource({
        id: editingResId || `res-${Date.now()}`,
        title: resTitle.trim(),
        category: resCategory,
        link: formattedLink,
        description: resDesc.trim(),
      });

      setResources((prev) => {
        const exists = prev.some((r) => r.id === saved.id);
        return exists ? prev.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...prev];
      });

      setEditingResId(null);
      setResTitle('');
      setResLink('');
      setResDesc('');
      setFeedback({ type: 'success', text: 'Resource published.' });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not save resource.',
      });
    }
  };

  const handleDeleteResource = async (id: string) => {
    setFeedback(null);
    try {
      await deleteResource(id);
      setResources((prev) => prev.filter((r) => r.id !== id));
      setFeedback({ type: 'success', text: 'Resource deleted.' });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not delete resource.',
      });
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Compy Mascot Header */}
      <div className="bg-white dark:bg-slate-900 duo-card p-5 flex items-center gap-4 shadow-sm">
        <CompyMascot mood="happy" size="md" />
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black text-[10px] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Admin Console</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            System Administration
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Manage users, view platform data metrics, and publish verified career resources.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border-2 flex items-center gap-2.5 text-xs font-black shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
              : 'bg-rose-50 text-rose-950 border-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Platform Stats in 4 Duolingo 3D Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 duo-card p-4 flex flex-col justify-between h-28 shadow-sm border-b-4 border-b-sky-400">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            Registered Users
          </span>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums leading-none">
              {users.length}
            </p>
            <span className="text-[10px] font-bold text-slate-400 mt-1 block">
              {users.filter((u) => u.active).length} active · {users.filter((u) => !u.active).length} deactivated
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 duo-card p-4 flex flex-col justify-between h-28 shadow-sm border-b-4 border-b-emerald-400">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            Profiles & Resumes
          </span>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums leading-none">
              {stats.totalProfiles}
            </p>
            <span className="text-[10px] font-bold text-slate-400 mt-1 block">
              {stats.totalResumes} single-column resumes
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 duo-card p-4 flex flex-col justify-between h-28 shadow-sm border-b-4 border-b-amber-400">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            Tracked Opportunities
          </span>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums leading-none">
              {stats.totalOpportunities}
            </p>
            <span className="text-[10px] font-bold text-slate-400 mt-1 block">
              {stats.totalSkills} skills logged
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 duo-card p-4 flex flex-col justify-between h-28 shadow-sm border-b-4 border-b-purple-400">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            Curated Resources
          </span>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums leading-none">
              {resources.length}
            </p>
            <span className="text-[10px] font-bold text-slate-400 mt-1 block">
              {stats.totalRoadmaps} learning plans generated
            </span>
          </div>
        </div>
      </div>

      {/* Users Management Table Card */}
      <div className="bg-white dark:bg-slate-900 duo-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b-2 border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
              Platform Accounts ({filteredUsers.length})
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Activate or deactivate user logins instantly.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full pl-9 pr-3 py-2 duo-input text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
              <tr>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Loading accounts...
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u.id === user?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {u.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {u.email}
                      </td>
                      <td className="py-3 px-4 capitalize font-semibold">{u.role}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            u.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                          }`}
                        >
                          {u.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isSelf ? (
                          <span className="text-[11px] text-slate-400 font-semibold">Active Session</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleUserActive(u)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                              u.active
                                ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300'
                                : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {u.active ? (
                              <>
                                <UserX className="w-3 h-3" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3" />
                                <span>Reactivate</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resources Publishing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSaveResource}
          className="lg:col-span-5 bg-white dark:bg-slate-900 duo-card p-5 sm:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center font-black border-2 border-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            </div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
              {editingResId ? 'Edit Resource' : 'Publish Resource'}
            </h2>
          </div>

          <div>
            <label htmlFor="res-title" className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Title *
            </label>
            <input
              id="res-title"
              type="text"
              required
              value={resTitle}
              onChange={(e) => setResTitle(e.target.value)}
              className="w-full duo-input text-xs"
            />
          </div>

          <div>
            <label htmlFor="res-cat" className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              id="res-cat"
              value={resCategory}
              onChange={(e) => setResCategory(e.target.value)}
              className="w-full duo-input text-xs"
            >
              <option value="Technology & Software">Technology & Software</option>
              <option value="Healthcare & Public Health">Healthcare & Public Health</option>
              <option value="Commerce, Finance & Business">Commerce, Finance & Business</option>
              <option value="Skilled Trades, Arts & Vocational">
                Skilled Trades, Arts & Vocational
              </option>
              <option value="Law, Education & Public Service">
                Law, Education & Public Service
              </option>
            </select>
          </div>

          <div>
            <label htmlFor="res-link" className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Resource URL *
            </label>
            <input
              id="res-link"
              type="text"
              required
              value={resLink}
              onChange={(e) => setResLink(e.target.value)}
              className="w-full duo-input text-xs"
            />
          </div>

          <div>
            <label htmlFor="res-desc" className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Summary Description *
            </label>
            <textarea
              id="res-desc"
              rows={3}
              required
              value={resDesc}
              onChange={(e) => setResDesc(e.target.value)}
              className="w-full duo-input text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 duo-btn-green text-xs flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{editingResId ? 'UPDATE RESOURCE' : 'PUBLISH RESOURCE'}</span>
          </button>
        </form>

        <div className="lg:col-span-7 bg-white dark:bg-slate-900 duo-card p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
            Published Directory ({resources.length})
          </h2>
          <div className="space-y-3">
            {resources.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 inline-block mb-1">
                    {r.category}
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{r.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{r.description}</p>
                  <a
                    href={r.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                  >
                    <span>{r.link}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingResId(r.id);
                      setResTitle(r.title);
                      setResCategory(r.category);
                      setResLink(r.link);
                      setResDesc(r.description);
                    }}
                    className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                    aria-label={`Edit ${r.title}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteResource(r.id)}
                    className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/30"
                    aria-label={`Delete ${r.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

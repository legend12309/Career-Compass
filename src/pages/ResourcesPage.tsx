import React, { useState, useEffect } from 'react';
import { listResources } from '../services/db';
import { Resource } from '../types';
import { CompyMascot } from '../components/mascot/CompyMascot';
import { sounds } from '../utils/soundEffects';
import { ExternalLink, Search, ArrowUpRight, BookOpen, Sparkles } from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      const list = await listResources();
      if (active) setResources(list);
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const categories = [
    'All',
    ...Array.from(new Set(resources.map((r) => r.category).filter(Boolean))),
  ];

  const filtered = resources.filter((r) => {
    if (selectedCategory !== 'All' && r.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 relative animate-fadeIn">
      {/* Compy Mascot Header */}
      <div className="bg-white dark:bg-slate-900 duo-card p-5 flex items-center gap-4 shadow-sm">
        <CompyMascot mood="happy" size="md" />
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black text-[10px] uppercase tracking-wider mb-1">
            <BookOpen className="w-3 h-3" />
            <span>Learning Library</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Curated Career & Learning Resources
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Hand-picked learning portals, open-source repositories, and skill development courses across fields.
          </p>
        </div>
      </div>

      {/* Categories & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                sounds.playPopSound();
                setSelectedCategory(cat);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'duo-btn-green text-white'
                  : 'duo-btn-white text-slate-700 dark:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guides and courses..."
            className="w-full pl-9 pr-3 py-2 duo-input text-xs"
          />
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 bg-white dark:bg-slate-900 duo-card p-8 text-center text-xs text-slate-400 font-bold">
            No resources match your filter criteria.
          </div>
        ) : (
          filtered.map((res) => (
            <div
              key={res.id}
              className="bg-white dark:bg-slate-900 duo-card p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all"
            >
              <div className="space-y-2">
                <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                  {res.category}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {res.title}
                </h3>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  {res.description}
                </p>
              </div>

              <div className="pt-2 border-t-2 border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">
                  Verified Resource
                </span>
                <a
                  href={res.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sounds.playPopSound()}
                  className="px-4 py-1.5 duo-btn-sky text-xs flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <span>OPEN RESOURCE</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

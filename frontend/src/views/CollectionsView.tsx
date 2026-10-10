import React from 'react';
import { ChevronDown, Plus, Flower2, Sprout, Sparkles, Leaf } from 'lucide-react';
import { GrowthStage } from '../types';

interface SampleCard {
  id: string;
  title: string;
  category: string;
  date: string;
  stage: GrowthStage;
  stageColor: string;
}

const sampleCards: SampleCard[] = [
  { id: '1', title: 'Deadlines And Focus', category: 'WORK', date: '2/8/2026', stage: 'sprout', stageColor: 'text-sage-600 bg-sage-50 border-sage-200' },
  { id: '2', title: 'Weekly Running Habit', category: 'HEALTH', date: '2/8/2026', stage: 'bloom', stageColor: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: '3', title: 'Presentation Slides', category: 'WORK', date: '2/8/2026', stage: 'mature', stageColor: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: '4', title: 'Lakeside Freedom', category: 'REFLECTION', date: '2/8/2026', stage: 'bloom', stageColor: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: '5', title: 'Visual Journaling', category: 'IDEA', date: '2/8/2026', stage: 'seed', stageColor: 'text-clay-600 bg-clay-50 border-clay-200' },
  { id: '6', title: 'Finding A Calm Rhythm', category: 'HABIT', date: '2/8/2026', stage: 'sprout', stageColor: 'text-sage-600 bg-sage-50 border-sage-200' },
];

export const CollectionsView: React.FC = () => {
  return (
    <div className="space-y-8 pb-16">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-earth-900 tracking-tight">
            My Collection
          </h2>
          <p className="text-sm text-stone-400 mt-1">
            Thoughts naturally grouped as your thinking matures
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-parchment-border rounded-xl text-xs font-semibold text-earth-700 tracking-wider hover:bg-parchment-soft shadow-soft transition-all">
            <span>ALL CATEGORIES</span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-parchment-border rounded-xl text-xs font-semibold text-earth-700 tracking-wider hover:bg-parchment-soft shadow-soft transition-all">
            <span>ALL TIME</span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs font-medium shadow-soft transition-all">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">New Collection</span>
          </button>
        </div>
      </div>

      {/* Grid of Collection Cards (mirrors reference UI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {sampleCards.map((card) => (
          <div
            key={card.id}
            className="group relative bg-white border border-parchment-border hover:border-sage-300 rounded-3xl p-6 shadow-soft hover:shadow-soft-md transition-all duration-200 flex flex-col justify-between h-72 cursor-pointer"
          >
            {/* Top row: Category badge */}
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-medium">
                {card.category}
              </span>
            </div>

            {/* Botanical Centerpiece */}
            <div className="flex-1 flex items-center justify-center my-3 group-hover:scale-105 transition-transform duration-300">
              <div className="w-24 h-24 rounded-full bg-parchment-soft/80 border border-parchment-border/60 flex items-center justify-center">
                {card.stage === 'seed' && <Sprout className="w-10 h-10 text-clay-500" />}
                {card.stage === 'sprout' && <Leaf className="w-10 h-10 text-sage-500" />}
                {card.stage === 'bloom' && <Flower2 className="w-10 h-10 text-rose-500" />}
                {card.stage === 'mature' && <Sparkles className="w-10 h-10 text-amber-500" />}
              </div>
            </div>

            {/* Bottom details */}
            <div className="pt-2 border-t border-parchment-border/60">
              <h3 className="font-serif text-base font-semibold text-earth-900 group-hover:text-sage-700 transition-colors truncate">
                {card.title}
              </h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-stone-400">
                  {card.date}
                </span>
                <span className={`text-[11px] font-medium capitalize px-2 py-0.5 rounded-full border ${card.stageColor}`}>
                  {card.stage}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

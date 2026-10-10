import { ArrowRight, Sprout, Trees, History } from 'lucide-react';

export const GardenView: React.FC = () => {
  return (
    <div className="space-y-10 pb-16">
      {/* Quick Capture Hero Section */}
      <section className="bg-white/80 backdrop-blur-sm border border-parchment-border rounded-3xl p-6 sm:p-8 shadow-soft">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-sage-600 flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-sage-500" />
              Plant a thought
            </span>
            <span className="text-xs text-stone-400">
              No title or tags needed
            </span>
          </div>

          {/* Capture Surface */}
          <div className="relative">
            <textarea
              rows={3}
              placeholder="What's on your mind? Jot down an unfinished idea, question, or fragment..."
              className="w-full bg-parchment-soft/60 focus:bg-white text-earth-800 placeholder-stone-400 text-base sm:text-lg rounded-2xl p-4 sm:p-5 border border-parchment-border focus:border-sage-400 focus:ring-2 focus:ring-sage-200 transition-all resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-stone-400 hidden sm:block">
              Press <kbd className="px-1.5 py-0.5 bg-parchment-soft rounded border border-parchment-border font-mono text-[10px] text-stone-500">Ctrl + Enter</kbd> to plant
            </p>
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 bg-sage-600 hover:bg-sage-700 active:scale-95 text-white rounded-xl text-sm font-medium shadow-soft transition-all"
            >
              <span>Plant thought</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Gentle First-Run Empty Garden Banner */}
      <section className="text-center py-12 px-4 rounded-3xl bg-gradient-to-b from-parchment-soft/40 to-transparent border border-dashed border-parchment-border/80">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage-50 border border-sage-100 text-sage-600 mb-4 shadow-soft">
          <Sprout className="w-8 h-8 text-sage-500 animate-pulse" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-earth-900 mb-2">
          Your garden starts with one thought
        </h2>
        <p className="text-sm sm:text-base text-stone-400 max-w-md mx-auto leading-relaxed">
          Put down any fleeting thought above. As ideas accumulate, gentle connections and natural collections will begin to sprout.
        </p>
      </section>

      {/* The 3 Pillars (from Product Flow Reference) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="bg-white/60 border border-parchment-border rounded-2xl p-6 shadow-soft hover:shadow-soft-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-sage-100/70 text-sage-700 flex items-center justify-center mb-4">
            <Sprout className="w-5 h-5 text-sage-600" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-earth-900 mb-1.5">
            1. Plant a thought
          </h3>
          <p className="text-xs font-medium text-sage-600 mb-2">Capture first. Organize later.</p>
          <p className="text-xs text-stone-400 leading-relaxed">
            One simple writing surface. A thought can remain a tiny, unfinished fragment indefinitely without pressure.
          </p>
        </div>

        <div className="bg-white/60 border border-parchment-border rounded-2xl p-6 shadow-soft hover:shadow-soft-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-moss-100/70 text-moss-600 flex items-center justify-center mb-4">
            <Trees className="w-5 h-5 text-moss-600" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-earth-900 mb-1.5">
            2. Watch thoughts grow
          </h3>
          <p className="text-xs font-medium text-moss-600 mb-2">Collections emerge naturally.</p>
          <p className="text-xs text-stone-400 leading-relaxed">
            Transparent suggestions notice shared themes and explain why. Accept or dismiss them; your words stay intact.
          </p>
        </div>

        <div className="bg-white/60 border border-parchment-border rounded-2xl p-6 shadow-soft hover:shadow-soft-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-clay-100/70 text-clay-600 flex items-center justify-center mb-4">
            <History className="w-5 h-5 text-clay-600" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-earth-900 mb-1.5">
            3. Return to what matters
          </h3>
          <p className="text-xs font-medium text-clay-600 mb-2">Old ideas get another chance.</p>
          <p className="text-xs text-stone-400 leading-relaxed">
            Rediscover thoughts you wrote weeks ago. No streaks, no guilt, and no forced conversion into tasks.
          </p>
        </div>
      </section>
    </div>
  );
};

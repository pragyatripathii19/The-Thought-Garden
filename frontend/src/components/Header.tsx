import React from 'react';
import { Sprout, Compass, Library, Search, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { NavTab } from '../types';

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'garden', label: 'Garden', icon: Compass },
    { id: 'collections', label: 'Collections', icon: Library },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'settings', label: 'Data & Settings', icon: SlidersHorizontal },
  ];

  return (
    <header className="sticky top-0 z-30 bg-parchment/90 backdrop-blur-md border-b border-parchment-border transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand & Identity */}
          <div 
            onClick={() => onTabChange('garden')}
            className="flex items-center gap-3.5 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sage-500 to-moss-400 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5 text-parchment-light" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-earth-900 group-hover:text-sage-700 transition-colors">
                  The Thought Garden
                </span>
              </div>
              <p className="text-xs text-stone-400 font-normal hidden sm:block">
                Every thought has a home
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-sage-600 text-white shadow-soft'
                      : 'text-earth-700 hover:text-earth-900 hover:bg-parchment-soft'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Local-First Notice Banner */}
        <div className="py-1.5 flex items-center justify-between border-t border-parchment-border/60 text-[11px] text-stone-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sage-600 flex-shrink-0" />
            <span>Private & browser-local: thoughts never leave your device.</span>
          </div>
          <span className="hidden sm:inline text-stone-400">
            Export backups regularly in Settings
          </span>
        </div>
      </div>
    </header>
  );
};

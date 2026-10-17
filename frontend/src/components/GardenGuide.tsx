import React from 'react';
import { GrowthStage } from '../types';
import { stageConfig } from './GrowthStageBadge';
import { GROWTH_RULES } from '../lib/growth';

const PRINCIPLES = [
  {
    title: 'Capture first, organise later',
    text: 'Plant thoughts as raw fragments. No titles, tags or folders needed.',
  },
  {
    title: 'Natural growth',
    text: 'Thoughts grow from Seed to Mature as you come back to them. See how below.',
  },
  {
    title: 'Gentle rediscovery',
    text: 'No streaks, no pressure. Older thoughts resurface when you’re ready.',
  },
  {
    title: 'Safe in your account',
    text: 'Your garden is saved to your account, on any device you log in from. Only you see it in the app.',
  },
];

const STAGE_RULES: { stage: GrowthStage; rule: string }[] = [
  { stage: 'seed', rule: 'Every new thought starts here.' },
  {
    stage: 'sprout',
    rule: 'When you come back to it: edit it, save it, add it to a collection, or connect it to another thought.',
  },
  {
    stage: 'bloom',
    rule: `When it’s connected to another thought and has grown: edited ${GROWTH_RULES.bloomEdits}+ times, ${GROWTH_RULES.bloomLength}+ characters long, or in ${GROWTH_RULES.bloomCollections}+ collections.`,
  },
  { stage: 'mature', rule: 'Only when you say so. Mark a thought Mature when the idea feels complete.' },
];

/** The garden's philosophy and how thoughts grow (formerly "Learn & Explore"). */
export const GardenGuide: React.FC = () => (
  <section className="bg-garden-card border border-garden-line rounded-2xl p-5 sm:p-6 space-y-6" aria-labelledby="garden-guide-title">
    <h3 id="garden-guide-title" className="font-serif text-2xl font-semibold text-garden-ink">
      About the garden
    </h3>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {PRINCIPLES.map((p) => (
        <div key={p.title} className="p-4 rounded-xl bg-[#FDFBF3] border border-garden-line space-y-1">
          <h4 className="font-serif text-lg font-semibold text-garden-ink leading-snug">{p.title}</h4>
          <p className="text-sm text-garden-ink-soft leading-relaxed">{p.text}</p>
        </div>
      ))}
    </div>

    <div className="space-y-3">
      <h4 className="font-serif text-xl font-semibold text-garden-ink">How thoughts grow</h4>
      <ol className="space-y-2.5">
        {STAGE_RULES.map(({ stage, rule }) => {
          const config = stageConfig[stage];
          const Icon = config.icon;
          return (
            <li key={stage} className="flex items-start gap-3">
              <span
                className={`inline-flex items-center gap-1 w-24 shrink-0 justify-center px-2 py-1 rounded-full border text-xs font-semibold ${config.styles}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </span>
              <p className="text-sm text-garden-ink-soft leading-relaxed pt-0.5">{rule}</p>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-garden-ink-faint leading-relaxed">
        Stages only move forward on their own. You can pick a stage yourself anytime from a thought’s details; the
        garden then leaves it alone until you let it grow automatically again.
      </p>
    </div>
  </section>
);

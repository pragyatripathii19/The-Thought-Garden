import React from 'react';
import { ArrowRight, Sprout, NotebookPen, Files, FolderTree, Leaf } from 'lucide-react';
import { ART } from '../lib/art';
import { stageConfig } from '../components/GrowthStageBadge';
import { FallingLeaves } from '../components/FallingLeaves';

interface LandingViewProps {
  onStart: () => void;
  onLogin: () => void;
}

const decor = 'pointer-events-none select-none';
const container = 'relative max-w-6xl mx-auto px-4 sm:px-6';
const h2Class = 'font-serif text-[34px] sm:text-5xl font-semibold leading-tight text-garden-ink';
const bodyClass = 'text-base sm:text-lg leading-relaxed text-garden-ink-soft';
const cardClass = 'bg-garden-card border border-garden-line rounded-3xl shadow-soft';
const cardTitle = 'font-serif text-2xl font-semibold text-garden-ink';
const cardBody = 'text-[15px] leading-relaxed text-garden-ink-soft';

/** The main call to action. A link to #signup, so it also works opened in a new tab. */
const PlantButton: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <a
    href="#signup"
    onClick={(e) => {
      e.preventDefault();
      onStart();
    }}
    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-garden-moss hover:bg-garden-moss-dark text-garden-paper font-medium text-[15px] shadow-md transition-all active:scale-[0.98]"
  >
    Plant Your First Thought
    <ArrowRight className="w-4 h-4" />
  </a>
);

/** Every section below the hero: same spacing, optionally on a soft band of colour. */
const Section: React.FC<{ band?: boolean; children: React.ReactNode }> = ({ band = false, children }) => (
  <section className={band ? 'bg-garden-paper-deep/50 border-y border-garden-line-soft' : ''}>
    <div className={`${container} py-20 sm:py-28`}>{children}</div>
  </section>
);

/** Centred heading block: one small engraving, the title and an optional one-line intro. */
const SectionHeader: React.FC<{ art?: string; title: string; intro?: React.ReactNode }> = ({ art, title, intro }) => (
  <div className="max-w-2xl mx-auto text-center space-y-4">
    {art && <img src={art} alt="" aria-hidden="true" className={`h-16 sm:h-20 w-auto mx-auto ${decor}`} />}
    <h2 className={h2Class}>{title}</h2>
    {intro && <p className={bodyClass}>{intro}</p>}
  </div>
);

/** The closing line of a section, in the same style everywhere. */
const SectionClose: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="max-w-2xl mx-auto text-center mt-12 sm:mt-16 font-serif text-2xl sm:text-3xl font-semibold leading-snug text-garden-moss">
    {children}
  </p>
);

const PROBLEMS = [
  {
    icon: NotebookPen,
    title: 'The notebook graveyard',
    body: 'Ideas in margins and loose pages, never to be found again.',
  },
  {
    icon: Files,
    title: 'The endless notes app',
    body: 'Hundreds of notes called "Ideas" and "Random". All saved, none findable.',
  },
  {
    icon: FolderTree,
    title: 'The organizing rabbit hole',
    body: 'More time building the perfect system than actually thinking.',
  },
];

const STEPS = [
  { stage: 'seed' as const, title: 'Let it out.', body: 'Write it down as it is: messy, half-formed, unfinished.' },
  { stage: 'sprout' as const, title: 'Let it find its place.', body: 'Thoughts settle into collections. No sorting needed first.' },
  { stage: 'bloom' as const, title: "Come back when you're ready.", body: 'Old ideas resurface when you need them most.' },
];

const BUSY_MIND = [
  'Catch it before it disappears.',
  'Skip the sorting ritual.',
  'Let unfinished thoughts exist.',
  'Pick up where you left off.',
];

const FEATURES = [
  { art: ART.wateringCan, title: 'Capture freely.', body: 'Get it out of your head the moment it arrives.' },
  { art: ART.fairyHouse, title: 'Collections that grow with you.', body: 'Group thoughts by what you care about, and change them anytime.' },
  { art: ART.mushrooms, title: 'Find your way back.', body: "Reconnect with ideas you've saved, even months later." },
  { art: ART.butterflyYellow, title: 'Room to just be.', body: "No tasks, no deadlines. Just space for what's on your mind." },
];

/** The page people see before they have an account. Adapted from docs/Landing Page/Content. */
export const LandingView: React.FC<LandingViewProps> = ({ onStart, onLogin }) => (
  <div className="relative min-h-screen font-sans text-garden-ink overflow-x-hidden">
    <FallingLeaves />

    {/* Top bar */}
    <header className={`${container} z-10 flex items-center justify-between py-4 sm:py-6`}>
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl bg-garden-pill/60 border border-[#CBD5AE] text-garden-moss flex items-center justify-center">
          <Sprout className="w-5 h-5" />
        </span>
        <span className="font-serif text-xl sm:text-2xl font-semibold">The Thought Garden</span>
      </div>
      <a
        href="#login"
        onClick={(e) => {
          e.preventDefault();
          onLogin();
        }}
        className="px-4 py-2 rounded-full border border-garden-line bg-garden-card/70 hover:bg-garden-card-hover text-sm font-semibold text-garden-moss transition-colors"
      >
        Log in
      </a>
    </header>

    <main className="relative z-10">
      {/* Hero */}
      <section className="relative">
        <div className={`${container} grid md:grid-cols-[1.15fr_0.85fr] gap-6 md:gap-10 items-center pt-4 sm:pt-10 pb-20 sm:pb-28`}>
          <div className="order-2 md:order-1 space-y-6">
            <h1 className="font-serif text-[46px] sm:text-6xl lg:text-7xl font-semibold leading-[1.05]">
              The Thought Garden
            </h1>
            <p className="font-serif italic text-2xl sm:text-3xl leading-snug text-garden-moss">
              Every thought has a home, even when you don't know what that home is yet.
            </p>
            <p className={`${bodyClass} max-w-lg`}>
              A little space for all the things on your mind. No folders, no system. Just somewhere for your thoughts
              to land.
            </p>
            <div className="space-y-3 pt-2">
              <PlantButton onStart={onStart} />
              <p className="text-sm text-garden-ink-faint">No pressure. Just a place to begin.</p>
            </div>
          </div>

          <div className="order-1 md:order-2 relative mx-auto w-56 sm:w-72 md:w-full max-w-sm" aria-hidden="true">
            <img src={ART.tree} alt="" className={`w-full ${decor}`} />
            <div className="absolute -left-6 sm:-left-10 top-[12%] w-20 sm:w-28 -rotate-6">
              <img src={ART.hummingbird} alt="" className={`w-full animate-gentle-float ${decor}`} />
            </div>
          </div>
        </div>
      </section>

      {/* Your brain isn't a filing cabinet. */}
      <Section band>
        <SectionHeader art={ART.moon} title="Your brain isn't a filing cabinet." />
        <div className="grid md:grid-cols-3 gap-4 sm:gap-5 mt-10 sm:mt-14">
          {PROBLEMS.map(({ icon: Icon, title, body }) => (
            <article key={title} className={`${cardClass} p-6 space-y-3`}>
              <span className="w-10 h-10 rounded-2xl bg-garden-tag border border-garden-line text-garden-tag-ink flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </span>
              <h3 className={cardTitle}>{title}</h3>
              <p className={cardBody}>{body}</p>
            </article>
          ))}
        </div>
        <SectionClose>Your thoughts aren't the problem. Keeping them shouldn't be this hard.</SectionClose>
      </Section>

      {/* Just plant the thought. */}
      <Section>
        <SectionHeader art={ART.wildflowers} title="Just plant the thought." />
        <ol className="grid md:grid-cols-3 gap-4 sm:gap-5 mt-10 sm:mt-14">
          {STEPS.map(({ stage, title, body }) => {
            const { icon: StageIcon, label, styles, iconColor } = stageConfig[stage];
            return (
              <li key={stage} className={`${cardClass} p-6 space-y-3`}>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${styles}`}>
                  <StageIcon className={`w-3.5 h-3.5 ${iconColor}`} />
                  {label}
                </span>
                <h3 className={cardTitle}>{title}</h3>
                <p className={cardBody}>{body}</p>
              </li>
            );
          })}
        </ol>
      </Section>

      {/* For minds that think in a hundred directions at once. */}
      <Section band>
        <SectionHeader
          art={ART.bee}
          title="For minds that think in a hundred directions at once."
          intro="ADHD, a busy mind, or just more ideas than you know what to do with? This is a gentler place to keep them."
        />
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-10 sm:mt-14">
          {BUSY_MIND.map((line) => (
            <li key={line} className={`${cardClass} p-5 flex items-center gap-3`}>
              <Leaf className="w-5 h-5 shrink-0 text-garden-moss" aria-hidden="true" />
              <span className="text-[15px] font-semibold text-garden-ink">{line}</span>
            </li>
          ))}
        </ul>
        <SectionClose>Your mind can wander. Your thoughts can stay.</SectionClose>
      </Section>

      {/* Not every thought needs to become something. */}
      <Section>
        <SectionHeader
          art={ART.butterfly}
          title="Not every thought needs to become something."
          intro="Some thoughts are seeds. Some are just flowers. Not everything has to be a project."
        />
        <SectionClose>It's about giving yourself the space to have them.</SectionClose>
      </Section>

      {/* A little home for all your thoughts. */}
      <Section band>
        <SectionHeader title="A little home for all your thoughts." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-10 sm:mt-14">
          {FEATURES.map(({ art, title, body }) => (
            <article key={title} className={`${cardClass} p-6 space-y-3 text-center`}>
              <img src={art} alt="" aria-hidden="true" className={`h-28 w-auto mx-auto object-contain ${decor}`} />
              <h3 className={cardTitle}>{title}</h3>
              <p className={cardBody}>{body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* Your thoughts deserve a place to grow. */}
      <Section>
        <SectionHeader
          art={ART.sun}
          title="Your thoughts deserve a place to grow."
          intro="That idea you keep meaning to write down? Start there."
        />
        <div className="text-center mt-10 space-y-3">
          <PlantButton onStart={onStart} />
          <p className="text-sm text-garden-ink-faint">On your phone? Add it to your home screen and it opens like an app.</p>
        </div>
      </Section>

      <footer className="border-t border-garden-line-soft">
        <div className={`${container} py-8 text-center space-y-1`}>
          <p className="font-serif italic text-lg text-garden-ink-soft">The Thought Garden. Every thought has a home.</p>
          <p className="text-sm text-garden-ink-faint">Grown with care by Pragya</p>
        </div>
      </footer>
    </main>
  </div>
);

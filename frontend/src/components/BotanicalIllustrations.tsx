import React from 'react';

/**
 * Botanical Leaf Logo Icon used in desktop sidebar, mobile header, and brand badges.
 */
export const LeafLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Central Stem */}
    <path
      d="M12 21V11M12 11C12 7 15 4 19 4C19 8 16 11 12 11Z"
      stroke="#3d5a45"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#dcebe0"
    />
    <path
      d="M12 14C9.5 14 7 12 6 9C9 9 11.5 11 12 14Z"
      stroke="#3d5a45"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#bddcc4"
    />
    <path
      d="M12 18C14 18 16 16.5 17 14.5C15 14.5 13 16 12 18Z"
      stroke="#3d5a45"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#a2caa9"
    />
  </svg>
);

/**
 * Desktop & Tablet Greeting Banner Botanical Artwork:
 * Watering can watering delicate sprout leaves on a soft grassy mound.
 * Plant sprig subtly sways in the gentle breeze.
 */
export const WateringCanHeroArt: React.FC<{ className?: string }> = ({ className = 'w-30 h-24' }) => (
  <svg
    viewBox="0 0 136 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Soft grassy mound background */}
    <path
      d="M5 100C25 86 75 86 130 96V100H5Z"
      fill="#e8f0e9"
    />
    <path
      d="M20 100C45 88 85 89 125 98V100H20Z"
      fill="#dbe8dd"
    />

    {/* Grounding soil shadow beneath plant root */}
    <ellipse cx="46" cy="95" rx="15" ry="3" fill="#cfded1" opacity="0.9" />

    {/* Primary Focal Point: Growing Plant Sprig (grounded & centered) */}
    <g className="animate-breeze-stem">
      {/* Central Stem */}
      <path
        d="M46 94C46 72 44 50 38 32"
        stroke="#4a6b53"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Lower Left Leaf */}
      <path
        d="M45 78C32 78 24 69 23 58C35 58 44 68 45 78Z"
        fill="#8cb896"
        stroke="#4a6b53"
        strokeWidth="1.5"
      />
      {/* Lower Right Leaf */}
      <path
        d="M45 67C56 65 65 55 66 44C55 44 46 54 45 67Z"
        fill="#9bc2a4"
        stroke="#4a6b53"
        strokeWidth="1.5"
      />
      {/* Upper Left Leaf */}
      <path
        d="M42 52C31 50 25 41 26 31C36 32 42 41 42 52Z"
        fill="#7fae8a"
        stroke="#4a6b53"
        strokeWidth="1.5"
      />
      {/* Upper Right Leaf (reaching directly beneath watering spout) */}
      <path
        d="M40 42C51 38 58 30 59 21C49 21 41 31 40 42Z"
        fill="#9bc2a4"
        stroke="#4a6b53"
        strokeWidth="1.5"
      />
      {/* Top Sprout Tip */}
      <path
        d="M38 32C33 24 39 18 42 18C44 18 48 24 40 32Z"
        fill="#a9cfae"
        stroke="#4a6b53"
        strokeWidth="1.5"
      />
    </g>

    {/* Secondary Element: Tilted Watering Can (positioned closely above-right, pouring down) */}
    <g transform="translate(62, 10) rotate(-24 30 32)">
      {/* Watering Can Body */}
      <rect
        x="22"
        y="16"
        width="28"
        height="25"
        rx="5"
        fill="#7d9e87"
        stroke="#4a6b53"
        strokeWidth="1.8"
      />
      {/* Arch Handle */}
      <path
        d="M50 20C60 23 60 35 50 38"
        stroke="#9db9a5"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Spout angled towards the plant */}
      <path
        d="M22 32L4 21"
        stroke="#7d9e87"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Spout Rose / Head hovering right above plant leaves */}
      <path
        d="M1 18L6 26"
        stroke="#5a7a63"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>

    {/* Cascading Water Droplets: flowing directly from spout rose and landing on plant leaves */}
    <g fill="#9bc2a4">
      {/* Leaving spout rose */}
      <ellipse cx="53" cy="38" rx="1.6" ry="2.4" transform="rotate(-35 53 38)" />
      {/* Reaching upper right leaf */}
      <ellipse cx="48" cy="45" rx="1.6" ry="2.6" transform="rotate(-30 48 45)" />
      {/* Landing on middle leaves */}
      <ellipse cx="54" cy="50" rx="1.4" ry="2.2" transform="rotate(-25 54 50)" />
      {/* Glistening droplets on plant surface */}
      <ellipse cx="44" cy="58" rx="1.3" ry="1.8" transform="rotate(-20 44 58)" />
      <ellipse cx="50" cy="62" rx="1.2" ry="1.2" />
    </g>
  </svg>
);

/**
 * Centered Sprout Leaf Cluster Artwork for "New Thought" screen:
 * "Just plant the thought. The garden will take care of the rest."
 * Organic gentle breeze animation rooted at base of stem.
 */
export const SproutLeafClusterArt: React.FC<{ className?: string }> = ({ className = 'w-16 h-20' }) => (
  <svg
    viewBox="0 0 64 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} animate-breeze-sprout`}
    aria-hidden="true"
  >
    {/* Central Stem */}
    <path
      d="M32 76C32 55 31 32 32 16"
      stroke="#466450"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Lower Left Leaf */}
    <path
      d="M31 60C20 60 12 50 11 38C22 38 30 48 31 60Z"
      fill="#88b593"
      stroke="#3d5a45"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Lower Right Leaf */}
    <path
      d="M33 48C44 46 53 37 54 25C43 25 34 35 33 48Z"
      fill="#9fc6a9"
      stroke="#3d5a45"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Upper Left Leaf */}
    <path
      d="M31 34C22 32 16 23 16 12C26 13 31 22 31 34Z"
      fill="#709e7c"
      stroke="#3d5a45"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Top Bud / Leaf */}
    <path
      d="M32 18C28 9 34 2 36 2C38 2 42 8 33 18"
      fill="#b2d7bb"
      stroke="#3d5a45"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Gentle Rolling Hills Botanical Vector for Mobile Footer:
 * Creates the organic, grounded plant mound at the bottom of the mobile screen.
 */
export const RollingHillsFooterArt: React.FC<{ className?: string }> = ({ className = 'w-full h-16' }) => (
  <svg
    viewBox="0 0 400 60"
    preserveAspectRatio="none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Background softer hill */}
    <path
      d="M0 60C60 35 150 25 240 38C320 50 370 40 400 32V60H0Z"
      fill="#eaf1eb"
      opacity="0.8"
    />
    {/* Foreground green hill */}
    <path
      d="M0 60C80 48 180 38 280 48C340 54 380 50 400 45V60H0Z"
      fill="#dce7dd"
    />
    {/* Small decorative sprout silhouettes on the hill swaying gently */}
    <g
      stroke="#6b8c73"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="#8cae94"
      className="animate-breeze-stem"
    >
      <path d="M70 52C70 47 68 44 65 42C68 42 70 44 70 47" />
      <path d="M70 48C72 45 75 45 76 43C74 45 72 46 70 48" />
      <path d="M310 52C310 46 308 42 305 40C308 40 310 43 310 46" />
      <path d="M310 47C312 44 315 44 316 42C314 44 312 45 310 47" />
    </g>
  </svg>
);

/**
 * Seed to Sprout Blooming Animation (800–1200ms):
 * Shown upon successful thought persistence.
 */
export const SeedToSproutAnimation: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} animate-sprout-bloom`}
    aria-hidden="true"
  >
    {/* Soil Mound */}
    <ellipse cx="16" cy="27" rx="8" ry="2" fill="#cdd8ce" />
    {/* Seed Shell opening */}
    <path
      d="M13 26C13 24 19 24 19 26C19 28 13 28 13 26Z"
      fill="#8a735c"
    />
    {/* Emerging Green Stem */}
    <path
      d="M16 25V12"
      stroke="#466450"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Left Sprout Leaf */}
    <path
      d="M16 16C12 16 9 13 9 9C13 9 16 12 16 16Z"
      fill="#88b593"
      stroke="#3d5a45"
      strokeWidth="1.2"
    />
    {/* Right Sprout Leaf */}
    <path
      d="M16 13C20 13 23 10 23 6C19 6 16 9 16 13Z"
      fill="#9fc6a9"
      stroke="#3d5a45"
      strokeWidth="1.2"
    />
  </svg>
);

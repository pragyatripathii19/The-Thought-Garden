import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  WateringCanHeroArt,
  SproutLeafClusterArt,
  RollingHillsFooterArt,
  SeedToSproutAnimation,
} from './BotanicalIllustrations';

describe('Botanical Animation Components', () => {
  it('renders WateringCanHeroArt with organic breeze stem animation class', () => {
    const html = renderToStaticMarkup(React.createElement(WateringCanHeroArt));
    expect(html).toContain('animate-breeze-stem');
    expect(html).toContain('<svg');
  });

  it('renders SproutLeafClusterArt with organic breeze sprout animation class', () => {
    const html = renderToStaticMarkup(React.createElement(SproutLeafClusterArt));
    expect(html).toContain('animate-breeze-sprout');
    expect(html).toContain('<svg');
  });

  it('renders RollingHillsFooterArt with gentle breeze stem animation class', () => {
    const html = renderToStaticMarkup(React.createElement(RollingHillsFooterArt));
    expect(html).toContain('animate-breeze-stem');
    expect(html).toContain('<svg');
  });

  it('renders SeedToSproutAnimation with sprout-bloom animation class', () => {
    const html = renderToStaticMarkup(React.createElement(SeedToSproutAnimation));
    expect(html).toContain('animate-sprout-bloom');
    expect(html).toContain('viewBox="0 0 32 32"');
  });
});

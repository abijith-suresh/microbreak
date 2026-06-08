# CONTEXT — Product Truth

This document defines what Microbreak is, why it exists, and the rules that
govern what does and does not belong.

## What is Microbreak?

Microbreak is a platform of short, brain-stimulating puzzle games for the micro-wait moments in software development: builds, test runs, agent analysis, package installs, and deployments.

It replaces mindless scrolling with quick mental engagement that resets your
brain without hijacking your attention.

## Origin

The idea came from LinkedIn's games section, which offers one Sudoku puzzle per
day. Playing that single puzzle during build waits was satisfying, but after
finishing there was nothing else to do except scroll social media. Microbreak
solves this by providing multiple always-available short games without
engagement gating.

The project also serves as a portfolio piece — something the builder personally
uses and believes fills a gap not commonly addressed.

## Target Users

Developers and knowledge workers who experience frequent short wait periods
during their workflow. The framing is developer-first, but the games work for
anyone who wants a quick mental break.

## Goals

- Provide short (~2–8 min), brain-stimulating puzzle games
- Be immediately usable — no setup, no accounts, no friction
- Work on desktop and mobile equally well
- Be personally useful to the builder during real development waits
- Attract a small number of fellow developers who get the same value
- Serve as a quality portfolio piece

## Non-Goals

- Monetization or ads of any kind
- User accounts, authentication, or server-side state
- Analytics, tracking, or any data collection
- Engagement mechanics: streaks, notifications, leaderboards, daily limits
- Long-form or deeply complex games
- Virality, scale, or mass-market appeal
- Being a general-purpose game platform

## Game Selection Criteria

Guidelines (not rigid rules, curator discretion applies):

1. **Short session** — under ~10 minutes, ideally 2–8 min
2. **Brain-stimulating** — requires thinking, not just reflex or luck
3. **Properly implemented** — quality over speed; one polished game beats three
   rushed ones

Games can be added or removed based on what feels like a good fit. No fixed
catalogue ceiling.

## Hard Constraints

- Free forever, no monetization path
- Fully client-side (static site, no backend, no external APIs except fonts)
- Works on mobile and desktop (responsive, touch-friendly)
- Offline-capable once loaded

## Success Criteria

1. The builder uses it personally during actual development waits
2. A small number of fellow developers use and enjoy it
3. The games provide genuine cognitive stimulation compared to the alternative
   (mindless scrolling)

## Scope Boundaries

**In scope**: A curated collection of short puzzle games, a clean home page,
an about page communicating the ethos, and a polished play experience per game.

**Out of scope**: Multiplayer, social features, progress tracking across
devices, gamification, user content, forums, and anything requiring a server.

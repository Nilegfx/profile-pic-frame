# Profile Pic Frame

## What This Is

A lightweight React + Vite web app that lets users upload their profile picture, choose one of two campaign frames (PNG overlays), resize/reposition both layers to fit, and download the composited result. Everything runs client-side — no server, no uploads, no tracking. Built for a single short-lived campaign.

## Core Value

User uploads photo, picks frame, adjusts fit, downloads result — in under a minute, entirely in the browser.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can upload their own profile picture (JPEG/PNG)
- [ ] User can select from two static campaign frames (PNG with transparency)
- [ ] User can resize their profile picture while maintaining aspect ratio
- [ ] User can reposition the profile picture within the frame
- [ ] User can download the final composited image at the adjusted size
- [ ] All processing is fully client-side (no network requests, no data sent anywhere)
- [ ] App built with React + Vite using popular React-compatible libraries only

### Out of Scope

- Backend / server-side processing — campaign is 2-3 days, client-only is sufficient
- User accounts / history — single-session use only
- More than two frames at launch — can add more PNGs later by dropping files in
- Non-React canvas libraries mixed in — keep stack pure React
- Video / GIF support — static images only

## Context

- Short-lived campaign (2-3 days), so simplicity and speed of delivery beat long-term maintainability
- User will supply the two actual frame PNGs — placeholder frames used during development
- Output dimensions = whatever the user ends up with after resize/reposition (proportions locked)
- The frame is a PNG with partial and full transparency regions; the profile photo sits "inside" the circular transparent area of the frame
- Stack: React + Vite + react-konva (interactive canvas — drag, scale, export) + use-image (image loading hook)

## Constraints

- **Tech stack**: React + Vite + react-konva — no non-React canvas libs outside of Konva ecosystem
- **Timeline**: 2-3 day campaign window — ship fast, iterate if needed
- **Client-only**: Zero server requirements — must run as a static file host or even `npm run dev`
- **Libraries**: Popular, well-maintained React libraries only (high npm downloads, good docs)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + Vite (not single HTML) | User preference; enables proper library ecosystem | — Pending |
| react-konva for canvas layer | User decision; provides drag/zoom/export in one declarative React API, eliminating need for react-image-crop + manual canvas | — Pending |
| Client-side only compositing via Konva Stage | Privacy + simplicity; stage.toDataURL() handles export | — Pending |
| Two static frames at launch | Campaign-scoped, can swap PNGs easily | — Pending |
| Aspect-ratio-locked resize | User explicitly requested proportion preservation | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-10 after initialization*

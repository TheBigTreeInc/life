# ADR-0052 — Classic front-of-shop streets and visible pedestrian access

**Status:** Accepted

## Problem

The v0.5.51 painted town road hugged the empty central garden. Artwork entrances were visually isolated, with only a short doorstep stroke and a hidden fade between door and street. People could click a building and reach it, but the route did not appear to pass the illustrated shops or apartments.

## Decision

Project the top and bottom public street centerlines onto the lower edge of the storefront illustrations, just above their independently overlaid captions. Preserve the continuous western and eastern vertical roads through scenic gaps. Connect all thirteen doors by visible, muted paved pedestrian approaches at the same illustrated-frontage level, finishing at artwork-specific `artEntrance` coordinates. Hover previews highlight the entire walk, and the pawn follows the public street plus the same visible approach without hidden disappearance.

This implementation is a 2D board art interpretation, not a recreation of every original Sierra tile pixel; horizontal sidewalks in front of the side-column artwork are intentionally illustrative. Roads may overlay the last row of pixels of paintings, but never rewrite source art or the world state. Keep the Public Garden clock readout above the southern path.

The authoritative graph (`originalRoute.waypointCount=170`, routeIndex bindings and game travelQuote) remains unchanged. The layout projection is presentation-only. Modern game mode, server databases, multiplayer protocols, Social service, saved games and money/clock outcomes are unaffected.

## Acceptance

- `python tests/qa_storefront_frontage.py`: four viewport widths, all 13 links, north/south facade lanes, bank destination door, five-unit charge and in-venue clock.
- `node tools/verify.mjs`: all source JavaScript tests and offline/Pages builds.
- Inspect shop fronts on actual desktop/phone devices; separately author additional pavement artwork if tighter visual blending is desired.

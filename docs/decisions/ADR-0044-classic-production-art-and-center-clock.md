# ADR-0044 — Production Classic board, turn center, and weekly clock

**Status:** Accepted

The Classic board retains source-linked 13 place identities and 170-route indices across screen sizes. New user-supplied WebP pairs are installed at existing manifest paths; the art manifest stores normalized visual entrance anchors without overwriting route geometry. Desktop shows a 5×4 ring; mobile Explore pans that ring and Overview fits it. No new walkable cells or costs are introduced.

The original game's center displayed the active player and a clock. Here the center is a persistent display: current player name, avatar and turn owner, and an original-inspired radial clock driven only by the existing 60-unit Classic `player.hours` state. The UI does not alter the weekly clock simulation. The Modern-mode slogan and layout remain unchanged.

**Validation:** asset pairs and sizes, original identities and ring, clock unit projection, turn ownership and accessibility, generated offline and Pages assets, full regression gate. True original dial art and historical timing conversion remain future calibration tasks.

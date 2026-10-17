# ADR-0054 — Source-backed weekly events and reusable Social JavaScript SDK

**Status:** Accepted

## Classic compatibility

DOS source `startTrn.sc` states 2, 4 and 6 run lottery, computer bonus and relaxation checks before clothing and later weekly logic. This pass orders these source-supported events consistently and removes Life-specific random weekly café, concert, hobby and subscription expenses from **Classic only**; Modern keeps its existing stories and flavor economy.

DOS food is represented by distinct numbered consumables (1 and 3–5), while Life currently uses a combined `groceries` pantry balance. Moving food spoilage before the existing pantry meal would make AI opponents unable to stay fed across 60 weeks. Therefore food storage continues **after the compatibility meal** as an explicit *non-parity area* until the inventory model supports the original consumable identities. DOS rent and loan windows, economic crisis probability, original durability loss, and emergency relief remain provisional, not silently altered.

## JavaScript Social integration

`TheBigTreeInc/social` provides the canonical zero-dependency ES module `client/sdk/looprd-social.js`. Life lazily fetches this **specific immutable Git revision**: `62d46319a44def5d7489dbf533ea0bf9981d4358` (Git blob `28853329696d068f5618f93513ee18d9d10a505a`), verifies the downloaded Git blob SHA before JavaScript import, and uses its `loginSocial` and `registerSocial` operations directly. The game never transmits Social credentials to a game component and never writes account tokens to localStorage, URL, or snapshots. The same in-memory Social session drives the game chat lobby and the profile editor.

This is a **pinned runtime import**, not an uncontrolled auto-update from `main`. Social integration depends on browser access to `raw.githubusercontent.com` and its CORS/Blob import support; failure cannot block the offline game. A preferred later upgrade is an independently hosted, versioned SDK with a SHA-256 manifest from the Social web CI artifact, synced during the Life build. No Looprd database or Social server migration is required for this client-side release; actual server must already implement Social accounts (schema v2+) and serve Looprd Social API under HTTPS.

## Not implemented

Social friend-invite-to-game, `looprd.game.activity/v1`, persistent login, cross-server federation and game ticket exchange do not exist in this pass. They need independent, consent-aware server contracts and game authority checks; never reuse the Social token as a room access token.

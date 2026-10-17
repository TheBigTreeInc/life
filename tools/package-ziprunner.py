#!/usr/bin/env python3
"""Release a clean flat-root full-source ZIP without credentials or local state."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import subprocess,sys,hashlib,json
root=Path(__file__).resolve().parent.parent
version=json.loads((root/'package.json').read_text())['version']
output=root.parent/f'the-life-loop-{version}-ziprunner.zip'
subprocess.run(['node','tools/verify.mjs'],cwd=root,check=True,stdout=subprocess.DEVNULL)
files=['src/async-replay.js','docs/ASYNC_MULTIPLAYER_CRITICAL_DIFFERENCES.adoc','docs/decisions/ADR-0081-async-match-persistence-foundation.md','.github/workflows/pages.yml','tools/build-pages.mjs','.gitignore','.ziprunner-workboard-update.json','ZIPRUNNER_HANDOFF.txt','WORKBOARD.md','GAMEPLAY_AUDIT.md','ARCHITECTURE.md','docs/original-gameplay-spec.md','docs/workboard-history.json','docs/parity-matrix.md','docs/parity-contract.json','docs/classic-job-table.md','docs/decisions/ADR-0001-classic-mechanics-modern-presentation.md','docs/decisions/ADR-0002-rulesets-and-world-eras.md','docs/decisions/ADR-0003-classic-progression-education-employment.md','docs/decisions/ADR-0004-original-jobs-and-manual-rent.md','docs/decisions/ADR-0005-classic-banking-and-fresh-food.md','docs/decisions/ADR-0006-online-multiplayer-looprd.md','docs/looprd-multiplayer.md','docs/decisions/ADR-0007-responsive-mobile-layout.md','docs/decisions/ADR-0008-adaptive-drawers-and-turn-ownership.md','docs/decisions/ADR-0009-offline-reusable-character-profiles.md','docs/decisions/ADR-0010-shared-multiplayer-cosmetics-ephemeral-chat-and-viewport.md','docs/decisions/ADR-0011-distinct-venue-art-and-residence-tiers.md','docs/decisions/ADR-0012-quick-start-and-local-new-game-preferences.md','docs/decisions/ADR-0013-illustrated-character-portrait-catalog.md','server/looprd_handler.py','looprd.yaml','server/sources.local.yaml','tools/generate-looprd.py','tests/test_looprd.py','README.md','PLAY.bat','PLAY.html','index.html','styles.css','package.json','the-life-loop.zr','src/character-catalog.js','src/character-sprites.js','src/portrait-assets.js','src/art-assets.js','src/art.js','src/data.js','src/characters.js','src/rule-presets.js','src/setup-preferences.js','src/engine.js','src/app.js','src/network.js','tests/game.test.cjs','tests/rules-era.test.cjs','tests/classic-parity.test.cjs','tests/classic-jobs-rent.test.cjs','tests/classic-banking-food.test.cjs','tests/multiplayer.test.cjs','tests/mobile-ui.test.cjs','tests/characters.test.cjs','tests/setup-preferences.test.cjs','tests/home-return-rules.test.cjs','docs/decisions/ADR-0055-homeward-time-debt-and-rule-presets.md','tests/art-pack.test.cjs','tests/classic-work-pawn.test.cjs','tests/toolbar-ticker.test.cjs','tests/portrait-gallery.test.cjs','tools/generate-art-assets.mjs','tools/generate-portrait-assets.mjs','tools/generate-character-catalog.mjs','tests/character-compiler.test.cjs','tests/customization-disabled.test.cjs','tests/shared-board-careers.test.cjs','tests/classic-goals-competition.test.cjs','docs/decisions/ADR-0019-classic-goals-jones-and-employer-office.md','docs/decisions/ADR-0018-shared-13-venue-map-and-qualified-first-careers.md','docs/decisions/ADR-0014-character-compiler-and-pixel-preview.md','docs/decisions/ADR-0015-pause-character-customization.md','docs/decisions/ADR-0016-compact-city-heading-and-status-ticker.md','docs/decisions/ADR-0017-classic-partial-work-and-pawn-lifecycle.md','tools/build-offline.mjs','tools/verify.mjs','tools/package-ziprunner.py']
files += ['tests/classic-reference-mechanics.test.cjs','docs/decisions/ADR-0020-printed-reference-classic-economy.md','tests/center-venue-interactions.test.cjs','tests/qa_center_venue.py','docs/decisions/ADR-0021-board-centered-venue-interactions.md','tests/employer-board-link.test.cjs','tests/qa_employer_board.py','docs/decisions/ADR-0022-dos-employer-board-venue-contract.md']
files += ['tests/classic-discount-market.test.cjs','tests/qa_discount_market.py','docs/decisions/ADR-0023-classic-retail-counters-rotating-zmart-inventory.md']
files += ['tests/classic-clock-employment.test.cjs','tests/qa_classic_clock.py','docs/decisions/ADR-0024-classic-clock-event-budget-and-partial-wages.md']
files += ['tools/generate-classic-routes.mjs','assets/boards/classic/routes.v1.json','assets/boards/classic/geometry.v1.json','src/route-graph.js','src/classic-routes.js','src/route-overlay.js','src/classic-journey.js','src/classic-hotseat-handover.js','tests/route-graph.test.cjs','tests/route-browser-wiring.test.cjs','TEST-LOCAL.bat','docs/decisions/ADR-0026-versioned-board-routes-and-authoritative-pawn-animation.md']
files += ['docs/decisions/ADR-0027-shared-travel-graph-preview-and-responsive-streets.md','tests/classic-route-clock.test.cjs','tests/qa_routes.py','TEST-ROUTES.bat']
files += ['assets/boards/classic/original-mechanics.v1.json','src/classic-original.js','tests/original-dos-route-jobs-ai.test.cjs','docs/decisions/ADR-0028-original-dos-route-place-jobs-ai.md']
files += [p.relative_to(root).as_posix() for p in sorted((root/'docs/reference/original-dos-pass1').iterdir()) if p.is_file()]
files += ['tests/classic-migration-career-survival.test.cjs','TEST-CAREERS.bat','docs/decisions/ADR-0029-source-driven-classic-career-and-survival.md']
files += ['tests/classic-ai-career-recovery.test.cjs','TEST-AI-CAREERS.bat','docs/decisions/ADR-0033-ordered-jones-career-education-and-reemployment.md']
files += ['src/classic-economic-events.js','tests/classic-economic-events.test.cjs','TEST-CRISES.bat','docs/decisions/ADR-0032-economic-crises-recovery-and-laid-off-rival.md']
files += ['src/classic-economy.js','tests/classic-economic-migration.test.cjs','TEST-ECONOMY.bat','docs/decisions/ADR-0031-coupled-classic-economy-and-contract-wages.md']
files += ['src/classic-pass2-rules.js','tests/classic-pass2-source.test.cjs','TEST-DOS-PASS2.bat','docs/decisions/ADR-0030-source-derived-classic-economy-and-ordered-ai.md']
files += [q.relative_to(root).as_posix() for q in sorted((root/'docs/reference/original-dos-pass2').rglob('*')) if q.is_file() and '__pycache__' not in q.parts and q.suffix!='.pyc']
files += ['src/classic-time.js','tests/classic-original-timing.test.cjs','TEST-TIME.bat','docs/decisions/ADR-0034-classic-source-time-ticks-and-work.md']
files += ['tests/classic-work-warning-garnishment.test.cjs','TEST-WORK.bat','docs/decisions/ADR-0035-classic-work-warning-paycheck-and-ai-budget.md']
files += ['tests/classic-paycheck-audit.test.cjs','TEST-PAYCHECKS.bat','docs/decisions/ADR-0036-classic-paycheck-reconciliation-and-debt-recovery.md']
files += ['src/classic-turn-sequence.js','tests/classic-turn-sequence.test.cjs','TEST-TURNS.bat','docs/decisions/ADR-0037-source-informed-classic-turn-sequencing.md']
files += ['tests/classic-journey-entry.test.cjs','TEST-JOURNEY.bat','docs/decisions/ADR-0040-classic-pawn-arrivals-and-weekly-state-traces.md']
files += ['tests/classic-relaxation-journey-skip.test.cjs','TEST-RELAXATION.bat','docs/decisions/ADR-0041-classic-relaxation-loan-audit-and-travel-skip.md']
files += ['src/classic-household.js','tests/classic-household-entrance.test.cjs','TEST-HOUSEHOLD.bat','docs/decisions/ADR-0042-classic-household-and-entrance-contract.md']
files += ['tools/reconcile-workboard.mjs','docs/workboard-classifications.json','docs/workboard-lifecycle.json','docs/workboard-reconciliation.md','docs/ziprunner-workboard-lifecycle-contract.md','docs/decisions/ADR-0043-workboard-lifecycle-and-classic-maintenance.md','tests/classic-maintenance-lifecycle.test.cjs','TEST-LIFECYCLE.bat']
files += ['src/classic-weekly-events.js','tests/classic-board-weekly.test.cjs','TEST-CLASSIC-BOARD.bat','docs/decisions/ADR-0038-classic-geographic-board-and-weekly-computer-event.md','docs/decisions/ADR-0039-classic-mobile-travel-intent-and-weekly-state-traces.md']
files += ['docs/classic-designer-handoff.md','docs/classic-board-layout-reference.png']
files += ['assets/characters/pixel-v1/catalog.json']
files += ['src/classic-board-hud.js','tests/classic-production-board-hud.test.cjs','docs/classic-venue-art-acceptance.md','docs/decisions/ADR-0044-classic-production-art-and-center-clock.md']
files += ['src/classic-art-assets.js','tools/generate-classic-art-assets.mjs','assets/art/styles/classic-modern/manifest.json','docs/classic-board-art-request.md','docs/decisions/ADR-0025-classic-original-board-and-economic-risks.md','tests/classic-map-risk.test.cjs','tests/qa_classic_board.py']
files += [q.relative_to(root).as_posix() for q in sorted((root/'assets/art/styles/classic-modern').glob('*.webp')) if q.is_file()]
# Cross-game portrait integration and standalone reusable Javascript profile adapter.
files += ['tests/qa_classic_clock_garden.py','docs/decisions/ADR-0048-classic-garden-clock-and-phone-camera.md']
files += ['tests/qa_entrances_clock.py','docs/decisions/ADR-0049-illustrated-storefront-entrances-and-venue-clock.md']
files += ['tests/classic-hotseat-handover.test.cjs','tests/qa_classic_handover.py','docs/decisions/ADR-0047-classic-hotseat-privacy-and-mobile-road-scenery.md']
files += ['src/looprd-social-session.js','tests/looprd-social-chat.test.cjs','tests/qa_social_chat.py','TEST-SOCIAL-CHAT.bat','docs/decisions/ADR-0046-game-chat-social-service-boundary.md']
files += ['src/modular-portrait-kit.js','src/modular-portrait-editor.js','src/looprd-shared-profile.js','src/shared-portrait-ui.js','tests/shared-profile-portrait.test.cjs','tests/qa_shared_profile.py','TEST-SHARED-PROFILE.bat','docs/decisions/ADR-0045-shared-modular-portrait-and-social-boundary.md','docs/looprd-social-integration.md','assets/modular-portraits/portrait-editor.css','docs/portrait-kit-assets.md']
files += [p.relative_to(root).as_posix() for p in sorted((root/'assets/modular-portraits/packs').rglob('*')) if p.is_file()]
files += ['tests/classic-smooth-route.test.cjs','tests/qa_smooth_streets.py','docs/decisions/ADR-0050-continuous-classic-street-and-clean-route-preview.md']
files += ['tests/classic-pawn-doorway.test.cjs','tests/qa_pawn_doorway.py','docs/decisions/ADR-0051-classic-pawn-doorstep-transitions.md']
files += ['tests/qa_storefront_frontage.py','docs/decisions/ADR-0052-classic-storefront-frontage-and-visible-walking-paths.md']
files += ['tools/dos-time-audit.mjs','tests/classic-dos-time-parity.test.cjs','tests/qa_dos_time_boundaries.py','TEST-DOS-TIME-AUDIT.bat','docs/decisions/ADR-0053-source-clock-boundaries-and-parity-audit.md']
files += ['src/looprd-social-sdk-loader.js','tests/social-sdk-integration.test.cjs','tests/classic-weekly-source-order.test.cjs','docs/decisions/ADR-0054-classic-weekly-parity-and-social-js-sdk.md']
files += ['tests/house-rules-weekly.test.cjs','docs/decisions/ADR-0056-homeward-animation-and-house-rule-extensions.md']
files += ['src/life-pass-057.js','tests/life-pass-057.test.cjs','docs/decisions/ADR-0057-weekly-food-goals-and-localization.md']
files += ['src/classic-goals.js','tests/classic-goal-parity.test.cjs','docs/decisions/ADR-0058-source-weighted-goal-parity.md','docs/classic-parity-worklog.md','TEST-GOALS.bat']
files += ['tests/classic-clock-source-matrix.test.cjs','docs/reference/dos-time-observation-template.csv','docs/decisions/ADR-0059-clock-end-actions-and-route-evidence.md']
files += ['tests/classic-obligations-source-061.test.cjs','TEST-OBLIGATIONS.bat','docs/decisions/ADR-0061-classic-food-loans-and-paycheck-evidence.md']
files += ['tests/classic-happiness-weekend-parity.test.cjs','TEST-HAPPINESS.bat','docs/decisions/ADR-0060-source-food-cash-stress-and-happiness-audit.md']
files += ['src/classic-retail-pawn-063.js','tests/classic-retail-pawn-economy-063.test.cjs','docs/decisions/ADR-0063-source-retail-pawn-economic-audit.md','TEST-RETAIL-PAWN.bat']
files += ['src/classic-jones-source.js','tests/classic-jones-source-062.test.cjs','TEST-JONES-AI.bat','docs/decisions/ADR-0062-jones-source-branch-priorities.md','docs/reference/dos-jones-branch-audit.md']
files += ['src/classic-consumables-064.js','src/classic-food.js','tests/classic-dos-consumables-064.test.cjs','TEST-DOS-FOOD.bat','docs/decisions/ADR-0064-dos-opening-stats-and-consumable-identity.md']
# Always ship every test executed by tools/verify.mjs. Otherwise merged ZipRunner trees
# can test files that were accidentally omitted from the release archive.
files += [q.relative_to(root).as_posix() for q in sorted((root/'tests').glob('*.test.cjs')) if q.is_file() and q.relative_to(root).as_posix() not in files]
files += ['docs/decisions/ADR-0070-rendered-dutch-gameplay.md','TEST-DUTCH-GAMEPLAY.bat']
files += ['docs/decisions/ADR-0072-mobile-camera-work-and-gameplay-copy.md','TEST-MOBILE-072.bat']
files += ['docs/decisions/ADR-0073-mobile-top-end-week-and-stable-turn-handler.md','TEST-MOBILE-073.bat']
files += ['docs/decisions/ADR-0071-original-route-clock-quantum-and-gap-audit.md','docs/reference/dos-route-clock-071.json','TEST-DOS-MOTION-071.bat']
files += ['docs/v0.5.64-ziprunner-repair.md','docs/v0.5.65-ziprunner-versioned-compatibility.md','docs/decisions/ADR-0066-shared-i18n-locale-contract.md','TEST-LANGUAGE-066.bat','docs/v0.5.67-ziprunner-campaign-integration.md','TEST-CAMPAIGNS-067.bat','src/goal-presets.js','docs/v0.5.68-ziprunner-merged-goal-contract.md','TEST-MERGED-CONTRACT-068.bat','src/i18n.js','docs/release-ledger.json','docs/v0.5.69-merged-tree-contract-failures.md','TEST-MERGED-069.bat','TEST-ZIPRUNNER-REPAIR.bat']
files += ['docs/decisions/ADR-0074-player-visible-version-and-mobile-about.md']
files += ['tools/dos-session-pacing-075.mjs','docs/reference/dos-session-pacing-075.json','docs/reference/dos-session-observations-075.csv','docs/decisions/ADR-0075-dos-session-pacing-baseline.md','TEST-DOS-PACING-075.bat']
files += ['docs/decisions/ADR-0076-jones-source-motion-estimate.md','docs/decisions/ADR-0077-jones-feasible-priority-fallback.md']
# Ship all asset files, including the optional detached-house art reference and manifest.
files += [p.relative_to(root).as_posix() for p in sorted((root/'assets/art/styles/contemporary-default').glob('*')) if p.is_file()]
files += [p.relative_to(root).as_posix() for p in sorted((root/'assets/portraits/default').glob('*')) if p.is_file()]
with ZipFile(output,'w',compression=ZIP_DEFLATED,compresslevel=9) as z:
    for name in files:
        path=root/name
        if not path.is_file():raise RuntimeError(f'Missing {name}')
        z.write(path,name)
with ZipFile(output) as z:
    assert z.testzip() is None
    assert z.namelist()==files
    assert len(set(z.namelist()))==len(files)
    assert all(not Path(n).is_absolute() and '..' not in Path(n).parts for n in z.namelist())
print(f'{output} | {output.stat().st_size} bytes | {len(files)} files | sha256 {hashlib.sha256(output.read_bytes()).hexdigest()}')

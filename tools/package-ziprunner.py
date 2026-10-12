#!/usr/bin/env python3
"""Release a clean flat-root full-source ZIP without credentials or local state."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import subprocess,sys,hashlib,json
root=Path(__file__).resolve().parent.parent
version=json.loads((root/'package.json').read_text())['version']
output=root.parent/f'the-life-loop-{version}-ziprunner.zip'
subprocess.run(['node','tools/verify.mjs'],cwd=root,check=True,stdout=subprocess.DEVNULL)
files=['.github/workflows/pages.yml','tools/build-pages.mjs','.gitignore','.ziprunner-workboard-update.json','ZIPRUNNER_HANDOFF.txt','WORKBOARD.md','GAMEPLAY_AUDIT.md','ARCHITECTURE.md','docs/original-gameplay-spec.md','docs/parity-matrix.md','docs/parity-contract.json','docs/classic-job-table.md','docs/decisions/ADR-0001-classic-mechanics-modern-presentation.md','docs/decisions/ADR-0002-rulesets-and-world-eras.md','docs/decisions/ADR-0003-classic-progression-education-employment.md','docs/decisions/ADR-0004-original-jobs-and-manual-rent.md','docs/decisions/ADR-0005-classic-banking-and-fresh-food.md','docs/decisions/ADR-0006-online-multiplayer-looprd.md','docs/looprd-multiplayer.md','docs/decisions/ADR-0007-responsive-mobile-layout.md','docs/decisions/ADR-0008-adaptive-drawers-and-turn-ownership.md','docs/decisions/ADR-0009-offline-reusable-character-profiles.md','docs/decisions/ADR-0010-shared-multiplayer-cosmetics-ephemeral-chat-and-viewport.md','docs/decisions/ADR-0011-distinct-venue-art-and-residence-tiers.md','docs/decisions/ADR-0012-quick-start-and-local-new-game-preferences.md','docs/decisions/ADR-0013-illustrated-character-portrait-catalog.md','server/looprd_handler.py','looprd.yaml','server/sources.local.yaml','tools/generate-looprd.py','tests/test_looprd.py','README.md','PLAY.bat','PLAY.html','index.html','styles.css','package.json','the-life-loop.zr','src/portrait-assets.js','src/art-assets.js','src/art.js','src/data.js','src/characters.js','src/setup-preferences.js','src/engine.js','src/app.js','src/network.js','tests/game.test.cjs','tests/rules-era.test.cjs','tests/classic-parity.test.cjs','tests/classic-jobs-rent.test.cjs','tests/classic-banking-food.test.cjs','tests/multiplayer.test.cjs','tests/mobile-ui.test.cjs','tests/characters.test.cjs','tests/setup-preferences.test.cjs','tests/art-pack.test.cjs','tests/portrait-gallery.test.cjs','tools/generate-art-assets.mjs','tools/generate-portrait-assets.mjs','tools/build-offline.mjs','tools/verify.mjs','tools/package-ziprunner.py']
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

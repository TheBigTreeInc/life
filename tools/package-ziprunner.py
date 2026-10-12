#!/usr/bin/env python3
"""Release a clean flat-root full-source ZIP without credentials or local state."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import subprocess,sys,hashlib
root=Path(__file__).resolve().parent.parent
output=root.parent/'the-life-loop-0.5.3-workboardfix-ziprunner.zip'
subprocess.run(['node','tools/verify.mjs'],cwd=root,check=True,stdout=subprocess.DEVNULL)
files=['.github/workflows/pages.yml','tools/build-pages.mjs','.gitignore','.ziprunner-workboard-update.json','ZIPRUNNER_HANDOFF.txt','WORKBOARD.md','GAMEPLAY_AUDIT.md','ARCHITECTURE.md','docs/original-gameplay-spec.md','docs/parity-matrix.md','docs/parity-contract.json','docs/classic-job-table.md','docs/decisions/ADR-0001-classic-mechanics-modern-presentation.md','docs/decisions/ADR-0002-rulesets-and-world-eras.md','docs/decisions/ADR-0003-classic-progression-education-employment.md','docs/decisions/ADR-0004-original-jobs-and-manual-rent.md','docs/decisions/ADR-0005-classic-banking-and-fresh-food.md','docs/decisions/ADR-0006-online-multiplayer-looprd.md','docs/looprd-multiplayer.md','docs/decisions/ADR-0007-responsive-mobile-layout.md','server/looprd_handler.py','looprd.yaml','server/sources.local.yaml','tools/generate-looprd.py','tests/test_looprd.py','README.md','PLAY.bat','PLAY.html','index.html','styles.css','package.json','the-life-loop.zr','src/art.js','src/data.js','src/engine.js','src/app.js','src/network.js','tests/game.test.cjs','tests/rules-era.test.cjs','tests/classic-parity.test.cjs','tests/classic-jobs-rent.test.cjs','tests/classic-banking-food.test.cjs','tests/multiplayer.test.cjs','tests/mobile-ui.test.cjs','tools/build-offline.mjs','tools/verify.mjs','tools/package-ziprunner.py']
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

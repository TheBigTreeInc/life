#!/usr/bin/env python3
"""Release a clean flat-root full-source ZIP without credentials or local state."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import subprocess,sys,hashlib
root=Path(__file__).resolve().parent.parent
output=root.parent/'the-life-loop-0.4.1-ziprunner.zip'
subprocess.run(['node','tools/verify.mjs'],cwd=root,check=True,stdout=subprocess.DEVNULL)
files=['.github/workflows/pages.yml','tools/build-pages.mjs','.gitignore','.ziprunner-workboard-update.json','ZIPRUNNER_HANDOFF.txt','WORKBOARD.md','README.md','PLAY.bat','PLAY.html','index.html','styles.css','package.json','the-life-loop.zr','src/art.js','src/data.js','src/engine.js','src/app.js','tests/game.test.cjs','tools/build-offline.mjs','tools/verify.mjs','tools/package-ziprunner.py']
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

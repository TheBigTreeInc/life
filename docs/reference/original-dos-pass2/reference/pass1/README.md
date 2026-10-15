# Jones DOS → The Life Loop: Original mechanics, pass 1

Based on the uploaded **Jones in the Fast Lane DOS EN** files (game version **1.000.060**) and the version-matched public SCI script decompilation.

- `MECHANICS.md` — technical findings and a recommended implementation plan
- `original_route.json` — **170-waypoint** circular board route and **13 places**, with pixel and normalized coordinates
- `place_distances.csv` — shortest-path distances (in waypoint steps) among the 13 places
- `original_jobs.json` and `original_jobs.csv` — **37 jobs**, 9 employers, numeric requirements, and base hourly pay
- `original_education.csv` — **11 degree IDs** and prerequisites
- `resource_manifest.csv` — **299** original SCI resource entries, map position/volume/method/sizes
- `archive_files.json` — original installation's filenames, sizes, and SHA-256 hashes
- `test_reference.py` — standalone tests to check resource-link relationships and route invariants

Run the reference regression tests with:

```console
python test_reference.py
```

Notes: This pack does not include the original game files or any full third-party decompiled scripts. See `MECHANICS.md` for confidence statements and sources. The Python tests validate these extracted reference files, not the runtime behaviour of the DOS game.

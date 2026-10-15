"""Compatibility entrypoint for v0.5.52 shop-front public-road browser QA."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('qa_storefront_frontage.py')),run_name='__main__')

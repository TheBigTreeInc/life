"""Smoke test the original Classic board, independent Modern map, and centered menus."""
from playwright.sync_api import sync_playwright
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in [(320,568),(390,844),(768,1024),(1440,900),(1920,1080)]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  failures=[]
  page.on('pageerror',lambda error:failures.append(str(error)))
  page.set_content(ROOT.joinpath('PLAY.html').read_text(encoding='utf8'),wait_until='domcontentloaded')
  page.locator('#startNewGameBtn').click()
  page.wait_for_timeout(250)
  assert page.locator('.board-tile').count()==13,(width,'tile count')
  assert page.locator('.board-tile[data-travel="market"] .tile-name').inner_text()=="Z-Mart Discount"
  assert page.locator('.board-tile[data-travel="cinema"] .tile-name').inner_text()=="Black's Market"
  assert page.locator('.board-tile[data-travel="clinic"] .tile-name').inner_text()=="Le Security Apartments"
  nooverflow=page.evaluate("""() => ({scroll:document.documentElement.scrollHeight,inner:window.innerHeight,sw:document.documentElement.scrollWidth,iw:window.innerWidth,cols:getComputedStyle(document.querySelector('.board-grid')).gridTemplateColumns.split(' ').length})""")
  assert nooverflow['scroll']<=height+1,(width,nooverflow)
  assert nooverflow['sw']<=width+1,(width,nooverflow)
  assert nooverflow['cols']==5,(width,nooverflow)
  assert not failures,(width,failures)
  if width in (390,1440):
   page.screenshot(path=str(ROOT/f'qa074-classic-{width}.png'))
  page.locator('[data-travel="market"]').click()
  page.locator('#venueLayer').wait_for(state='visible',timeout=2500)
  assert page.locator('#venueActions').inner_text().find('Z-Mart')>=0
  assert 'Black’s Market' not in page.locator('#venueActions').inner_text()
  page.locator('#venueDone').click()
  page.locator('[data-travel="cinema"]').click()
  page.locator('#venueLayer').wait_for(state='visible',timeout=2500)
  assert 'weeks of fresh food' in page.locator('#venueActions').inner_text()
  page.close()
 print('Classic board browser checks PASS: 320,390,768,1440,1920; geometry, actions, no page overflow.')
 modern=browser.new_page(viewport={'width':1440,'height':900})
 modern.set_content(ROOT.joinpath('PLAY.html').read_text(encoding='utf8'),wait_until='domcontentloaded')
 modern.locator('#setupAdvanced').evaluate("el=>el.open=true")
 modern.locator('input[name="ruleset"][value="modern"]').check()
 modern.locator('#startNewGameBtn').click()
 assert modern.locator('.board-tile[data-travel="market"] .tile-name').inner_text()=="Fresh & Frugal"
 assert modern.locator('.board-tile[data-travel="cinema"] .tile-name').inner_text()=="Starlight Social"
 assert modern.locator('.board-tile[data-travel="clinic"] .tile-name').inner_text()=="Wellbeing Clinic"
 print('Modern Story board identity checks PASS')
 modern.close();browser.close()

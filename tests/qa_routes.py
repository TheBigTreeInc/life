"""Visual/local smoke for Classic route previews and authoritative travel, from offline PLAY.html."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in [(320,568),(390,844),(768,1024),(1440,900)]:
  page=browser.new_page(viewport={'width':width,'height':height})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content((root/'PLAY.html').read_text(encoding='utf-8'),wait_until='load')
  page.locator('#startNewGameBtn').click()
  assert page.locator('.board-tile').count()==13
  assert page.locator('.travel-cost').count()==13
  page.locator('[data-travel="market"]').hover()
  hint=page.locator('#routeHint').inner_text()
  assert 'Z-Mart Discount' in hint and '3h travel' in hint and '23 original path steps' in hint,(width,hint)
  assert page.locator('.route-preview').count()==1,(width,'missing preview line')
  origin=page.locator('#mobileHours').inner_text()
  assert origin=='60h',(width,origin)
  page.locator('[data-travel="market"]').click()
  page.locator('#venueLayer').wait_for(state='visible',timeout=2500)
  assert page.locator('#mobileHours').inner_text()=='57h',(width,'travel double charged')
  assert page.locator('.route-preview').count()==0,(width,'preview leaked')
  page.locator('#venueDone').click()
  page.locator('[data-travel="market"]').click()
  page.locator('#venueLayer').wait_for(state='visible',timeout=1500)
  assert page.locator('#mobileHours').inner_text()=='57h',(width,'same location double charged')
  assert not errors,(width,errors)
  geometry=page.evaluate('({sh:document.documentElement.scrollHeight,h:innerHeight,sw:document.documentElement.scrollWidth,w:innerWidth})')
  assert geometry['sh']<=height+1 and geometry['sw']<=width+1,(width,geometry)
  page.close()
 modern=browser.new_page(viewport={'width':1440,'height':900})
 modern.set_content((root/'PLAY.html').read_text(encoding='utf-8'),wait_until='load')
 modern.locator('#setupAdvanced').evaluate('el=>el.open=true')
 modern.locator('input[name="ruleset"][value="modern"]').check()
 modern.locator('#startNewGameBtn').click()
 assert modern.locator('#routeOverlay').is_hidden()
 assert modern.locator('.travel-cost').count()==0
 modern.close()
 browser.close()
 print('Route browser QA PASS (320, 390, 768, 1440; original 170 waypoint route, 3h once, same-place free, Modern isolation)')

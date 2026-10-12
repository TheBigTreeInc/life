from playwright.sync_api import sync_playwright
from pathlib import Path
root=Path(__file__).resolve().parent.parent;html=(root/'PLAY.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for w,h in [(320,568),(390,844),(768,1024),(1366,768),(1600,900),(1920,1080)]:
  page=b.new_page(viewport={'width':w,'height':h});page.set_default_timeout(4500)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load');page.wait_for_timeout(130)
  assert page.locator('#startNewGameBtn').is_visible()
  page.locator('#startNewGameBtn').click();page.wait_for_timeout(80)
  assert page.locator('[data-travel]').count()==13
  assert page.locator('#gameActions').count()==0
  # Same-current location is free
  origin=page.evaluate('document.querySelector(".board-tile.selected")?.dataset.travel')
  if not origin: origin='home'
  hours=page.locator('#mobileHours').inner_text()
  page.locator('[data-travel="%s"]'%origin).click();page.wait_for_timeout(110)
  assert page.locator('#venueLayer').is_visible(),(w,'no popup')
  assert page.locator('#venueDone').is_visible(),(w,'done hidden')
  assert page.locator('#venueActions [data-act]').count()>0,(w,'no actions')
  assert page.locator('#mobileHours').inner_text()==hours,(w,'charged current location')
  page.locator('#venueDone').click();page.wait_for_timeout(60)
  assert page.locator('#venueLayer').is_hidden()
  # New venue
  page.locator('[data-travel="agency"]').click();page.wait_for_timeout(100)
  assert page.locator('#venueLayer').is_visible(),(w,'agency no popup')
  assert page.locator('#classicEmployerFilter').count()==1,(w,'employer filter')
  assert page.locator('#careerShowAll').count()==1
  page.locator('#careerShowAll').check(force=True)
  assert page.locator('#venueActions [data-act^="apply:"]').count()>0
  doc=page.evaluate('({sh:document.documentElement.scrollHeight,ch:document.documentElement.clientHeight,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})')
  assert doc['sh']<=doc['ch']+1 and doc['sw']<=doc['cw']+1,(w,doc)
  assert not errors,(w,errors)
  # Visual screenshots are optional; this test verifies the UI without writing runtime files.
  print(w,h,'OK',doc,'actions',page.locator('#venueActions [data-act]').count())
  page.close()
 b.close()

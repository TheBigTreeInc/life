"""Browser smoke test: single landmark clock, Classic center identity and phone-only board toggle."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'PLAY.html').read_text(encoding='utf-8')
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in [(320,680),(390,844),(720,880),(768,1024),(1440,900)]:
  p=b.new_page(viewport={'width':width,'height':height})
  errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.set_content(html,wait_until='domcontentloaded');p.locator('#startNewGameBtn').click();p.wait_for_timeout(160)
  assert p.locator('.board-tile').count()==13
  assert p.locator('#classicTurnCenter #classicTurnDial').count()==0, (width,'clock still in middle')
  assert p.locator('#classicBoardClock #classicTurnDial').count()==1
  assert p.locator('.board-clock-garden').count()==1
  assert p.locator('#classicTurnCenter').is_visible() and p.locator('#classicBoardClock').is_visible()
  toggle=p.locator('.classic-board-modes')
  assert toggle.is_visible()==(width<=720),(width,'toggle visibility')
  assert p.locator('#classicBoardClock').get_attribute('aria-label')=='Public Garden weekly clock'
  positions=p.evaluate('''() => {const a=document.querySelector("#classicTurnCenter").getBoundingClientRect(),b=document.querySelector("#classicBoardClock").getBoundingClientRect(),c=document.querySelector(".board-clock-garden").getBoundingClientRect();const intersects=(x,y)=> Math.max(0,Math.min(x.right,y.right)-Math.max(x.left,y.left))*Math.max(0,Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top));return {garden:[c.x,c.y,c.width,c.height],clock:[b.x,b.y,b.width,b.height],identity:[a.x,a.y,a.width,a.height],intersection:intersects(b,c),clock_area:b.width*b.height,identityOverlap:intersects(a,b),scroll:document.documentElement.scrollWidth,inner:innerWidth};}''')
  assert positions['intersection']/positions['clock_area']>.65,(width,positions)
  assert positions['identityOverlap']<.1,(width,positions)
  assert positions['scroll']<=positions['inner']+1,(width,positions)
  if width<=720:
   p.locator('#classicBoardFit').click();p.wait_for_timeout(90)
   assert p.locator('#classicBoardFit').get_attribute('aria-pressed')=='true'
   assert p.locator('#classicBoardClock').is_visible()
   p.screenshot(path=str(root/f'qa-548-clock-{width}-overview.png'))
   p.locator('#classicBoardExplore').click();p.wait_for_timeout(90)
   assert p.locator('#classicBoardExplore').get_attribute('aria-pressed')=='true'
  else:
   assert p.locator('body').get_attribute('data-classic-board-view')=='fit'
  if width in (390,1440):p.screenshot(path=str(root/f'qa-548-clock-{width}.png'))
  if width==1440:
   before=int(p.locator('#classicTurnDial').get_attribute('aria-valuenow'))
   p.locator('[data-travel="market"]').click();p.wait_for_timeout(1100)
   after=int(p.locator('#classicTurnDial').get_attribute('aria-valuenow'))
   assert after<before,(before,after,'travel must update real garden clock')
   assert p.locator('#classicDialValue').inner_text()==str(after)
   assert p.locator('#classicBoardClock #classicTurnDial').count()==1
  assert not errors,(width,errors)
  print(width,'clock inside garden, mobile toggle correct, no page overflow',positions)
  p.close()
 b.close()

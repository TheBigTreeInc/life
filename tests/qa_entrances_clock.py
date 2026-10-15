"""Browser QA: portrait-door waypoints and in-venue clock at phone/desktop."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for w,h in [(320,640),(390,844),(768,1024),(1440,900)]:
  page=browser.new_page(viewport={'width':w,'height':h})
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(ROOT.joinpath('PLAY.html').read_text(encoding='utf-8'),wait_until='load')
  page.locator('#startNewGameBtn').click()
  page.wait_for_timeout(180)
  assert page.locator('.board-tile').count()==13
  doors=page.locator('.route-door-step')
  assert doors.count()==13,(w,doors.count())
  # Door anchors must be above tile captions, not obscured by the text overlay.
  door_positions=page.evaluate('''() => [...document.querySelectorAll('.route-door-step')].map(el=>{let id=el.getAttribute('data-door-place');let t=document.querySelector(`[data-travel="${id}"]`);let c=t.querySelector('.tile-caption').getBoundingClientRect();let v=document.querySelector('#boardStage').getBoundingClientRect();return {id,x:+el.getAttribute('cx'),y:+el.getAttribute('cy'),captionY:c.top-v.top,side:t.getBoundingClientRect().left-v.left};})''')
  for d in door_positions:assert d['y']<d['captionY'],(w,d)
  # Same-location venue must have the proper 60-unit time display.
  page.locator('.board-tile.selected').click()
  page.locator('#venueLayer').wait_for(state='visible',timeout=3000)
  assert page.locator('#venueClock').is_visible(),w
  assert page.locator('#venueClockRemaining').inner_text()=='60 / 60 units',w
  assert page.locator('#venueClock').get_attribute('aria-valuenow')=='60'
  # Actions inside a building must decrement the visible clock before exit.
  page.locator('[data-act="relax"]').click()
  page.wait_for_timeout(60)
  action_remaining=int(page.locator('#venueClockValue').inner_text())
  assert action_remaining<60,(w,action_remaining)
  assert page.locator('#venueClockRemaining').inner_text()==f'{action_remaining} / 60 units',w
  assert page.locator('#venueClock').get_attribute('aria-valuenow')==str(action_remaining),w
  page.screenshot(path=str(ROOT /f'qa-549-venue-{w}.png'),animations='disabled')
  page.locator('#venueDone').click()
  # Visiting a different building should update the same clock when the menu opens.
  page.locator('.board-tile[data-travel="market"]').click()
  page.locator('#venueLayer').wait_for(state='visible',timeout=4000)
  remaining=int(page.locator('#venueClockValue').inner_text())
  assert remaining<action_remaining,(w,remaining,action_remaining)
  assert int(page.locator('#classicDialValue').inner_text())==remaining
  assert page.locator('#venueClock').get_attribute('aria-valuenow')==str(remaining)
  # Pawn endpoint is the illustrated door, not the midpoint on the town road.
  pawn_and_door=page.evaluate('''() => {
    const pawn=document.querySelector('.route-pawn'),door=document.querySelector('[data-door-place="market"]');
    return pawn&&door?{dx:Math.abs(Number(pawn.getAttribute('cx'))-Number(door.getAttribute('cx'))),dy:Math.abs(Number(pawn.getAttribute('cy'))-Number(door.getAttribute('cy')))}:null;
  }''')
  assert pawn_and_door and pawn_and_door['dx']<1 and pawn_and_door['dy']<1,(w,pawn_and_door)
  page.locator('#venueDone').click()
  page.screenshot(path=str(ROOT /f'qa-549-board-{w}.png'),animations='disabled')
  assert not errors,(w,errors)
  print('PASS',w,'doors',len(door_positions),'time',remaining)
  page.close()
 browser.close()

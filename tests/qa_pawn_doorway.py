"""Browser QA: Classic animated doorstep, street-only route, skip, mobile, reduced motion."""
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
HTML=(R/'PLAY.html').read_text(encoding='utf-8')
RECORDER="""() => {
 window.__pawnFrames=[];
 const overlay=document.querySelector('#routeOverlay');
 const obs=new MutationObserver(()=>{
  const pawn=overlay.querySelector('[data-pawn-actor="player"]');
  const dot=pawn?.querySelector('.route-pawn');
  if(dot)window.__pawnFrames.push({opacity:Number(pawn.getAttribute('opacity')),
   x:Number(dot.getAttribute('cx')),y:Number(dot.getAttribute('cy')),
   current:!!overlay.querySelector('.route-current')});
 });
 obs.observe(overlay,{childList:true});
 window.__stopPawnRecording=()=>obs.disconnect();
}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for w,h in ((320,640),(390,844),(768,1024),(1440,900)):
  page=browser.new_page(viewport={'width':w,'height':h},reduced_motion='no-preference')
  errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
  page.set_content(HTML,wait_until='load');page.locator('#startNewGameBtn').click()
  page.evaluate(RECORDER)
  page.locator('[data-travel="bank"]').click(force=True)
  page.locator('#venueLayer').wait_for(state='visible',timeout=9000)
  frames=page.evaluate('''() => {window.__stopPawnRecording();return window.__pawnFrames}''')
  assert len(frames)>=12,(w,'too few animation frames',len(frames))
  assert min(f['opacity'] for f in frames)<.3,(w,'no alpha transition')
  assert max(f['opacity'] for f in frames)>=.99,(w,'pawn never fully appears')
  assert any(f['current'] for f in frames),(w,'no active roadway')
  status=page.evaluate('''() => {
   const pawn=document.querySelector('[data-pawn-actor="player"] .route-pawn'),door=document.querySelector('[data-door-place="bank"]');
   return {distance:Math.hypot(+pawn.getAttribute('cx') - +door.getAttribute('cx'),+pawn.getAttribute('cy') - +door.getAttribute('cy')),
     opacity:+pawn.parentNode.getAttribute('opacity'),visible:!document.querySelector('#venueLayer').hidden,
     time:document.querySelector('#venueClockRemaining')?.textContent};
  }''')
  assert status['distance']<1 and status['opacity']==1,(w,'incorrect final door',status)
  assert status['time']=='55 / 60 units',(w,'clock charged wrong',status)
  assert not errors,(w,'JS errors',errors)
  page.screenshot(path=str(R/f'qa-551-bank-{w}.png'),animations='disabled')
  print('PASS',w,'frames',len(frames),'door',round(status['distance'],2),'clock',status['time'])
  page.close()
 # Explicit animation skip must finish at the same door immediately.
 page=browser.new_page(viewport={'width':1440,'height':900})
 page.set_content(HTML,wait_until='load');page.locator('#startNewGameBtn').click()
 page.locator('[data-travel="tech"]').click(force=True)
 page.locator('#classicTravelSkip').click(timeout=4000)
 page.locator('#venueLayer').wait_for(state='visible',timeout=9000)
 finish=page.evaluate('''() => {
  const a=document.querySelector('[data-pawn-actor="player"] .route-pawn'),b=document.querySelector('[data-door-place="tech"]');
  return {atDoor:Math.hypot(+a.getAttribute('cx')- +b.getAttribute('cx'),+a.getAttribute('cy')- +b.getAttribute('cy')),value:document.querySelector('#venueClockRemaining').textContent};
 }''')
 assert finish['atDoor']<1,(finish,'skip did not end at door')
 print('PASS', 'skip animation',finish)
 page.close()
 # Accessibility: prefers-reduced-motion resolves directly to the doorway.
 page=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
 page.set_content(HTML,wait_until='load');page.locator('#startNewGameBtn').click()
 page.locator('[data-travel="market"]').click(force=True)
 page.locator('#venueLayer').wait_for(state='visible',timeout=9000)
 end=page.evaluate('''() => {
  const a=document.querySelector('[data-pawn-actor="player"] .route-pawn'),b=document.querySelector('[data-door-place="market"]');
  return Math.hypot(+a.getAttribute('cx')- +b.getAttribute('cx'),+a.getAttribute('cy')- +b.getAttribute('cy'));
 }''')
 assert end<1,('reduced motion final door',end)
 print('PASS','reduced motion',end)
 page.close();browser.close()

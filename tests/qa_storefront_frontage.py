"""v0.5.52: the town road passes each front porch and the pawn walks every visible sidewalk."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'PLAY.html').read_text(encoding='utf8')

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in [(320,640),(390,844),(768,1024),(1440,900)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
        page.set_content(HTML,wait_until='load')
        page.locator('#startNewGameBtn').click()
        page.wait_for_timeout(100)
        geometry=page.evaluate('''() => {
          const overlay=document.querySelector('#routeOverlay'),stage=document.querySelector('#boardStage').getBoundingClientRect();
          const path=overlay.querySelector('.route-road'),sidewalks=[...overlay.querySelectorAll('[data-sidewalk-place]')];
          const tile=id=>document.querySelector(`[data-travel="${id}"]`);
          const rect=id=>tile(id).getBoundingClientRect();
          const cap=id=>tile(id).querySelector('.tile-caption').getBoundingClientRect();
          const samples=[];
          const len=path.getTotalLength();
          for(let i=0;i<=160;i++){
            const p=path.getPointAtLength(i*len/160);
            samples.push({x:stage.left+p.x,y:stage.top+p.y});
          }
          const top=rect('home'),bottom=rect('agency'),north=cap('home').top-5,south=cap('agency').top-5;
          const corners={north:samples.some(p=>p.x>top.left&&p.x<top.right&&Math.abs(p.y-north)<7),
            south:samples.some(p=>p.x>bottom.left&&p.x<bottom.right&&Math.abs(p.y-south)<7)};
          const links=sidewalks.map(e=>({id:e.getAttribute('data-sidewalk-place'),len:e.getTotalLength(),d:e.getAttribute('d')}));
          return {links,corners,south,clock:document.querySelector('#classicDialRemaining').getBoundingClientRect().bottom,
          oldParkRoute:samples.some(p=>p.x>top.left&&p.x<top.right&&p.y>=top.bottom+3&&p.y<top.bottom+25)};
        }''')
        assert len(geometry['links'])==13,(width,'all doors must be linked',geometry)
        assert all(v['len']>=1 for v in geometry['links']),(width,'empty sidewalk')
        assert geometry['corners']['north'] and geometry['corners']['south'],(width,'road must run at storefront fronts')
        assert not geometry['oldParkRoute'],(width,'old distant park gutter route remains')
        assert geometry['clock']<geometry['south']+6,(width,'clock overlaps southern street',geometry)
        if width<=720:
            page.locator('#classicBoardFit').click()
            assert page.locator('.board-clock-garden').is_visible()
            page.locator('#classicBoardExplore').click()
        page.locator('[data-travel="bank"]').hover(force=True)
        preview=page.evaluate('''() => {
          const p=document.querySelector('.route-preview'),door=document.querySelector('[data-door-place="bank"]');
          const at=p.getPointAtLength(p.getTotalLength());
          return {visible:!!p,doorDistance:Math.hypot(at.x-Number(door.getAttribute('cx')),at.y-Number(door.getAttribute('cy')))};
        }''')
        assert preview['visible'] and preview['doorDistance']<1,(width,preview)
        page.locator('[data-travel="bank"]').click()
        page.locator('#venueLayer').wait_for(state='visible',timeout=12000)
        assert page.locator('#venueClockRemaining').inner_text()=='55 / 60 units',(width,'venue clock')
        arrive=page.evaluate('''() => {
          const p=document.querySelector('.route-pawn'),d=document.querySelector('[data-door-place="bank"]');
          return Math.hypot(Number(p.getAttribute('cx'))-Number(d.getAttribute('cx')),Number(p.getAttribute('cy'))-Number(d.getAttribute('cy')));
        }''')
        assert arrive<1,(width,'pawn not exactly on bank door',arrive)
        page.locator('#venueDone').click()
        if width in (390,1440):
            page.screenshot(path=str(ROOT/f'qa-552-frontages-{width}.png'),animations='disabled')
        assert not errors,(width,errors)
        print('PASS storefront-frontage',width,'linked doors',len(geometry['links']),'5-unit bank walk')
        page.close()
    browser.close()

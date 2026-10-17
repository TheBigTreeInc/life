"""End-to-end v0.5.53 Employment clock boundary and Classic/Modern UI smoke."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'PLAY.html').read_text(encoding='utf8')
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in [(320,568),(390,844),(1440,900)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        page.set_default_timeout(5000)
        errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
        page.set_content(html,wait_until='domcontentloaded')
        page.evaluate('''() => { const proto = window.LifeGame.prototype; const prev = proto.travelQuote; proto.travelQuote = function(...args) { window.__qaGame = this; return prev.apply(this,args); }; }''')
        page.locator('#startNewGameBtn').click()
        for remaining in (1,2,3):
            page.evaluate('(remaining) => { window.__qaGame.player.location="agency"; window.__qaGame.player.hours=remaining; window.__qaGame.player.classicChoicesThisWeek=0; window.__qaGame.player.job=null; window.__qaGame.player.wage=0;  }', remaining)
            page.locator('[data-travel="agency"]').click()
            page.locator('#venueLayer').wait_for(state='visible')
            page.locator('#classicEmployerFilter').select_option('all')
            if not page.locator('#careerShowAll').is_checked(): page.locator('#careerShowAll').check()
            btn=page.locator('[data-act="apply:classic-zmart-clerk"]')
            assert btn.count()==1,(width,remaining,'missing Z-Mart clerk action')
            assert btn.is_enabled(),(width,remaining,'disabled late-week application')
            btn.click()
            left=page.evaluate('window.__qaGame.player.hours')
            assert left==0,(width,remaining,left)
            assert not page.locator('[data-act="apply:classic-zmart-clerk"]').is_enabled()
            page.locator('#venueDone').click()
        assert not errs,(width,errs)
        print('Classic Employment browser OK',width,'1/2/3 last units, exactly one charge, zero blocked')
        page.close()
    browser.close()

"""Browser smoke for v0.5.23 Classic action allowance and bottom ticker."""
from pathlib import Path
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parent.parent/'PLAY.html').read_text()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in [(320,568),(390,844),(768,1024),(1440,900),(1920,1080)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        page.set_default_timeout(10000)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html,wait_until='load')
        page.locator('#startNewGameBtn').click()
        assert '/10 ACTIONS' in page.locator('#topWeek').inner_text()
        page.locator('[data-travel="bank"]').click()
        assert page.locator('#venueLayer').is_visible()
        assert page.locator('[data-act="deposit:100"]').is_enabled()
        for i in range(5):
            page.locator('[data-act="deposit:100"]').click()
            page.locator('[data-act="withdraw:100"]').click()
        assert '10/10 ACTIONS' in page.locator('#topWeek').inner_text()
        assert page.locator('[data-act="deposit:100"]').is_disabled()
        page.locator('#venueDone').click()
        page.locator('#endTurnBtn').click()
        assert 'WEEK 02' in page.locator('#topWeek').inner_text()
        assert '0/10 ACTIONS' in page.locator('#topWeek').inner_text()
        page.locator('[data-travel="bank"]').click()
        assert page.locator('[data-act="deposit:100"]').is_enabled()
        dim=page.evaluate('({sh:document.documentElement.scrollHeight,ch:document.documentElement.clientHeight,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})')
        assert dim['sh']<=dim['ch']+1 and dim['sw']<=dim['cw']+1,(width,dim)
        assert not errors,(width,errors)
        if width in (390,1440):
            page.locator('#venueDone').click()
            page.screenshot(path=f'/mnt/data/the-life-loop-v073-clock-{width}.png')
        print('Browser OK',width,height,'clock, weekly cap, venue and full-page scroll',dim)
        page.close()
    browser.close()

"""Browser smoke for the Classic discount/grocery split; optional manual QA, no server."""
from pathlib import Path
from playwright.sync_api import sync_playwright
html = (Path(__file__).resolve().parent.parent/'PLAY.html').read_text()
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in [(320,568),(390,844),(768,1024),(1440,900),(1920,1080)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        page.set_default_timeout(7000)
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.set_content(html,wait_until='load')
        page.locator('#startNewGameBtn').click()
        assert page.locator('[data-travel]').count()==13
        page.locator('[data-travel="market"]').click()
        assert page.locator('#venueLayer').is_visible()
        labels=page.locator('.venue-dept-heading span').all_text_contents()
        assert labels==['Z-Mart Discount','Black’s Market'],(width,labels)
        assert page.locator('[data-act="classicDiscount:dictionary"]').count()==1
        assert page.locator('[data-act="classicFresh:1"]').count()==1
        assert page.locator('[data-act="classicDiscount:atlas"]').count()==0
        assert page.locator('[data-act="classicDiscount:baseball"]').count()==1
        if width==1440:
            page.screenshot(path='/mnt/data/the-life-loop-v072-retail-desktop.png')
        if width==390:
            page.screenshot(path='/mnt/data/the-life-loop-v072-retail-mobile.png')
        doc=page.evaluate('({sh:document.documentElement.scrollHeight,ch:document.documentElement.clientHeight,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})')
        assert doc['sh']<=doc['ch']+1 and doc['sw']<=doc['cw']+1,(width,doc)
        assert not errors,(width,errors)
        print('browser OK',width,height,'department labels',labels,'scroll',doc)
        page.close()
    browser.close()

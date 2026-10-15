"""Real browser acceptance for Classic hotseat, scenery and Social isolation."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'PLAY.html').read_text(encoding='utf8')
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in [(320,568),(390,844),(768,1024),(1440,900)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.set_content(html,wait_until='domcontentloaded')
        page.locator('#setupAdvanced').evaluate('el => el.open=true')
        page.locator('#gameMode').select_option('hotseat')
        page.locator('#startNewGameBtn').click()
        for selector in ['.board-empty-scene-left','.board-empty-scene-right','.board-clock-garden']:
            assert page.locator(selector).evaluate('e => getComputedStyle(e).display') != 'none',(width,selector)
        if width<=720:
            page.locator('#classicBoardFit').click()
            assert page.locator('.board-clock-garden').is_visible()
            page.locator('#classicBoardExplore').click()
        assert page.locator('[data-travel]').count()==13
        assert page.locator('#classicHotseatHandover').is_hidden()
        page.locator('#endTurnBtn').click()
        page.locator('#classicHotseatHandover').wait_for(state='visible',timeout=12000)
        assert "Player 2's turn" == page.locator('#classicHandoverTitle').inner_text()
        assert page.evaluate("document.querySelector('.shell').inert")
        assert page.evaluate("document.querySelector('#chatPanel').inert")
        assert page.locator('#classicHandoverContinue').evaluate('el => document.activeElement === el')
        page.keyboard.press('Escape')
        assert page.locator('#classicHotseatHandover').is_visible()
        page.locator('#classicHandoverContinue').click()
        assert page.locator('#classicHotseatHandover').is_hidden()
        assert page.locator('#classicTurnName').inner_text()=='Player 2'
        assert not page.evaluate("document.querySelector('.shell').inert")
        page.locator('#endTurnBtn').click()
        page.locator('#classicHotseatHandover').wait_for(state='visible',timeout=12000)
        assert "'s turn" in page.locator('#classicHandoverTitle').inner_text()
        assert not errors,(width,errors)
        print(f'Classic handover and scenic board: {width}x{height} OK')
        page.close()
    modern=browser.new_page(viewport={'width':390,'height':844})
    modern.set_content(html,wait_until='domcontentloaded')
    modern.locator('#setupAdvanced').evaluate('el => el.open=true')
    modern.locator('#gameMode').select_option('hotseat')
    modern.locator('input[name="ruleset"][value="modern"]').check()
    modern.locator('#startNewGameBtn').click()
    modern.locator('#endTurnBtn').click()
    assert modern.locator('#classicHotseatHandover').is_hidden()
    print('Modern hotseat isolation OK')
    browser.close()

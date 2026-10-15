from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'PLAY.html').read_text('utf8')
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium', headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in [(390,844),(1440,900)]:
  page=browser.new_page(viewport={'width':width,'height':height})
  failures=[]
  page.on('pageerror',lambda err:failures.append(str(err)))
  page.evaluate("""() => {const data = new Map();Object.defineProperty(window,'localStorage',{value:{getItem:key=>data.get(key)||null,setItem:(key,val)=>data.set(key,String(val)),removeItem:key=>data.delete(key)},configurable:true});}""")
  page.set_content(html,wait_until='domcontentloaded')
  page.locator('#startNewGameBtn').click()
  page.locator('#sharedProfileBtn').click()
  page.locator('#sharedPortraitCanvas').wait_for(state='visible',timeout=5000)
  page.wait_for_function("() => document.querySelector('#sharedProfileLoad')?.textContent?.startsWith('Change any option')",timeout=15000)
  options=page.locator('#sharedProfileComponents select').count()
  assert options>0,(width,'missing component editor')
  page.locator('#sharedProfileName').fill('CrossGame Hero')
  page.locator('#sharedProfileSave').click()
  status=page.locator('#sharedProfileStatus').inner_text();print('PROFILE SAVE STATUS',repr(status));assert 'saved locally' in status
  page.locator('.shared-profile-modal [data-close]').click()
  assert page.locator('#overlay').is_hidden()
  assert page.locator('.profile-top .shared-profile-avatar').count()==1
  assert page.locator('#classicTurnAvatar img').count()==1
  page.locator('#sharedProfileBtn').click()
  page.locator('#sharedProfilePack').select_option('dominion-pixel')
  page.wait_for_function("() => document.querySelector('#sharedProfileLoad')?.textContent?.startsWith('Change any option')",timeout=15000)
  page.locator('#sharedProfileSave').click()
  data=page.evaluate('localStorage.getItem("looprd.shared-profile.v1")')
  assert 'dominion-pixel' in data,(width,data)
  page.locator('.shared-profile-modal [data-close]').click()
  page.locator('#utilityMenuBtn').click()
  page.locator('#newBtn').click()
  assert page.locator('#startForm [name="name"]').input_value()=='CrossGame Hero'
  assert not failures,(width,failures)
  print(width,'profile modal PASS; modular selectors',options,'DOMINION saves persisted')
  page.close()
 browser.close()


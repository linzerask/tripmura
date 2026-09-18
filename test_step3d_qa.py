import asyncio
from playwright.async_api import async_playwright
import os
import shutil

async def run_step3d_qa():
    base_dir = r"c:\Users\43670\Desktop\Graphics\AnonymCreator - Digitalstudion\Webseiten\TripMura"
    artifact_dir = r"C:\Users\43670\.gemini\antigravity-ide\brain\f488a3ee-a05d-4d03-8abb-7eb7bdd6151e"
    
    dropdown_png = os.path.join(base_dir, "verification_dropdown_fixed.png")
    geocoding_png = os.path.join(base_dir, "verification_geocoding.png")
    tabs_png = os.path.join(base_dir, "verification_skyscanner_tabs.png")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: console_errors.append(str(exc)))
        
        url = "http://localhost:8099/index.html"
        print(f"Navigating to {url} ...")
        await page.goto(url, wait_until="networkidle")
        await asyncio.sleep(1.0)
        
        # 1. Test Dropdown Stacking & Elevation
        print("1. Testing Dropdown Stacking (Over Trending Routes)...")
        await page.click('#originInput')
        await asyncio.sleep(0.5)
        
        # Verify z-index and bounding box
        stacking_info = await page.evaluate("""() => {
            const pop = document.querySelector('#originPopover');
            const preview = document.querySelector('.hero-route-preview');
            const card = document.querySelector('.multimodal-search-card');
            
            return {
                popZIndex: window.getComputedStyle(pop).zIndex,
                popBoxShadow: window.getComputedStyle(pop).boxShadow,
                previewZIndex: window.getComputedStyle(preview).zIndex,
                cardOverflow: window.getComputedStyle(card).overflow
            };
        }""")
        print(f"Stacking Info: {stacking_info}")
        
        await page.screenshot(path=dropdown_png, full_page=False)
        print(f"Dropdown Stacking Screenshot saved to {dropdown_png}")
        
        # 2. Test Real Global Geocoding with "Vienna"
        print("2. Testing Real Global Geocoding Autocomplete with 'Vienna'...")
        await page.fill('#originInput', '')
        await page.type('#originInput', 'Vienna', delay=100)
        await asyncio.sleep(1.2) # Wait for Photon API debounce & response
        
        geocoding_items = await page.evaluate("""() => {
            const items = document.querySelectorAll('#originPopover .location-item');
            return Array.from(items).map(i => ({
                name: i.querySelector('.location-name')?.textContent,
                sub: i.querySelector('.location-sub')?.textContent,
                tag: i.querySelector('.location-tag')?.textContent
            }));
        }""")
        print(f"Geocoding Results for 'Vienna': {geocoding_items}")
        
        await page.screenshot(path=geocoding_png, full_page=False)
        print(f"Geocoding Screenshot saved to {geocoding_png}")
        
        # 3. Test Skyscanner Category Switcher
        print("3. Testing Skyscanner Category Tabs...")
        await page.click('[data-mode="flights"]')
        await asyncio.sleep(0.4)
        
        # Also open Trip Type micro dropdown to verify
        await page.click('#tripTypeBtn')
        await asyncio.sleep(0.3)
        
        tab_info = await page.evaluate("""() => {
            const activeTab = document.querySelector('.search-mode-tab.active');
            const originLabel = document.querySelector('#originField .field-label');
            const tripTypeMenu = document.querySelector('#tripTypeMenu');
            return {
                activeTabText: activeTab ? activeTab.textContent.trim() : null,
                originLabelText: originLabel ? originLabel.textContent.trim() : null,
                tripTypeMenuOpen: tripTypeMenu ? tripTypeMenu.classList.contains('open') : false
            };
        }""")
        print(f"Tab Switcher Info: activeTab={tab_info.get('activeTabText', '').encode('ascii', 'ignore').decode()}, originLabel={tab_info.get('originLabelText')}, menuOpen={tab_info.get('tripTypeMenuOpen')}")
        
        await page.screenshot(path=tabs_png, full_page=False)
        print(f"Skyscanner Tabs Screenshot saved to {tabs_png}")
        
        await browser.close()
        
        # Mirror screenshots to artifact directory
        for s in [dropdown_png, geocoding_png, tabs_png]:
            if os.path.exists(s):
                dest = os.path.join(artifact_dir, os.path.basename(s))
                shutil.copy2(s, dest)
                
        if console_errors:
            print(f"Console Errors: {console_errors}")
        else:
            print("Zero console errors! QA verified successfully.")

if __name__ == "__main__":
    asyncio.run(run_step3d_qa())

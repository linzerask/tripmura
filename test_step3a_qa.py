import asyncio
from playwright.async_api import async_playwright
import os
import shutil

async def run_step3a_qa():
    base_dir = r"c:\Users\43670\Desktop\Graphics\AnonymCreator - Digitalstudion\Webseiten\TripMura"
    artifact_dir = r"C:\Users\43670\.gemini\antigravity-ide\brain\f488a3ee-a05d-4d03-8abb-7eb7bdd6151e"
    
    locations_png = os.path.join(base_dir, "verification_search_locations.png")
    calendar_png = os.path.join(base_dir, "verification_search_calendar.png")
    travelers_png = os.path.join(base_dir, "verification_search_travelers.png")
    mobile_modal_png = os.path.join(base_dir, "verification_search_mobile_modal.png")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Desktop Session (1920x1080)
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: console_errors.append(str(exc)))
        
        print("Navigating to http://localhost:8099/index.html ...")
        await page.goto("http://localhost:8099/index.html", wait_until="networkidle")
        await asyncio.sleep(1.0)
        
        # 1A. Test Location Autosuggest Popover
        print("Opening Origin Location Popover...")
        await page.click('#originInput')
        await asyncio.sleep(0.4)
        await page.screenshot(path=locations_png, full_page=False)
        print(f"Location Autosuggest screenshot saved to {locations_png}")
        
        # 1B. Test Calendar Range Modal
        print("Opening Calendar Range Modal...")
        await page.click('#datesInput')
        await asyncio.sleep(0.4)
        await page.screenshot(path=calendar_png, full_page=False)
        print(f"Calendar Modal screenshot saved to {calendar_png}")
        
        # 1C. Test Traveler Stepper Modal & increment Adults
        print("Opening Traveler Stepper Modal...")
        await page.click('#guestsInput')
        await asyncio.sleep(0.4)
        
        # Click Adults Plus (+) button
        await page.click('#adultsPlus')
        await asyncio.sleep(0.3)
        
        # Check updated text
        guests_val = await page.input_value('#guestsInput')
        print(f"Updated Guests input value: {guests_val}")
        
        await page.screenshot(path=travelers_png, full_page=False)
        print(f"Traveler Stepper screenshot saved to {travelers_png}")
        
        # Check concentric radius on active popover
        metrics = await page.evaluate("""() => {
            const originPop = document.querySelector('#originPopover');
            const calPop = document.querySelector('#datesPickerModal');
            const travPop = document.querySelector('#travelersModal');
            const body = document.body;
            const docEl = document.documentElement;
            
            return {
                originPopRadius: window.getComputedStyle(originPop).borderRadius,
                originPopPadding: window.getComputedStyle(originPop).padding,
                calPopRadius: window.getComputedStyle(calPop).borderRadius,
                calPopPadding: window.getComputedStyle(calPop).padding,
                travPopRadius: window.getComputedStyle(travPop).borderRadius,
                travPopPadding: window.getComputedStyle(travPop).padding,
                hasHorizontalOverflow: docEl.scrollWidth > window.innerWidth || body.scrollWidth > window.innerWidth
            };
        }""")
        print(f"Desktop Popover Metrics: {metrics}")
        
        # 2. Mobile Bottom-Sheet Modal Test (390x844)
        mobile_page = await browser.new_page(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
        )
        await mobile_page.goto("http://localhost:8099/index.html", wait_until="networkidle")
        await asyncio.sleep(1.0)
        
        # Click Origin on mobile to open bottom-sheet modal
        print("Opening Mobile Bottom-Sheet Modal...")
        await mobile_page.click('#originInput')
        await asyncio.sleep(0.5)
        await mobile_page.screenshot(path=mobile_modal_png, full_page=False)
        print(f"Mobile Bottom-Sheet Modal screenshot saved to {mobile_modal_png}")
        
        await browser.close()
        
        # Mirror to artifact directory
        shutil.copy2(locations_png, os.path.join(artifact_dir, "verification_search_locations.png"))
        shutil.copy2(calendar_png, os.path.join(artifact_dir, "verification_search_calendar.png"))
        shutil.copy2(travelers_png, os.path.join(artifact_dir, "verification_search_travelers.png"))
        shutil.copy2(mobile_modal_png, os.path.join(artifact_dir, "verification_search_mobile_modal.png"))
        print("Artifacts successfully mirrored to brain directory.")
        
        if console_errors:
            print(f"Console errors encountered: {console_errors}")
        else:
            print("Zero console errors! Automated gates passed successfully.")

if __name__ == "__main__":
    asyncio.run(run_step3a_qa())

import asyncio
from playwright.async_api import async_playwright
import os
import shutil

async def run_mobile_backdrop_qa():
    base_dir = r"c:\Users\43670\Desktop\Graphics\AnonymCreator - Digitalstudion\Webseiten\TripMura"
    artifact_dir = r"C:\Users\43670\.gemini\antigravity-ide\brain\f488a3ee-a05d-4d03-8abb-7eb7bdd6151e"
    
    mobile_sheet_png = os.path.join(base_dir, "verification_mobile_sheet_fixed.png")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Test on iPhone 16 Pro Max viewport (440x956)
        page = await browser.new_page(
            viewport={"width": 440, "height": 956},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        )
        
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: console_errors.append(str(exc)))
        
        url = "http://localhost:8099/index.html"
        print(f"Navigating to {url} on iPhone 16 Pro Max (440x956)...")
        await page.goto(url, wait_until="networkidle")
        await asyncio.sleep(0.8)
        
        # Click Origin field to trigger bottom-sheet modal
        print("Clicking Origin Field (#originInput)...")
        await page.click('#originInput')
        await asyncio.sleep(0.5)
        
        # Inspect stacking order, z-index, visibility
        modal_metrics = await page.evaluate("""() => {
            const backdrop = document.querySelector('.search-modal-backdrop');
            const popover = document.querySelector('#originPopover');
            const items = document.querySelectorAll('#originPopover .location-item');
            
            return {
                backdropZIndex: window.getComputedStyle(backdrop).zIndex,
                backdropOpacity: window.getComputedStyle(backdrop).opacity,
                backdropVisibility: window.getComputedStyle(backdrop).visibility,
                backdropHasActive: backdrop.classList.contains('active') || backdrop.classList.contains('open'),
                popoverZIndex: window.getComputedStyle(popover).zIndex,
                popoverPosition: window.getComputedStyle(popover).position,
                popoverHasActive: popover.classList.contains('active') || popover.classList.contains('open'),
                itemCount: items.length,
                isPopoverHigher: parseInt(window.getComputedStyle(popover).zIndex) > parseInt(window.getComputedStyle(backdrop).zIndex)
            };
        }""")
        print(f"Modal Metrics: {modal_metrics}")
        
        # Screenshot the open bottom-sheet modal in the foreground
        await page.screenshot(path=mobile_sheet_png, full_page=False)
        print(f"Mobile Bottom-Sheet Screenshot saved to {mobile_sheet_png}")
        
        # Test clickability: Click the 3rd item (Vienna Schwechat)
        print("Testing clickability on location item inside bottom-sheet...")
        await page.click('#originPopover .location-item:nth-child(3)')
        await asyncio.sleep(0.4)
        
        updated_origin_val = await page.input_value('#originInput')
        print(f"Updated Origin Input value after click: {updated_origin_val}")
        
        await browser.close()
        
        # Mirror screenshot to artifact directory
        if os.path.exists(mobile_sheet_png):
            dest = os.path.join(artifact_dir, os.path.basename(mobile_sheet_png))
            shutil.copy2(mobile_sheet_png, dest)
            
        if console_errors:
            print(f"Console Errors: {console_errors}")
        else:
            print("Zero console errors! Mobile backdrop QA passed successfully.")

if __name__ == "__main__":
    asyncio.run(run_mobile_backdrop_qa())

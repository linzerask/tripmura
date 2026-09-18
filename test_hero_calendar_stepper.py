import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Desktop Hero Contrast Test (1920x1080)
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        await page.goto("http://localhost:8099/", wait_until="networkidle")
        await page.wait_for_timeout(2600) # Wait for preloader
        
        # Screenshot Hero with pure white typography and no top micro-badge
        await page.screenshot(path="verification_white_hero.png")
        print("Captured verification_white_hero.png")
        
        # 2. Dynamic Calendar Navigation
        # Open calendar modal
        await page.click("#datesInput")
        await page.wait_for_timeout(400)
        # Advance month by clicking Next (>) twice
        await page.click("#calNextMonth")
        await page.wait_for_timeout(300)
        await page.click("#calNextMonth")
        await page.wait_for_timeout(400)
        await page.screenshot(path="verification_calendar_dynamic.png")
        print("Captured verification_calendar_dynamic.png")
        
        # 3. One-Way Toggle & Clean Presets
        # Click One-way in calendar
        await page.click("#calOnewayBtn")
        await page.wait_for_timeout(400)
        await page.screenshot(path="verification_oneway_clean.png")
        print("Captured verification_oneway_clean.png")
        
        # Close calendar
        await page.click("#datesPickerModal .btn-apply-sm")
        await page.wait_for_timeout(300)
        
        # 4. Travelers Stepper Left Alignment
        await page.click("#guestsInput")
        await page.wait_for_timeout(400)
        await page.screenshot(path="verification_stepper_left_align.png")
        print("Captured verification_stepper_left_align.png")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())

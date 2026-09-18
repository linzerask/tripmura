import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Desktop Test (1920x1080)
        desktop_page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        await desktop_page.goto("http://localhost:8099/", wait_until="networkidle")
        await desktop_page.wait_for_timeout(2600) # Wait for preloader to finish
        
        # Click origin input to open dropdown
        await desktop_page.click("#originInput")
        await desktop_page.wait_for_timeout(500)
        
        # Screenshot desktop unclipped dropdown
        await desktop_page.screenshot(path="verification_desktop_unclipped.png", full_page=False)
        print("Captured verification_desktop_unclipped.png")
        
        # 2. Mobile Test (440x956 - iPhone 16 Pro Max)
        mobile_page = await browser.new_page(viewport={"width": 440, "height": 956})
        await mobile_page.goto("http://localhost:8099/", wait_until="networkidle")
        await mobile_page.wait_for_timeout(2600) # Wait for preloader
        
        # Open From modal
        await mobile_page.click("#originInput")
        await mobile_page.wait_for_timeout(600)
        await mobile_page.screenshot(path="verification_mobile_skyscanner_from.png")
        print("Captured verification_mobile_skyscanner_from.png")
        
        # Close From modal via back button or close button
        await mobile_page.click("#originPopover .modal-back-btn")
        await mobile_page.wait_for_timeout(400)
        
        # Open Dates modal
        await mobile_page.click("#datesInput")
        await mobile_page.wait_for_timeout(600)
        await mobile_page.screenshot(path="verification_mobile_skyscanner_dates.png")
        print("Captured verification_mobile_skyscanner_dates.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())

import asyncio
import os
from playwright.async_api import async_playwright

BASE_DIR = r"c:\Users\43670\Desktop\Graphics\AnonymCreator - Digitalstudion\Webseiten\TripMura"
OUT_DESKTOP = os.path.join(BASE_DIR, "verification_brand_desktop.png")
OUT_MOBILE = os.path.join(BASE_DIR, "verification_brand_mobile.png")
ARTIFACT_DESKTOP = r"C:\Users\43670\.gemini\antigravity-ide\brain\f488a3ee-a05d-4d03-8abb-7eb7bdd6151e\verification_brand_desktop.png"
ARTIFACT_MOBILE = r"C:\Users\43670\.gemini\antigravity-ide\brain\f488a3ee-a05d-4d03-8abb-7eb7bdd6151e\verification_brand_mobile.png"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: console_errors.append(str(exc)))

        # 1. Desktop Verification
        await page.set_viewport_size({"width": 1920, "height": 1080})
        await page.goto("http://localhost:8099/preview.html", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        
        await page.screenshot(path=OUT_DESKTOP, full_page=True)
        await page.screenshot(path=ARTIFACT_DESKTOP, full_page=True)
        print("Desktop screenshot captured successfully!")

        # 2. Mobile Verification
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.goto("http://localhost:8099/preview.html", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        
        await page.screenshot(path=OUT_MOBILE, full_page=True)
        await page.screenshot(path=ARTIFACT_MOBILE, full_page=True)
        print("Mobile screenshot captured successfully!")

        print(f"Total Console Errors: {len(console_errors)}")
        if console_errors:
            print("Errors:", console_errors)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())

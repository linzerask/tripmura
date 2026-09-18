import asyncio
import os
from playwright.async_api import async_playwright

BASE_DIR = r"c:\Users\43670\Desktop\Graphics\AnonymCreator - Digitalstudion\Webseiten\TripMura"
OUT_DESKTOP = os.path.join(BASE_DIR, "verification_step2_desktop.png")
OUT_MOBILE = os.path.join(BASE_DIR, "verification_step2_mobile.png")
OUT_DRAWER = os.path.join(BASE_DIR, "verification_step2_drawer.png")

ARTIFACT_DESKTOP = r"C:\Users\43670\.gemini\antigravity-ide\brain\f488a3ee-a05d-4d03-8abb-7eb7bdd6151e\verification_step2_desktop.png"
ARTIFACT_MOBILE = r"C:\Users\43670\.gemini\antigravity-ide\brain\f488a3ee-a05d-4d03-8abb-7eb7bdd6151e\verification_step2_mobile.png"
ARTIFACT_DRAWER = r"C:\Users\43670\.gemini\antigravity-ide\brain\f488a3ee-a05d-4d03-8abb-7eb7bdd6151e\verification_step2_drawer.png"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: console_errors.append(str(exc)))

        # 1. Desktop 1920x1080
        await page.set_viewport_size({"width": 1920, "height": 1080})
        await page.goto("http://localhost:8099/index.html", wait_until="networkidle")
        await page.wait_for_timeout(800)
        await page.screenshot(path=OUT_DESKTOP, full_page=True)
        await page.screenshot(path=ARTIFACT_DESKTOP, full_page=True)
        print("Desktop screenshot captured.")

        # Check overflow
        overflow_desktop = await page.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        print(f"Desktop horizontal overflow: {overflow_desktop}")

        # 2. Mobile 390x844 (iPhone 14 Pro)
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.goto("http://localhost:8099/index.html", wait_until="networkidle")
        await page.wait_for_timeout(800)
        await page.screenshot(path=OUT_MOBILE, full_page=True)
        await page.screenshot(path=ARTIFACT_MOBILE, full_page=True)
        print("Mobile screenshot captured.")

        overflow_mobile = await page.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        print(f"Mobile 390px horizontal overflow: {overflow_mobile}")

        # 3. Test Mobile Drawer
        toggle_btn = page.locator(".mobile-nav-toggle")
        await toggle_btn.click()
        await page.wait_for_timeout(400)
        await page.screenshot(path=OUT_DRAWER)
        await page.screenshot(path=ARTIFACT_DRAWER)
        print("Mobile drawer screenshot captured.")

        # Test Close Button
        close_btn = page.locator(".drawer-close-btn")
        await close_btn.click()
        await page.wait_for_timeout(400)
        drawer_active = await page.locator(".mobile-drawer").evaluate("el => el.classList.contains('active')")
        print(f"Drawer closed successfully: {not drawer_active}")

        # 4. Check 320px screen width
        await page.set_viewport_size({"width": 320, "height": 600})
        await page.wait_for_timeout(300)
        overflow_320 = await page.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        print(f"Mobile 320px horizontal overflow: {overflow_320}")

        print(f"Total Console Errors: {len(console_errors)}")
        if console_errors:
            print("Errors:", console_errors)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())

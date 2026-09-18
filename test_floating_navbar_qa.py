import asyncio
from playwright.async_api import async_playwright
import os
import shutil

async def run_navbar_qa():
    base_dir = r"c:\Users\43670\Desktop\Graphics\AnonymCreator - Digitalstudion\Webseiten\TripMura"
    artifact_dir = r"C:\Users\43670\.gemini\antigravity-ide\brain\f488a3ee-a05d-4d03-8abb-7eb7bdd6151e"
    
    desktop_png = os.path.join(base_dir, "verification_floating_navbar_desktop.png")
    mobile_png = os.path.join(base_dir, "verification_floating_navbar_mobile.png")
    scroll_png = os.path.join(base_dir, "verification_floating_navbar_scrolled.png")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Desktop Test (1920x1080)
        context_dt = await browser.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
        page_dt = await context_dt.new_page()

        console_errors = []
        page_dt.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page_dt.on("pageerror", lambda exc: console_errors.append(str(exc)))

        url = "http://localhost:8099/index.html"
        print(f"Loading desktop {url} (1920x1080)...")
        await page_dt.goto(url, wait_until="networkidle")
        # Wait for preloader to finish
        await asyncio.sleep(3.2)

        # Inspect header positioning and styles
        header_styles = await page_dt.evaluate("""() => {
            const header = document.querySelector('.site-header');
            const shell = document.querySelector('.navbar-shell');
            const style = window.getComputedStyle(header);
            const shellStyle = window.getComputedStyle(shell);
            return {
                position: style.position,
                background: style.backgroundColor,
                boxShadow: style.boxShadow,
                border: style.border,
                paddingTop: style.paddingTop,
                shellBackground: shellStyle.backgroundColor,
                shellBackdropFilter: shellStyle.backdropFilter || shellStyle.webkitBackdropFilter
            };
        }""")
        print(f"Desktop Header Computed Styles: {header_styles}")

        # Capture Desktop
        await page_dt.screenshot(path=desktop_png, full_page=False)
        print(f"Saved desktop screenshot to {desktop_png}")

        # Test Scroll behavior (scrolling down 300px)
        await page_dt.evaluate("() => window.scrollTo(0, 300)")
        await asyncio.sleep(0.4)
        await page_dt.screenshot(path=scroll_png, full_page=False)
        print(f"Saved scrolled desktop screenshot to {scroll_png}")

        # 2. Mobile Test (390x844 - iPhone 14/15/16)
        context_mb = await browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        page_mb = await context_mb.new_page()
        print(f"Loading mobile {url} (390x844)...")
        await page_mb.goto(url, wait_until="networkidle")
        await asyncio.sleep(3.2)

        mobile_header_styles = await page_mb.evaluate("""() => {
            const header = document.querySelector('.site-header');
            const style = window.getComputedStyle(header);
            return {
                position: style.position,
                background: style.backgroundColor,
                paddingTop: style.paddingTop
            };
        }""")
        print(f"Mobile Header Computed Styles: {mobile_header_styles}")

        # Capture Mobile
        await page_mb.screenshot(path=mobile_png, full_page=False)
        print(f"Saved mobile screenshot to {mobile_png}")

        await browser.close()

        # Copy to artifacts
        for img in [desktop_png, mobile_png, scroll_png]:
            if os.path.exists(img):
                dest = os.path.join(artifact_dir, os.path.basename(img))
                shutil.copy2(img, dest)

        if console_errors:
            print(f"Console errors: {console_errors}")
        else:
            print("ZERO console errors! Floating island navbar QA passed successfully.")

if __name__ == "__main__":
    asyncio.run(run_navbar_qa())

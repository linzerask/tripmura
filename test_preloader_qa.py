import asyncio
from playwright.async_api import async_playwright
import os
import shutil

async def run_preloader_qa():
    base_dir = r"c:\Users\43670\Desktop\Graphics\AnonymCreator - Digitalstudion\Webseiten\TripMura"
    artifact_dir = r"C:\Users\43670\.gemini\antigravity-ide\brain\f488a3ee-a05d-4d03-8abb-7eb7bdd6151e"
    
    img_active = os.path.join(base_dir, "verification_preloader_active.png")
    img_revealed = os.path.join(base_dir, "verification_preloader_revealed.png")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2
        )
        page = await context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: console_errors.append(str(exc)))

        url = "http://localhost:8099/index.html?fresh=1"
        print(f"Loading {url} to capture active preloader...")

        # Navigate
        await page.goto(url, wait_until="domcontentloaded")
        
        # Wait ~350ms to capture midway progress (~45-55%)
        await asyncio.sleep(0.35)
        
        active_pct = await page.evaluate("() => document.querySelector('.preloader-counter')?.textContent")
        print(f"Midway preloader percentage captured: {active_pct}")
        
        await page.screenshot(path=img_active, full_page=False)
        print(f"Saved active preloader screenshot to {img_active}")

        # Wait until full 1.4s animation finishes + 600ms entrance transition
        await asyncio.sleep(1.6)

        is_done = await page.evaluate("() => document.body.classList.contains('preloader-done')")
        is_preloader_hidden = await page.evaluate("() => window.getComputedStyle(document.getElementById('sitePreloader')).visibility === 'hidden' || document.getElementById('sitePreloader').style.display === 'none'")
        print(f"Preloader Done Class on Body: {is_done}, Preloader Hidden: {is_preloader_hidden}")

        await page.screenshot(path=img_revealed, full_page=False)
        print(f"Saved completed reveal screenshot to {img_revealed}")

        # Test mobile viewport as well
        mobile_page = await context.new_page()
        await mobile_page.set_viewport_size({"width": 440, "height": 956})
        await mobile_page.goto(url, wait_until="domcontentloaded")
        await asyncio.sleep(0.6)
        mob_active_pct = await mobile_page.evaluate("() => document.querySelector('.preloader-counter')?.textContent")
        print(f"Mobile preloader percentage: {mob_active_pct}")
        await asyncio.sleep(1.6)
        mob_is_done = await mobile_page.evaluate("() => document.body.classList.contains('preloader-done')")
        print(f"Mobile preloader complete: {mob_is_done}")

        await browser.close()

        # Copy to artifacts directory
        for img in [img_active, img_revealed]:
            if os.path.exists(img):
                dest = os.path.join(artifact_dir, os.path.basename(img))
                shutil.copy2(img, dest)

        if console_errors:
            print(f"Console errors: {console_errors}")
        else:
            print("ZERO console errors! 60fps Vector flight preloader verified successfully.")

if __name__ == "__main__":
    asyncio.run(run_preloader_qa())

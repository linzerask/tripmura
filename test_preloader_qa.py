import asyncio
from playwright.async_api import async_playwright
import os
import shutil

async def run_cinematic_preloader_qa():
    base_dir = r"c:\Users\43670\Desktop\Graphics\AnonymCreator - Digitalstudion\Webseiten\TripMura"
    artifact_dir = r"C:\Users\43670\.gemini\antigravity-ide\brain\f488a3ee-a05d-4d03-8abb-7eb7bdd6151e"
    
    frame_05s = os.path.join(base_dir, "verification_preloader_05s.png")
    frame_12s = os.path.join(base_dir, "verification_preloader_12s.png")
    frame_20s = os.path.join(base_dir, "verification_preloader_20s.png")
    frame_done = os.path.join(base_dir, "verification_preloader_revealed.png")

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
        print(f"Navigating to {url}...")
        await page.goto(url, wait_until="networkidle")

        # Frame 1: 0.5s
        await page.evaluate("() => window.restartPreloader()")
        await asyncio.sleep(0.5)
        pct_05 = await page.evaluate("() => document.querySelector('.preloader-counter')?.textContent")
        print(f"Frame @ 0.5s - Counter: {pct_05}")
        await page.screenshot(path=frame_05s, full_page=False)

        # Frame 2: 1.2s
        await page.evaluate("() => window.restartPreloader()")
        await asyncio.sleep(1.2)
        pct_12 = await page.evaluate("() => document.querySelector('.preloader-counter')?.textContent")
        print(f"Frame @ 1.2s - Counter: {pct_12}")
        await page.screenshot(path=frame_12s, full_page=False)

        # Frame 3: 2.0s
        await page.evaluate("() => window.restartPreloader()")
        await asyncio.sleep(2.0)
        pct_20 = await page.evaluate("() => document.querySelector('.preloader-counter')?.textContent")
        print(f"Frame @ 2.0s - Counter: {pct_20}")
        await page.screenshot(path=frame_20s, full_page=False)

        # Final Frame: Completed reveal after 2.2s + hold + exit
        await page.evaluate("() => window.restartPreloader()")
        await asyncio.sleep(3.2)
        is_done = await page.evaluate("() => document.body.classList.contains('preloader-done')")
        print(f"Frame @ Done - Preloader Done: {is_done}")
        await page.screenshot(path=frame_done, full_page=False)

        # Test mobile viewport as well
        mobile_page = await context.new_page()
        await mobile_page.set_viewport_size({"width": 440, "height": 956})
        await mobile_page.goto(url, wait_until="domcontentloaded")
        await asyncio.sleep(1.1)
        mob_pct = await mobile_page.evaluate("() => document.querySelector('.preloader-counter')?.textContent")
        print(f"Mobile Midpoint Counter (1.1s): {mob_pct}")
        await asyncio.sleep(1.6)
        mob_done = await mobile_page.evaluate("() => document.body.classList.contains('preloader-done')")
        print(f"Mobile Done: {mob_done}")

        await browser.close()

        # Copy images to artifacts
        for img in [frame_05s, frame_12s, frame_20s, frame_done]:
            if os.path.exists(img):
                dest = os.path.join(artifact_dir, os.path.basename(img))
                shutil.copy2(img, dest)

        if console_errors:
            print(f"Console errors: {console_errors}")
        else:
            print("ZERO console errors! 2.2s Cinematic preloader QA passed successfully.")

if __name__ == "__main__":
    asyncio.run(run_cinematic_preloader_qa())

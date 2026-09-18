import asyncio
from playwright.async_api import async_playwright
import os
import shutil

async def run_step2f_qa():
    base_dir = r"c:\Users\43670\Desktop\Graphics\AnonymCreator - Digitalstudion\Webseiten\TripMura"
    artifact_dir = r"C:\Users\43670\.gemini\antigravity-ide\brain\f488a3ee-a05d-4d03-8abb-7eb7bdd6151e"
    
    desktop_png = os.path.join(base_dir, "verification_practical_ui_desktop.png")
    mobile_png = os.path.join(base_dir, "verification_practical_ui_mobile.png")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Desktop Test (1920x1080)
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: console_errors.append(str(exc)))
        
        print("Navigating to http://localhost:8099/index.html ...")
        await page.goto("http://localhost:8099/index.html", wait_until="networkidle")
        await asyncio.sleep(1.0)
        
        title = await page.title()
        print(f"Page Title: {title}")
        
        # Layout & Concentric Math Verification
        metrics = await page.evaluate("""() => {
            const card = document.querySelector('.multimodal-search-card');
            const field = document.querySelector('.search-field');
            const cta = document.querySelector('.search-cta-btn');
            const cardStyle = window.getComputedStyle(card);
            const fieldStyle = window.getComputedStyle(field);
            const ctaStyle = window.getComputedStyle(cta);
            const body = document.body;
            const docEl = document.documentElement;
            
            return {
                cardRadius: cardStyle.borderRadius,
                cardPadding: cardStyle.padding,
                fieldRadius: fieldStyle.borderRadius,
                ctaRadius: ctaStyle.borderRadius,
                fieldHeight: fieldStyle.height,
                ctaHeight: ctaStyle.height,
                hasHorizontalOverflow: docEl.scrollWidth > window.innerWidth || body.scrollWidth > window.innerWidth,
                scrollWidth: docEl.scrollWidth,
                innerWidth: window.innerWidth
            };
        }""")
        print(f"Desktop Metrics: {metrics}")
        
        await page.screenshot(path=desktop_png, full_page=True)
        print(f"Desktop screenshot saved to {desktop_png}")
        
        # 2. Mobile Viewport (390x844)
        mobile_page = await browser.new_page(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
        )
        await mobile_page.goto("http://localhost:8099/index.html", wait_until="networkidle")
        await asyncio.sleep(1.0)
        
        mobile_metrics = await mobile_page.evaluate("""() => {
            const docEl = document.documentElement;
            const body = document.body;
            return {
                hasHorizontalOverflow: docEl.scrollWidth > window.innerWidth || body.scrollWidth > window.innerWidth,
                scrollWidth: docEl.scrollWidth,
                innerWidth: window.innerWidth
            };
        }""")
        print(f"Mobile Metrics: {mobile_metrics}")
        
        await mobile_page.screenshot(path=mobile_png, full_page=True)
        print(f"Mobile screenshot saved to {mobile_png}")
        
        await browser.close()
        
        # Mirror to artifact directory
        shutil.copy2(desktop_png, os.path.join(artifact_dir, "verification_practical_ui_desktop.png"))
        shutil.copy2(mobile_png, os.path.join(artifact_dir, "verification_practical_ui_mobile.png"))
        print("Artifacts successfully mirrored to brain directory.")
        
        if console_errors:
            print(f"Console errors encountered: {console_errors}")
        else:
            print("Zero console errors! Automated gates passed successfully.")

if __name__ == "__main__":
    asyncio.run(run_step2f_qa())

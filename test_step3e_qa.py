import asyncio
from playwright.async_api import async_playwright
import os
import shutil

async def run_step3e_qa():
    base_dir = r"c:\Users\43670\Desktop\Graphics\AnonymCreator - Digitalstudion\Webseiten\TripMura"
    artifact_dir = r"C:\Users\43670\.gemini\antigravity-ide\brain\f488a3ee-a05d-4d03-8abb-7eb7bdd6151e"
    
    mobile_fixed_png = os.path.join(base_dir, "verification_mobile_navbar_fixed.png")
    mobile_440_png = os.path.join(base_dir, "verification_mobile_navbar_440.png")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Test iPhone 14 (390x844)
        print("1. Testing iPhone 14 (390x844)...")
        page_mobile = await browser.new_page(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
        )
        url = "http://localhost:8099/index.html"
        await page_mobile.goto(url, wait_until="networkidle")
        await asyncio.sleep(0.8)
        
        # Inspect navbar metrics
        metrics = await page_mobile.evaluate("""() => {
            const headerCta = document.querySelector('.site-header .nav-actions .btn-primary');
            const toggle = document.querySelector('.mobile-nav-toggle');
            const shell = document.querySelector('.navbar-shell');
            const brand = document.querySelector('.brand-link');
            
            return {
                headerCtaDisplay: window.getComputedStyle(headerCta).display,
                toggleDisplay: window.getComputedStyle(toggle).display,
                toggleWidth: toggle.offsetWidth,
                toggleHeight: toggle.offsetHeight,
                shellPadding: window.getComputedStyle(shell).padding,
                brandWidth: brand.offsetWidth
            };
        }""")
        print(f"Mobile Navbar Metrics: {metrics}")
        
        await page_mobile.screenshot(path=mobile_fixed_png, full_page=False)
        print(f"Mobile Screenshot saved to {mobile_fixed_png}")
        
        # 2. Test iPhone 16 Pro Max (440x956)
        print("2. Testing iPhone 16 Pro Max (440x956)...")
        page_440 = await browser.new_page(
            viewport={"width": 440, "height": 956},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        )
        await page_440.goto(url, wait_until="networkidle")
        await asyncio.sleep(0.8)
        await page_440.screenshot(path=mobile_440_png, full_page=False)
        print(f"iPhone 16 Pro Max Screenshot saved to {mobile_440_png}")
        
        # 3. Test Desktop (1920x1080)
        print("3. Testing Desktop Viewport (1920x1080)...")
        page_desktop = await browser.new_page(viewport={"width": 1920, "height": 1080})
        await page_desktop.goto(url, wait_until="networkidle")
        await asyncio.sleep(0.8)
        
        desktop_metrics = await page_desktop.evaluate("""() => {
            const headerCta = document.querySelector('.site-header .nav-actions .btn-primary');
            const toggle = document.querySelector('.mobile-nav-toggle');
            return {
                headerCtaDisplay: window.getComputedStyle(headerCta).display,
                toggleDisplay: window.getComputedStyle(toggle).display
            };
        }""")
        print(f"Desktop Navbar Metrics: {desktop_metrics}")
        
        await browser.close()
        
        # Mirror to artifact directory
        for s in [mobile_fixed_png, mobile_440_png]:
            if os.path.exists(s):
                dest = os.path.join(artifact_dir, os.path.basename(s))
                shutil.copy2(s, dest)
                
        print("Verification complete!")

if __name__ == "__main__":
    asyncio.run(run_step3e_qa())

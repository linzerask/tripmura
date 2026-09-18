import asyncio
from playwright.async_api import async_playwright
import os
import shutil
import json

async def run_design_audit():
    base_dir = r"c:\Users\43670\Desktop\Graphics\AnonymCreator - Digitalstudion\Webseiten\TripMura"
    artifact_dir = r"C:\Users\43670\.gemini\antigravity-ide\brain\f488a3ee-a05d-4d03-8abb-7eb7bdd6151e"
    
    audit_results = {}
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Desktop 1440x900 (Standard Laptop)
        page_desktop = await browser.new_page(viewport={"width": 1440, "height": 900})
        console_logs = []
        page_desktop.on("console", lambda msg: console_logs.append({"type": msg.type, "text": msg.text}))
        
        url = "http://localhost:8099/index.html"
        await page_desktop.goto(url, wait_until="networkidle")
        await asyncio.sleep(1.0)
        
        # Full page desktop screenshot
        desktop_full = os.path.join(base_dir, "audit_desktop_full.png")
        await page_desktop.screenshot(path=desktop_full, full_page=True)
        
        # Check computed styles & Practical UI metrics
        metrics = await page_desktop.evaluate("""() => {
            const card = document.querySelector('.multimodal-search-card');
            const searchField = document.querySelector('.search-field');
            const searchBtn = document.querySelector('.search-cta-btn');
            const heroHeadline = document.querySelector('.hero-headline');
            const header = document.querySelector('.site-header');
            
            return {
                bodyScrollWidth: document.body.scrollWidth,
                windowWidth: window.innerWidth,
                cardRadius: card ? window.getComputedStyle(card).borderRadius : null,
                cardPadding: card ? window.getComputedStyle(card).padding : null,
                fieldRadius: searchField ? window.getComputedStyle(searchField).borderRadius : null,
                fieldHeight: searchField ? searchField.offsetHeight : null,
                btnHeight: searchBtn ? searchBtn.offsetHeight : null,
                headerHeight: header ? header.offsetHeight : null,
                headlineColor: heroHeadline ? window.getComputedStyle(heroHeadline).color : null,
                isOverflowing: document.documentElement.scrollWidth > window.innerWidth
            };
        }""")
        audit_results["desktop_metrics"] = metrics
        
        # 2. Test Currency Toggle
        currency_btn = await page_desktop.query_selector('#currencyBtn')
        if currency_btn:
            print("Testing Currency Toggle...")
            await currency_btn.click()
            await asyncio.sleep(0.3)
            currency_text = await page_desktop.inner_text('#currencyBtn')
            audit_results["currency_toggled_to"] = currency_text
        
        # 3. Test Search Mode Tabs
        print("Testing Search Mode Tabs...")
        tabs = await page_desktop.query_selector_all('.search-mode-tab')
        if len(tabs) > 1:
            await tabs[1].click()
            await asyncio.sleep(0.3)
            await tabs[0].click()
            await asyncio.sleep(0.2)
        
        # 4. Capture Focused Hero View
        hero_shot = os.path.join(base_dir, "audit_hero_focused.png")
        hero_el = await page_desktop.query_selector('.hero-section')
        if hero_el:
            await hero_el.screenshot(path=hero_shot)
            
        # 5. Capture Footer View
        footer_shot = os.path.join(base_dir, "audit_footer_focused.png")
        footer_el = await page_desktop.query_selector('.site-footer')
        if footer_el:
            await footer_el.screenshot(path=footer_shot)
            
        # 6. Tablet Audit (768x1024 iPad)
        print("Auditing Tablet Viewport (768x1024)...")
        page_tablet = await browser.new_page(viewport={"width": 768, "height": 1024})
        await page_tablet.goto(url, wait_until="networkidle")
        await asyncio.sleep(0.8)
        tablet_full = os.path.join(base_dir, "audit_tablet_full.png")
        await page_tablet.screenshot(path=tablet_full, full_page=True)
        
        # 7. Mobile Audit (390x844 iPhone 14)
        print("Auditing Mobile Viewport (390x844)...")
        page_mobile = await browser.new_page(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
        )
        await page_mobile.goto(url, wait_until="networkidle")
        await asyncio.sleep(0.8)
        mobile_full = os.path.join(base_dir, "audit_mobile_full.png")
        await page_mobile.screenshot(path=mobile_full, full_page=True)
        
        # Open Mobile Nav Drawer
        nav_toggle = await page_mobile.query_selector('.mobile-nav-toggle')
        if nav_toggle:
            print("Auditing Mobile Nav Drawer...")
            await nav_toggle.click()
            await asyncio.sleep(0.5)
            mobile_drawer = os.path.join(base_dir, "audit_mobile_drawer.png")
            await page_mobile.screenshot(path=mobile_drawer, full_page=False)
            
            # Close Drawer
            drawer_close = await page_mobile.query_selector('.drawer-close-btn')
            if drawer_close:
                await drawer_close.click()
                await asyncio.sleep(0.3)
        
        await browser.close()
        
        # Mirror screenshots to artifact directory
        for s in [desktop_full, hero_shot, footer_shot, tablet_full, mobile_full, mobile_drawer]:
            if os.path.exists(s):
                dest = os.path.join(artifact_dir, os.path.basename(s))
                shutil.copy2(s, dest)
                
        audit_results["console_logs"] = console_logs
        print("=== DESIGN AUDIT COMPLETE ===")
        print(json.dumps(audit_results, indent=2))

if __name__ == "__main__":
    asyncio.run(run_design_audit())

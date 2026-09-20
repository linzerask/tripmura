import os
import sys
import time
from playwright.sync_api import sync_playwright

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def launch_viewer():
    print("\n--- LAUNCHING VISIBLE DESKTOP BROWSER INTERFACE ---")
    with sync_playwright() as p:
        # Launch Chrome directly in visible mode with UI
        browser = p.chromium.launch(
            headless=False,
            args=[
                "--start-maximized",
                "--no-sandbox",
                "--disable-infobars"
            ]
        )
        context = browser.new_context(no_viewport=True)
        page = context.new_page()

        print("Navigating to TripMura Discovery Hub: http://localhost:8080/index.html")
        page.goto("http://localhost:8080/index.html")
        page.wait_for_load_state("networkidle")
        
        # Keep window interactive and open for 60 seconds or until user interacts
        print("Browser window is now live and interactive on your desktop screen!")
        for i in range(60):
            try:
                time.sleep(1)
            except KeyboardInterrupt:
                break
        
        browser.close()

if __name__ == '__main__':
    launch_viewer()

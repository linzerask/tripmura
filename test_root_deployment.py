import sys
import time
from playwright.sync_api import sync_playwright

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def test_root():
    print("\n--- TESTING ROOT DEPLOYMENT (http://localhost:8099/index.html & results.html) ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1366, 'height': 900})
        page = context.new_page()

        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

        print("1. Loading Root Homepage: http://localhost:8099/index.html")
        page.goto('http://localhost:8099/index.html')
        page.wait_for_load_state('networkidle')
        time.sleep(1.0)

        # Search London to Vienna
        origin_input = page.locator('#originInput')
        dest_input = page.locator('#destInput')
        origin_input.fill("London (LON)")
        dest_input.fill("Vienna (VIE)")

        search_btn = page.locator('.search-cta-btn')
        search_btn.click()

        # Wait for navigation to root results.html
        page.wait_for_url("**/results.html*", timeout=6000)
        print(f"Navigated to: {page.url}")
        assert "v2" not in page.url, "Should navigate directly to root results.html"
        assert "results.html" in page.url

        # Wait for progressive scanner
        scanner = page.locator('#progressiveSearchScanner')
        assert scanner.is_visible(), "Progressive scanner must be visible on root results.html"
        time.sleep(1.6)

        cards = page.locator('.feed-card')
        assert cards.count() >= 8, f"Expected >= 8 cards, got {cards.count()}"
        print(f"Feed cards rendered at root: {cards.count()}")

        # Check Forwarding modal at root
        first_card = cards.first
        toggle_btn = first_card.locator('.btn-toggle-deal-matrix')
        toggle_btn.click()
        time.sleep(0.3)

        deal_btn = first_card.locator('.btn-book-provider-deal').first
        deal_btn.click()
        time.sleep(0.3)

        forwarding_modal = page.locator('#tripMuraForwardingModal')
        assert forwarding_modal.is_visible(), "Forwarding modal should open at root"
        headline = page.locator('#forwardingHeadline').text_content()
        print(f"Forwarding headline at root: {headline}")
        assert "Redirecting to" in headline

        # Test mobile at root
        page.set_viewport_size({'width': 390, 'height': 844})
        time.sleep(1.0)
        scroll_w = page.evaluate("document.documentElement.scrollWidth")
        print(f"Mobile scroll width at root: {scroll_w}px")
        assert scroll_w <= 390, f"Horizontal overflow at root: {scroll_w}px"

        browser.close()
        print("\n--- ALL ROOT TESTS PASSED PERFECTLY! ---")

if __name__ == '__main__':
    test_root()

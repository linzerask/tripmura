import sys
import time
from playwright.sync_api import sync_playwright

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def test_full_workflow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1366, 'height': 900})
        page = context.new_page()

        print("1. Loading v2 homepage (http://localhost:8099/v2/)...")
        page.goto('http://localhost:8099/v2/index.html')
        page.wait_for_load_state('networkidle')

        # Check Preloader finishes
        time.sleep(1.0)

        # Set Origin & Destination on hero
        origin_input = page.locator('#originInput')
        dest_input = page.locator('#destInput')

        assert origin_input.is_visible(), "Origin input visible on v2 hero"
        assert dest_input.is_visible(), "Dest input visible on v2 hero"

        origin_input.fill("Vienna (VIE)")
        dest_input.fill("Palma de Mallorca (PMI)")

        page.screenshot(path="verification_v2_home_search.png")

        # Submit search
        search_btn = page.locator('.search-cta-btn')
        print("Submitting search on v2 hero...")
        search_btn.click()

        # Wait for transition overlay to navigate to results.html
        page.wait_for_url("**/v2/results.html*", timeout=6000)
        print(f"Navigated to: {page.url}")
        assert "results.html" in page.url
        assert "VIE" in page.url or "Vienna" in page.url
        assert "PMI" in page.url or "Palma" in page.url

        # Check Scanner on newly navigated page
        scanner = page.locator('#progressiveSearchScanner')
        assert scanner.is_visible(), "Progressive scanner visible on results page"
        
        time.sleep(1.6)

        # Verify dynamic route title in results
        title = page.locator('.results-main-title').text_content()
        print(f"Results page title: {title}")
        assert "Vienna" in title or "VIE" in title or "Journeys" in title

        # Verify feed cards
        cards = page.locator('.feed-card')
        print(f"Feed cards rendered: {cards.count()}")
        assert cards.count() > 0

        # Open Deal Matrix on first card
        first_card = cards.first
        toggle_btn = first_card.locator('.btn-toggle-deal-matrix')
        toggle_btn.click()
        time.sleep(0.3)

        deal_rows = first_card.locator('.deal-provider-row')
        print(f"Deal rows in first card: {deal_rows.count()}")
        assert deal_rows.count() >= 4

        # Test forwarding hand-off modal
        first_deal_btn = deal_rows.first.locator('.btn-book-provider-deal')
        first_deal_btn.click()
        time.sleep(0.3)

        forwarding_modal = page.locator('#tripMuraForwardingModal')
        assert forwarding_modal.is_visible()
        print(f"Forwarding modal headline: {page.locator('#forwardingHeadline').text_content().strip()}")

        page.screenshot(path="verification_v2_workflow_forwarding.png")

        browser.close()
        print("FULL V2 WORKFLOW TEST PASSED!")

if __name__ == '__main__':
    test_full_workflow()

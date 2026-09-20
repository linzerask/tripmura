import os
import sys
import time
from playwright.sync_api import sync_playwright

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def test_v2():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1366, 'height': 900})
        page = context.new_page()

        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

        print("1. Loading v2 results page...")
        page.goto('http://localhost:8099/v2/results.html?from=Linz&to=Thessaloniki&depart=2026-09-21&return=2026-09-28&travelers=2')
        page.wait_for_load_state('networkidle')

        # Check Progressive Scanner
        scanner = page.locator('#progressiveSearchScanner')
        assert scanner.is_visible(), "Progressive scanner should be visible on results page"
        status_text = page.locator('#scannerStatusText').text_content()
        print(f"Scanner initial status: {status_text}")
        
        # Wait 1.5s for scanner to complete 100%
        time.sleep(1.6)
        final_status = page.locator('#scannerStatusText').text_content()
        print(f"Scanner final status: {final_status}")
        assert "Found 142 journeys" in final_status or "Scan Complete" in final_status, f"Expected scan complete message, got {final_status}"

        page.screenshot(path="verification_v2_scanner_results.png", full_page=False)

        # Check Cards and Deal Matrix Strip
        cards = page.locator('.feed-card')
        count = cards.count()
        print(f"Rendered feed cards count: {count}")
        assert count > 0, "Should have rendered feed cards"

        first_card = cards.first
        deal_strip = first_card.locator('.card-deal-matrix-strip')
        assert deal_strip.is_visible(), "Card should contain deal matrix strip"
        
        # Toggle expandable deal matrix on first card
        toggle_btn = first_card.locator('.btn-toggle-deal-matrix')
        assert toggle_btn.is_visible(), "Toggle deal button should be visible"
        toggle_btn.click()
        time.sleep(0.3)

        expandable = first_card.locator('.card-deal-matrix-expandable')
        assert expandable.is_visible(), "Expandable deal matrix should now be visible"
        deal_rows = expandable.locator('.deal-provider-row')
        print(f"First card deal rows count: {deal_rows.count()}")
        assert deal_rows.count() >= 4, "Should have at least 4 provider deals (MyTrip, Airline, Gotogate, Flightnetwork, Expedia)"

        # Check provider deal names
        expandable_text = expandable.text_content()
        assert "MyTrip.com" in expandable_text, "MyTrip.com should be in deal matrix"
        assert "Gotogate" in expandable_text, "Gotogate should be in deal matrix"
        assert "Expedia" in expandable_text or "Trainline" in expandable_text, "Expedia/Trainline should be in deal matrix"

        page.screenshot(path="verification_v2_deal_matrix.png", full_page=False)

        # Click a provider button and check Forwarding Modal
        mytrip_btn = expandable.locator('.btn-book-provider-deal').first
        print("Clicking provider deal button to test forwarding hand-off...")
        mytrip_btn.click()
        time.sleep(0.3)

        forwarding_modal = page.locator('#tripMuraForwardingModal')
        assert forwarding_modal.is_visible(), "TripMura Forwarding Modal should be open"
        f_headline = page.locator('#forwardingHeadline').text_content()
        f_verified = page.locator('#forwardingVerifiedText').text_content()
        print(f"Forwarding modal headline: {f_headline}")
        print(f"Forwarding verified pill: {f_verified}")
        assert "Redirecting to" in f_headline, f"Expected redirect headline, got {f_headline}"
        assert "TripMura Verified Price" in f_verified, f"Expected verified price text, got {f_verified}"

        page.screenshot(path="verification_v2_forwarding_modal.png", full_page=False)

        # Wait for forwarding modal to complete redirect / close
        time.sleep(1.8)

        # Test Trip Breakdown Drawer with Skyscanner Matrix
        print("Testing Itinerary Breakdown Drawer...")
        breakdown_btn = first_card.locator('.btn-feed-breakdown')
        breakdown_btn.click()
        time.sleep(0.4)

        drawer = page.locator('#tripSummaryModal')
        assert drawer.is_visible(), "Summary drawer should be open"
        drawer_deals = drawer.locator('.drawer-deal-matrix-box')
        assert drawer_deals.is_visible(), "Drawer should contain live provider deal matrix"
        print(f"Drawer deals text summary: {drawer_deals.text_content()[:100]}...")

        page.screenshot(path="verification_v2_drawer_matrix.png", full_page=False)

        non_tp_errors = [e for e in console_errors if "favicon" not in e and "tp-em.com" not in e and "config is not valid" not in e and "ERR_FAILED" not in e]
        assert len(non_tp_errors) == 0, f"Critical JS console errors found: {non_tp_errors}"

        browser.close()
        print("All v2 Skyscanner engine tests PASSED!")

if __name__ == '__main__':
    test_v2()

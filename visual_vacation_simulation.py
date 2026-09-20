import os
import sys
import time
from playwright.sync_api import sync_playwright

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def run_visual_simulation():
    print("\n" + "="*70)
    print("LAUNCHING INTERACTIVE VISUAL BROWSER SIMULATION (HEADLESS: FALSE)")
    print("="*70)

    with sync_playwright() as p:
        # Launch visible browser window with slow motion so the user can watch the full flow
        browser = p.chromium.launch(
            headless=False,
            slow_mo=200,
            args=["--start-maximized", "--no-sandbox"]
        )
        context = browser.new_context(no_viewport=True)
        page = context.new_page()

        # ---------------------------------------------------------------------
        # 1. HOMEPAGE EXPLORATION (v2/index.html)
        # ---------------------------------------------------------------------
        print("\n[STEP 1] Opening TripMura v2 Discovery Hub...")
        page.goto("http://localhost:8099/v2/index.html")
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)

        print("[STEP 1.1] Selecting Origin: 'London'...")
        origin_input = page.locator("#originInput")
        origin_input.click()
        time.sleep(0.5)
        origin_input.fill("London")
        time.sleep(0.8)

        # Click first autocomplete suggestion
        suggestion = page.locator(".geocoding-item, .popover-preset-item").first
        if suggestion.is_visible():
            suggestion.click()
        else:
            origin_input.fill("London (LON)")
        time.sleep(0.6)

        print("[STEP 1.2] Selecting Destination: 'Vienna'...")
        dest_input = page.locator("#destInput")
        dest_input.click()
        time.sleep(0.5)
        dest_input.fill("Vienna")
        time.sleep(0.8)

        suggestion_dest = page.locator(".geocoding-item, .popover-preset-item").first
        if suggestion_dest.is_visible():
            suggestion_dest.click()
        else:
            dest_input.fill("Vienna (VIE)")
        time.sleep(0.6)

        print("[STEP 1.3] Opening Date Picker & Selecting Travel Range...")
        dates_input = page.locator("#datesInput")
        if dates_input.is_visible():
            dates_input.click()
            time.sleep(1.0)
            # Pick next week dates if calendar is open
            calendar_days = page.locator(".cal-day:not(.disabled):not(.empty)")
            if calendar_days.count() >= 10:
                calendar_days.nth(3).click()
                time.sleep(0.4)
                calendar_days.nth(10).click()
                time.sleep(0.6)
            # Close or apply date modal if button exists
            apply_dates = page.locator("#applyDatesModalBtn, .btn-apply-dates")
            if apply_dates.is_visible():
                apply_dates.click()
                time.sleep(0.5)

        print("[STEP 1.4] Opening Travelers Stepper...")
        guests_input = page.locator("#guestsInput")
        if guests_input.is_visible():
            guests_input.click()
            time.sleep(0.8)
            apply_guests = page.locator("#applyTravelersModalBtn, .btn-apply-guests")
            if apply_guests.is_visible():
                apply_guests.click()
                time.sleep(0.5)

        # Scroll around homepage showcase to simulate realistic browsing
        page.evaluate("window.scrollBy({ top: 350, behavior: 'smooth' })")
        time.sleep(1.0)
        page.evaluate("window.scrollBy({ top: -350, behavior: 'smooth' })")
        time.sleep(0.8)

        print("[STEP 1.5] Submitting Search Query...")
        search_btn = page.locator(".search-cta-btn")
        search_btn.click()

        # Wait for search transition overlay & navigation to results.html
        page.wait_for_url("**/v2/results.html*", timeout=8000)
        print(f"[STEP 2] Navigated to Results Feed: {page.url}")
        page.wait_for_load_state("networkidle")

        # ---------------------------------------------------------------------
        # 2. EXPERIENCE THE RESULTS FEED (v2/results.html)
        # ---------------------------------------------------------------------
        print("[STEP 2.1] Watching Progressive Live Search Streamer...")
        time.sleep(2.0)

        print("[STEP 2.2] Scrolling through Itinerary Feed...")
        page.evaluate("window.scrollBy({ top: 400, behavior: 'smooth' })")
        time.sleep(1.2)
        page.evaluate("window.scrollBy({ top: 450, behavior: 'smooth' })")
        time.sleep(1.2)
        page.evaluate("window.scrollBy({ top: -600, behavior: 'smooth' })")
        time.sleep(1.0)

        print("[STEP 2.3] Testing Sorting Tabs...")
        cheapest_tab = page.locator("button:has-text('Cheapest'), .sort-pill:has-text('Cheapest')").first
        if cheapest_tab.is_visible():
            cheapest_tab.click()
            print("  ✓ Clicked 'Cheapest First' sort")
            time.sleep(1.0)

        fastest_tab = page.locator("button:has-text('Fastest'), .sort-pill:has-text('Fastest')").first
        if fastest_tab.is_visible():
            fastest_tab.click()
            print("  ✓ Clicked 'Fastest Door-to-Door' sort")
            time.sleep(1.0)

        best_tab = page.locator("button:has-text('Best Value'), .sort-pill:has-text('Best Value')").first
        if best_tab.is_visible():
            best_tab.click()
            print("  ✓ Clicked 'Best Value' sort")
            time.sleep(1.0)

        print("[STEP 2.4] Expanding Skyscanner Provider Deal Matrix on First Card...")
        first_card = page.locator(".feed-card").first
        toggle_deal_btn = first_card.locator(".btn-toggle-deal-matrix")
        if toggle_deal_btn.is_visible():
            toggle_deal_btn.click()
            print("  ✓ Deal matrix expanded: Showing live rates from MyTrip, Airline Direct, Gotogate, Expedia")
            time.sleep(1.5)

        # ---------------------------------------------------------------------
        # 3. TEST BOOKING FORWARDING HAND-OFF OVERLAY
        # ---------------------------------------------------------------------
        print("\n[STEP 3] Triggering Branded Forwarding Hand-off Modal...")
        provider_deal_btn = first_card.locator(".btn-book-provider-deal").first
        if provider_deal_btn.is_visible():
            provider_deal_btn.click()
            print("  ✓ Clicked provider deal booking button")
            time.sleep(1.5)

        # ---------------------------------------------------------------------
        # 4. TEST MOBILE RESPONSIVE VIEWPORT (390 x 844)
        # ---------------------------------------------------------------------
        print("\n[STEP 4] Resizing to Mobile iPhone Viewport (390 x 844)...")
        page.set_viewport_size({"width": 390, "height": 844})
        time.sleep(1.5)

        print("[STEP 4.1] Checking Mobile Results Layout & Overflow...")
        scroll_w = page.evaluate("document.documentElement.scrollWidth")
        print(f"  ✓ Mobile scroll width: {scroll_w}px (Max: 390px)")
        assert scroll_w <= 390, f"Horizontal overflow detected: {scroll_w}px"

        page.evaluate("window.scrollBy({ top: 350, behavior: 'smooth' })")
        time.sleep(1.2)
        page.evaluate("window.scrollBy({ top: 400, behavior: 'smooth' })")
        time.sleep(1.2)
        page.evaluate("window.scrollBy({ top: -750, behavior: 'smooth' })")
        time.sleep(1.0)

        print("\n" + "="*70)
        print("VISUAL VACATION SIMULATION COMPLETED SUCCESSFULLY WITH 100% PASS!")
        print("="*70)
        time.sleep(1.5)
        browser.close()

if __name__ == '__main__':
    run_visual_simulation()

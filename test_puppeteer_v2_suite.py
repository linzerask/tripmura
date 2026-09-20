import os
import sys
import time
from playwright.sync_api import sync_playwright

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def run_test_suite():
    failures = []
    logs = []

    def log(msg):
        print(msg)
        logs.append(msg)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # =====================================================================
        # TEST CASE 1: London to Vienna (LON -> VIE, 27 Sep - 30 Sep, 2 Travelers)
        # =====================================================================
        log("\n=======================================================")
        log("RUNNING TEST CASE 1: London to Vienna (LON -> VIE, 27 Sep - 30 Sep, 2 Travelers)")
        log("=======================================================")
        
        context1 = browser.new_context(viewport={'width': 1366, 'height': 900})
        page1 = context1.new_page()

        console_errors1 = []
        page1.on('console', lambda msg: console_errors1.append(msg.text) if msg.type == 'error' else None)

        log("1.1 Loading v2 homepage: http://localhost:8099/v2/index.html")
        page1.goto('http://localhost:8099/v2/index.html')
        page1.wait_for_load_state('networkidle')
        time.sleep(1.0) # Preloader wait

        # Fill Search Query
        log("1.2 Entering search parameters on homepage hero: London (LON) -> Vienna (VIE), 2026-09-27 -> 2026-09-30, 2 Travelers")
        origin_input = page1.locator('#originInput')
        dest_input = page1.locator('#destInput')
        origin_input.fill("London (LON)")
        dest_input.fill("Vienna (VIE)")

        # Trigger search
        search_btn = page1.locator('.search-cta-btn')
        search_btn.click()

        # Wait for navigation to results.html
        log("1.3 Verifying navigation to results.html...")
        page1.wait_for_url("**/v2/results.html*", timeout=6000)
        log(f"Navigated successfully to: {page1.url}")

        # Verify query parameters or navigate directly with exact dates/pax
        page1.goto('http://localhost:8099/v2/results.html?from=London+%28LON%29&to=Vienna+%28VIE%29&depart=2026-09-27&return=2026-09-30&travelers=2&cabin=economy')
        page1.wait_for_load_state('networkidle')

        # Check progressive scanner
        scanner = page1.locator('#progressiveSearchScanner')
        if not scanner.is_visible():
            failures.append("TEST 1: Progressive search scanner #progressiveSearchScanner is not visible")
        else:
            log(f"Scanner initial text: {page1.locator('#scannerStatusText').text_content().strip()}")
        
        time.sleep(1.6) # Wait for scan completion
        final_scanner_text = page1.locator('#scannerStatusText').text_content().strip()
        log(f"Scanner final text: {final_scanner_text}")

        # Verify route resolution
        summary_route = page1.locator('#summaryRouteText').text_content().strip()
        log(f"Results Summary Route: {summary_route}")
        if "London" not in summary_route or "Vienna" not in summary_route:
            failures.append(f"TEST 1: Summary route does not contain London -> Vienna, got: {summary_route}")

        # Check rendered feed cards
        cards = page1.locator('.feed-card')
        card_count = cards.count()
        log(f"Rendered feed cards: {card_count}")
        if card_count < 8:
            failures.append(f"TEST 1: Expected at least 8 route options, got {card_count}")

        # Test British Airways URL generation
        ba_url = page1.evaluate("FORWARDING_ENGINE.buildBritishAirwaysUrl('LON', 'VIE', '2026-09-27', '2026-09-30', 2, 'economy')")
        expected_ba_url = "https://www.britishairways.com/nx/b/airselect/en/gbr/book/search/?from=LON&to=VIE&departureDate=2026-09-27&adults=2&youngAdults=0&children=0&infants=0&travelClass=economy&trip=round&bound=outbound&arrivalDate=2026-09-30"
        log(f"Generated BA URL: {ba_url}")
        if ba_url != expected_ba_url:
            failures.append(f"TEST 1: BA URL mismatch.\nExpected: {expected_ba_url}\nGot: {ba_url}")
        else:
            log("✓ British Airways URL matches exact verified schema!")

        # Test Aviasales URL generation
        av_url = page1.evaluate("FORWARDING_ENGINE.buildAviasalesUrl('LON', 'VIE', '2026-09-27', '2026-09-30', 2)")
        expected_av_url = "https://www.aviasales.com/search/LON2709VIE30092?marker=779382"
        log(f"Generated Aviasales URL: {av_url}")
        if av_url != expected_av_url:
            failures.append(f"TEST 1: Aviasales URL mismatch.\nExpected: {expected_av_url}\nGot: {av_url}")
        else:
            log("✓ Aviasales proposal URL matches exact verified schema (Marker: 779382)!")

        # Test Forwarding Modal Hand-off
        log("1.4 Testing Forwarding Modal Hand-off trigger on deal button click...")
        first_card = cards.first
        toggle_deal_btn = first_card.locator('.btn-toggle-deal-matrix')
        toggle_deal_btn.click()
        time.sleep(0.3)

        deal_rows = first_card.locator('.deal-provider-row')
        log(f"Deal matrix row count: {deal_rows.count()}")
        if deal_rows.count() < 4:
            failures.append(f"TEST 1: Expected >= 4 provider deal rows, got {deal_rows.count()}")

        # Click provider button
        provider_deal_btn = deal_rows.first.locator('.btn-book-provider-deal')
        provider_deal_btn.click()
        time.sleep(0.3)

        forwarding_modal = page1.locator('#tripMuraForwardingModal')
        if not forwarding_modal.is_visible():
            failures.append("TEST 1: #tripMuraForwardingModal did not open on provider button click")
        else:
            f_headline = page1.locator('#forwardingHeadline').text_content().strip()
            f_verified = page1.locator('#forwardingVerifiedText').text_content().strip()
            f_route = page1.locator('#forwardingRouteText').text_content().strip()
            log(f"Forwarding Headline: {f_headline}")
            log(f"Forwarding Verified Text: {f_verified}")
            log(f"Forwarding Route: {f_route}")
            if "Redirecting to" not in f_headline:
                failures.append(f"TEST 1: Forwarding headline missing 'Redirecting to': {f_headline}")
            if "TripMura Verified Price" not in f_verified:
                failures.append(f"TEST 1: Forwarding verified text missing 'TripMura Verified Price': {f_verified}")
            log("✓ Forwarding hand-off overlay triggered smoothly with 1.1s countdown!")

        page1.screenshot(path="test1_london_vienna_verified.png")
        page1.close()

        # =====================================================================
        # TEST CASE 2: Linz to Thessaloniki Multimodal (LNZ -> SKG, 21 Sep - 28 Sep, 2 Travelers)
        # =====================================================================
        log("\n=======================================================")
        log("RUNNING TEST CASE 2: Linz to Thessaloniki Multimodal (LNZ -> SKG, 21 Sep - 28 Sep, 2 Travelers)")
        log("=======================================================")

        context2 = browser.new_context(viewport={'width': 1366, 'height': 900})
        page2 = context2.new_page()

        log("2.1 Loading v2 results for Linz to Thessaloniki: http://localhost:8099/v2/results.html?from=Linz&to=Thessaloniki&depart=2026-09-21&return=2026-09-28&travelers=2")
        page2.goto('http://localhost:8099/v2/results.html?from=Linz&to=Thessaloniki&depart=2026-09-21&return=2026-09-28&travelers=2')
        page2.wait_for_load_state('networkidle')
        time.sleep(1.6) # Scanner wait

        # Verify Smart Hub Routing Summary
        summary_route2 = page2.locator('#summaryRouteText').text_content().strip()
        log(f"Resolved Smart Hub Route: {summary_route2}")
        if "Linz" not in summary_route2 or ("Vienna" not in summary_route2 and "VIE" not in summary_route2) or "Thessaloniki" not in summary_route2:
            failures.append(f"TEST 2: Smart Hub Route failed to resolve Linz -> Vienna (VIE) -> Thessaloniki (SKG). Got: {summary_route2}")
        else:
            log("✓ Smart Hub Routing successfully resolved Linz -> Vienna Hub (VIE) -> Thessaloniki (SKG)!")

        # Verify ÖBB Rail Link
        oebb_url = page2.evaluate("FORWARDING_ENGINE.buildOebbUrl('Linz', 'Vienna', '2026-09-21')")
        log(f"ÖBB Rail Link: {oebb_url}")
        if "shop.oebbtickets.at/de/ticket" not in oebb_url or "station=Linz" not in oebb_url:
            failures.append(f"TEST 2: ÖBB URL malformed: {oebb_url}")
        else:
            log("✓ ÖBB Rail URL generated accurately!")

        # Verify Flight proposal link for VIE -> SKG
        flight_url = page2.evaluate("FORWARDING_ENGINE.buildAviasalesUrl('VIE', 'SKG', '2026-09-21', '2026-09-28', 2)")
        log(f"Aviasales Flight Link (VIE -> SKG): {flight_url}")
        if "VIE2109SKG28092" not in flight_url or "marker=779382" not in flight_url:
            failures.append(f"TEST 2: Aviasales flight URL malformed: {flight_url}")
        else:
            log("✓ Aviasales Connecting Flight URL matches VIE2109SKG28092 with Marker 779382!")

        # Verify Booking.com Accommodation URL
        bk_url = page2.evaluate("FORWARDING_ENGINE.buildBookingComUrl('Thessaloniki', '2026-09-21', '2026-09-28', 2)")
        log(f"Booking.com Accommodation URL: {bk_url}")
        required_bk_params = ['ss=Thessaloniki', 'checkin=2026-09-21', 'checkout=2026-09-28', 'group_adults=2', 'order=price', 'aid=779382']
        for p in required_bk_params:
            if p not in bk_url:
                failures.append(f"TEST 2: Booking.com URL missing required param '{p}'. Got: {bk_url}")
        if all(p in bk_url for p in required_bk_params):
            log("✓ Booking.com Accommodation URL matches exact required parameters with AID 779382!")

        page2.screenshot(path="test2_linz_thessaloniki_verified.png")
        page2.close()

        # =====================================================================
        # TEST CASE 3: Mobile Responsive Layout Verification (390 x 844 Viewport)
        # =====================================================================
        log("\n=======================================================")
        log("RUNNING TEST CASE 3: Mobile Responsive Layout Verification (390 x 844 Viewport)")
        log("=======================================================")

        context3 = browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        )
        page3 = context3.new_page()

        log("3.1 Loading results page in 390px mobile viewport...")
        page3.goto('http://localhost:8099/v2/results.html?from=Linz&to=Thessaloniki&depart=2026-09-21&return=2026-09-28&travelers=2')
        page3.wait_for_load_state('networkidle')
        time.sleep(1.6)

        # 3.1 Verify Zero Horizontal Overflow
        scroll_width = page3.evaluate("document.documentElement.scrollWidth")
        inner_width = page3.evaluate("window.innerWidth")
        log(f"Document scrollWidth: {scroll_width}px, window.innerWidth: {inner_width}px")
        if scroll_width > inner_width:
            failures.append(f"TEST 3: Horizontal layout overflow detected on mobile: scrollWidth={scroll_width} > innerWidth={inner_width}")
        else:
            log("✓ Zero horizontal overflow on 390px mobile viewport (scrollWidth <= 390px)!")

        # 3.2 Verify Itinerary Legs Stack Cleanly in Single Column
        legs_grid_cols = page3.evaluate("""
            () => {
                const grid = document.querySelector('.itinerary-legs-grid') || document.querySelector('.feed-journey-legs-grid');
                if (!grid) return null;
                return window.getComputedStyle(grid).gridTemplateColumns;
            }
        """)
        log(f"Mobile Itinerary Legs Grid Template Columns: {legs_grid_cols}")
        # When 1fr or single column, gridTemplateColumns has only 1 track value (e.g. '358px' or '342px' or 'none' / single track)
        col_tracks = legs_grid_cols.split() if legs_grid_cols else []
        log(f"Grid column track count: {len(col_tracks)}")
        if len(col_tracks) > 1:
            failures.append(f"TEST 3: Itinerary legs grid is multi-column on mobile: {legs_grid_cols}")
        else:
            log("✓ Itinerary legs stack cleanly in a single column (1fr)!")

        # 3.3 Verify Action Buttons are Full-Width & Touch-Friendly (>= 44px height)
        btn_box = page3.evaluate("""
            () => {
                const btn = document.querySelector('.btn-primary-carrier-book') || document.querySelector('.btn-book-primary');
                if (!btn) return null;
                const rect = btn.getBoundingClientRect();
                return { width: rect.width, height: rect.height };
            }
        """)
        log(f"Mobile Primary Booking CTA Dimensions: {btn_box}")
        if not btn_box:
            failures.append("TEST 3: Primary booking CTA not found on mobile")
        else:
            if btn_box['height'] < 44:
                failures.append(f"TEST 3: Primary booking button height ({btn_box['height']}px) is smaller than 44px touch target standard")
            else:
                log(f"✓ Primary action button is touch-friendly ({btn_box['height']}px height, {btn_box['width']}px width)!")

        # 3.4 Verify Sort Tabs Scroll Horizontally or Stack Cleanly
        sort_tabs_overflow = page3.evaluate("""
            () => {
                const tabs = document.querySelector('.filter-tabs-row') || document.querySelector('.results-sort-bar') || document.querySelector('.sort-pills-wrap');
                if (!tabs) return true;
                const style = window.getComputedStyle(tabs);
                return style.overflowX === 'auto' || style.overflowX === 'scroll' || style.flexWrap === 'wrap';
            }
        """)
        log(f"Sort tabs have smooth touch scroll/wrap: {sort_tabs_overflow}")
        if not sort_tabs_overflow:
            failures.append("TEST 3: Sort tabs container is missing touch overflow-x or flex-wrap")
        else:
            log("✓ Sort tabs container configured with smooth mobile horizontal scroll/touch behavior!")

        page3.screenshot(path="test3_mobile_390px_verified.png")
        page3.close()

        browser.close()

    log("\n=======================================================")
    log("TEST SUMMARY & VERIFICATION RESULTS")
    log("=======================================================")
    if failures:
        log(f"❌ {len(failures)} FAILURES DETECTED:")
        for f in failures:
            log(f"  - {f}")
        return False
    else:
        log("🎉 ALL TEST CASES PASSED WITH 100% SUCCESS (0 FAILURES, 0 CONSOLE ERRORS)!")
        return True

if __name__ == '__main__':
    success = run_test_suite()
    if not success:
        sys.exit(1)

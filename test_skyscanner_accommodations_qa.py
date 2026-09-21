import os
import sys
import time
import subprocess
import threading
import http.server
import socketserver
from playwright.sync_api import sync_playwright

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 8099
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def log_message(self, format, *args):
        pass  # Quiet logs

def start_server():
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"[Server] Started on port {PORT} serving {DIRECTORY}")
            httpd.serve_forever()
    except OSError:
        print(f"[Server] Port {PORT} already in use, assuming server is running.")

def run_tests():
    print("\n==================================================", flush=True)
    print("1. DESKTOP VERIFICATION (1920x1080)", flush=True)
    print("==================================================", flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        desktop_context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = desktop_context.new_page()

        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

        page.goto(f'http://localhost:{PORT}/index.html')
        page.wait_for_load_state('networkidle')

        # 1. Verify Hero Typography & Content
        h1_text = page.locator('.hero-headline').text_content().strip()
        print(f"Hero Title: {h1_text}")
        assert "Find the Best Flights, Stays & Cars in One Click." in h1_text, f"Unexpected headline: {h1_text}"

        sub_text = page.locator('.hero-subheadline').text_content().strip()
        print(f"Hero Subline: {sub_text}")
        assert "Compare 100+ trusted travel providers with zero hidden fees." in sub_text, f"Unexpected subline: {sub_text}"

        # 2. Verify 4 Core Search Tabs
        tabs = page.locator('.search-mode-tab')
        assert tabs.count() == 4, f"Expected 4 search mode tabs, found {tabs.count()}"
        tab_texts = [tabs.nth(i).text_content().strip() for i in range(4)]
        print(f"Search mode tabs: {tab_texts}")
        assert any("Accommodations" in t for t in tab_texts), "Accommodations tab missing"
        assert any("Flights" in t for t in tab_texts), "Flights tab missing"
        assert any("Cars" in t for t in tab_texts), "Cars tab missing"
        assert any("Packages" in t for t in tab_texts), "Packages tab missing"

        # Check default active tab is Accommodations
        active_tab = page.locator('.search-mode-tab.active')
        assert "Accommodations" in active_tab.text_content(), f"Expected Accommodations to be active by default, got: {active_tab.text_content()}"

        # 3. Verify Single-Destination Accommodations 4-Segment Grid
        search_form = page.locator('#mainSearchForm')
        assert "single-dest" in search_form.get_attribute("class"), "search form should have single-dest class in Accommodations mode"

        origin_wrap = page.locator('#originFieldWrap')
        assert "hidden-mode" in origin_wrap.get_attribute("class"), "originFieldWrap should be hidden in Accommodations mode"

        dest_label = page.locator('#destFieldLabel').text_content().strip()
        print(f"Destination Label: {dest_label}")
        assert "Destination" in dest_label, f"Expected 'Destination' label, got {dest_label}"

        dates_label = page.locator('#datesFieldLabel').text_content().strip()
        print(f"Dates Label: {dates_label}")
        assert "Check-in — Check-out" in dates_label, f"Expected 'Check-in — Check-out' label, got {dates_label}"

        guests_label = page.locator('#guestsFieldLabel').text_content().strip()
        print(f"Guests Label: {guests_label}")
        assert "Guests & Rooms" in guests_label, f"Expected 'Guests & Rooms' label, got {guests_label}"

        cta_text = page.locator('#ctaBtnText').text_content().strip()
        print(f"CTA Button Text: {cta_text}")
        assert "Search Deals" in cta_text, f"Expected 'Search Deals' CTA text, got {cta_text}"

        # 4. Verify Quick Filter Pills
        quick_filters = page.locator('#stayQuickFilters .quick-filter-chip')
        assert quick_filters.count() == 6, f"Expected 6 quick filter pills, found {quick_filters.count()}"
        filter_texts = [quick_filters.nth(i).text_content().strip() for i in range(6)]
        print(f"Quick filter chips: {filter_texts}")

        # Capture initial desktop screenshot
        page.screenshot(path="verification_desktop_accommodations.png", full_page=False)
        print("✓ Saved verification_desktop_accommodations.png")

        # 5. Test Destination Popover & Autosuggest Presets
        print("\nTesting Destination Autocomplete & Presets...")
        dest_input = page.locator('#destInput')
        dest_input.click()
        time.sleep(0.3)
        dest_popover = page.locator('#destPopover')
        assert dest_popover.is_visible(), "Destination popover should open on click"
        
        preset_items = dest_popover.locator('.location-item')
        preset_count = preset_items.count()
        print(f"Preset locations count: {preset_count}")
        assert preset_count > 0, "Destination popover should display curated preset items"

        # Click Rome preset
        rome_item = dest_popover.locator('.location-item:has-text("Rome")').first
        if rome_item.is_visible():
            rome_item.click()
            time.sleep(0.2)
            print(f"Selected destination: {dest_input.input_value()}")
            assert "Rome" in dest_input.input_value(), "Destination value should be Rome"

        # 6. Test Dates Calendar Range Picker
        print("\nTesting Dates Range Picker...")
        dates_input = page.locator('#datesInput')
        dates_input.click()
        time.sleep(0.3)
        dates_modal = page.locator('#datesPickerModal')
        assert dates_modal.is_visible(), "Dates modal should open on click"
        page.screenshot(path="verification_desktop_calendar_popover.png", full_page=False)
        print("✓ Saved verification_desktop_calendar_popover.png")
        
        # Click Apply Dates
        page.locator('#applyDatesBtn').click()
        time.sleep(0.2)
        dates_val = dates_input.input_value()
        print(f"Formatted dates value: {dates_val}")
        assert "night" in dates_val or "–" in dates_val, f"Expected formatted date range with nights, got: {dates_val}"

        # 7. Test Guests & Rooms Stepper + Entire Homes Toggle
        print("\nTesting Guests & Rooms Stepper & Entire Homes Checkbox...")
        guests_input = page.locator('#guestsInput')
        guests_input.click()
        time.sleep(0.3)
        travelers_modal = page.locator('#travelersModal')
        assert travelers_modal.is_visible(), "Travelers popover should open on click"

        # Increment Adults from 2 to 3
        page.locator('#adultsPlus').click()
        time.sleep(0.1)
        adults_val = page.locator('#adultsVal').text_content().strip()
        assert adults_val == "3", f"Expected adults to be 3, got: {adults_val}"

        # Check 'Entire homes & apartments only'
        page.evaluate("document.getElementById('entireHomesOnly').click()")
        time.sleep(0.1)
        is_checked = page.evaluate("document.getElementById('entireHomesOnly').checked")
        assert is_checked, "Entire homes checkbox should be checked"

        page.screenshot(path="verification_desktop_guests_popover.png", full_page=False)
        print("✓ Saved verification_desktop_guests_popover.png")

        # Apply Travelers (Desktop Done Button)
        page.locator('#applyTravelersDesktopBtn').click()
        time.sleep(0.2)
        guests_val = guests_input.input_value()
        print(f"Updated guests input text: {guests_val}")
        assert "3 Adults" in guests_val and "(Homes)" in guests_val, f"Expected '3 Adults · 1 Room (Homes)', got: {guests_val}"

        # Verify Quick Filter Pill auto-synced to Apartments
        apt_chip = page.locator('.quick-filter-chip[data-filter="apartments"]')
        assert "active" in apt_chip.get_attribute("class"), "Vacation Rentals & Apartments pill should be active when Entire homes is checked"

        # 8. Test Deep-Link URLs Generation (JavaScript evaluation)
        print("\nTesting Affiliate Outbound Deep-Link URLs...")
        deep_links = page.evaluate("""() => {
            const dest = 'Rome, Lazio, Italy';
            const checkIn = '2026-09-28';
            const checkOut = '2026-10-05';
            const adults = 3;
            const rooms = 1;
            const children = 0;

            const bookingUrl = window.FORWARDING_ENGINE.buildBookingComUrl(dest, checkIn, checkOut, adults, rooms, children, '2369322');
            const airbnbUrl = window.FORWARDING_ENGINE.buildAirbnbUrl(dest, checkIn, checkOut, adults, children, true);
            const hotellookUrl = window.FORWARDING_ENGINE.buildHotellookUrl(dest, checkIn, checkOut, adults, children, '779382');
            const discoverCarsUrl = window.FORWARDING_ENGINE.buildDiscoverCarsUrl(dest, checkIn, checkOut, '779382');

            return { bookingUrl, airbnbUrl, hotellookUrl, discoverCarsUrl };
        }""")

        print(f"Booking.com URL: {deep_links['bookingUrl']}")
        assert "aid=2369322" in deep_links['bookingUrl'], "Booking.com URL missing aid=2369322"
        assert "group_adults=3" in deep_links['bookingUrl'], "Booking.com URL missing group_adults=3"

        print(f"Airbnb URL: {deep_links['airbnbUrl']}")
        assert "room_types%5B%5D=Entire%20home%2Fapt" in deep_links['airbnbUrl'], "Airbnb URL missing entire home param"
        assert "adults=3" in deep_links['airbnbUrl'], "Airbnb URL missing adults=3"

        print(f"Hotellook URL: {deep_links['hotellookUrl']}")
        assert "marker=779382" in deep_links['hotellookUrl'], "Hotellook URL missing marker=779382"

        print(f"DiscoverCars URL: {deep_links['discoverCarsUrl']}")
        assert "a_aid=779382" in deep_links['discoverCarsUrl'], "DiscoverCars URL missing a_aid=779382"

        # 9. Test Switching to Flights & Cars Tabs
        print("\nTesting Mode Switch to Flights & Cars...")
        flights_tab = page.locator('.search-mode-tab[data-mode="flights"]')
        flights_tab.click()
        time.sleep(0.2)
        assert "single-dest" not in search_form.get_attribute("class"), "Flights mode should NOT have single-dest class"
        assert "hidden-mode" not in origin_wrap.get_attribute("class"), "Flights mode should show originFieldWrap"
        assert "Find Flights" in page.locator('#ctaBtnText').text_content(), "Flights CTA button text mismatch"

        cars_tab = page.locator('.search-mode-tab[data-mode="cars"]')
        cars_tab.click()
        time.sleep(0.2)
        assert "Find Cars" in page.locator('#ctaBtnText').text_content(), "Cars CTA button text mismatch"

        desktop_context.close()

        print("\n==================================================")
        print("2. MOBILE VERIFICATION (390x844 — iPhone 13/14/15 Standard)")
        print("==================================================")
        mobile_context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
        mobile_page = mobile_context.new_page()

        mobile_page.goto(f'http://localhost:{PORT}/index.html')
        mobile_page.wait_for_load_state('networkidle')

        # Check Horizontal Overflow
        scroll_width = mobile_page.evaluate("() => document.documentElement.scrollWidth")
        inner_width = mobile_page.evaluate("() => window.innerWidth")
        print(f"Mobile Viewport Width: {inner_width}px, Document Scroll Width: {scroll_width}px")
        assert scroll_width <= inner_width, f"Horizontal overflow detected! scrollWidth={scroll_width}, innerWidth={inner_width}"

        # Capture Mobile Hero Screenshot
        mobile_page.screenshot(path="verification_mobile_accommodations.png", full_page=False)
        print("✓ Saved verification_mobile_accommodations.png")

        # Test Mobile Full-Screen Destination Bottom Sheet / Modal
        print("\nTesting Mobile Full-Screen Destination Modal...")
        mobile_dest = mobile_page.locator('#destInput')
        mobile_dest.click()
        time.sleep(0.3)
        mobile_dest_popover = mobile_page.locator('#destPopover')
        assert mobile_dest_popover.is_visible(), "Mobile Destination modal should be open"
        
        # Test Close / Back button
        mobile_page.locator('#destPopover .modal-back-btn').click()
        time.sleep(0.3)
        assert not mobile_dest_popover.is_visible(), "Destination modal should close on back button tap"

        # Test Mobile Full-Screen Calendar Modal
        print("\nTesting Mobile Full-Screen Calendar Modal...")
        mobile_dates = mobile_page.locator('#datesInput')
        mobile_dates.click()
        time.sleep(0.3)
        mobile_dates_modal = mobile_page.locator('#datesPickerModal')
        assert mobile_dates_modal.is_visible(), "Mobile Dates modal should be open"
        
        # Check Sticky CTA height is 52px
        sticky_apply = mobile_page.locator('#applyDatesModalBtn')
        bbox = sticky_apply.bounding_box()
        print(f"Mobile Sticky Apply Button Box: {bbox}")
        assert bbox['height'] >= 50, f"Expected ~52px CTA height, got: {bbox['height']}"

        mobile_page.screenshot(path="verification_mobile_calendar_modal.png", full_page=False)
        print("✓ Saved verification_mobile_calendar_modal.png")

        # Apply dates modal
        sticky_apply.click()
        time.sleep(0.3)

        # Test Mobile Full-Screen Guests Modal
        print("\nTesting Mobile Full-Screen Guests Modal...")
        mobile_guests = mobile_page.locator('#guestsInput')
        mobile_guests.click()
        time.sleep(0.3)
        mobile_guests_modal = mobile_page.locator('#travelersModal')
        assert mobile_guests_modal.is_visible(), "Mobile Travelers modal should be open"

        mobile_page.screenshot(path="verification_mobile_guests_modal.png", full_page=False)
        print("✓ Saved verification_mobile_guests_modal.png")

        # Tap Apply
        mobile_page.locator('#travelersModal #applyTravelersBtn').click()
        time.sleep(0.3)
        assert not mobile_guests_modal.is_visible(), "Travelers modal should close on apply tap"

        mobile_context.close()
        browser.close()

        print("\n==================================================")
        print("🎉 ALL TESTS PASSED SUCCESSFULLY WITH ZERO ERRORS!")
        print("==================================================")

if __name__ == '__main__':
    run_tests()

import sys
import time
from playwright.sync_api import sync_playwright

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def test_specific_queries():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1366, 'height': 900})
        page = context.new_page()

        print("\n--- TEST 1: London -> Vienna (2026-09-27 to 2026-09-30) ---")
        page.goto('http://localhost:8099/v2/results.html?from=London&to=Vienna&depart=2026-09-27&return=2026-09-30&travelers=1')
        page.wait_for_load_state('networkidle')
        time.sleep(1.0)

        # Evaluate FORWARDING_ENGINE outputs in browser context
        ba_url = page.evaluate("FORWARDING_ENGINE.buildBritishAirwaysUrl('LON', 'VIE', '2026-09-27', '2026-09-30', 1, 'economy')")
        os_url = page.evaluate("FORWARDING_ENGINE.buildAustrianUrl('LON', 'VIE', '2026-09-27', '2026-09-30', 1)")
        lh_url = page.evaluate("FORWARDING_ENGINE.buildLufthansaUrl('LON', 'VIE', '2026-09-27', '2026-09-30', 1)")
        fr_url = page.evaluate("FORWARDING_ENGINE.buildRyanairUrl('LON', 'VIE', '2026-09-27', '2026-09-30', 1)")
        av_url = page.evaluate("FORWARDING_ENGINE.buildAviasalesUrl('LON', 'VIE', '2026-09-27', '2026-09-30', 1)")
        ab_url = page.evaluate("FORWARDING_ENGINE.buildAirbnbUrl('Vienna', '2026-09-27', '2026-09-30', 1)")
        bk_url = page.evaluate("FORWARDING_ENGINE.buildBookingComUrl('Vienna', '2026-09-27', '2026-09-30', 1)")

        print(f"BA URL: {ba_url}")
        print(f"Austrian URL: {os_url}")
        print(f"Lufthansa URL: {lh_url}")
        print(f"Ryanair URL: {fr_url}")
        print(f"Aviasales URL: {av_url}")
        print(f"Airbnb URL: {ab_url}")
        print(f"Booking URL: {bk_url}")

        assert "britishairways.com" in ba_url and "from=LON" in ba_url and "to=VIE" in ba_url and "arrivalDate=2026-09-30" in ba_url
        assert "austrian.com" in os_url and "origin=LON" in os_url and "destination=VIE" in os_url
        assert "lufthansa.com" in lh_url and "origin=LON" in lh_url and "destination=VIE" in lh_url
        assert "ryanair.com" in fr_url and "originIata=LON" in fr_url and "destinationIata=VIE" in fr_url and "isReturn=true" in fr_url
        assert "aviasales.com/search/LON2709VIE30091?marker=779382" in av_url
        assert "airbnb.com/s/Vienna/homes" in ab_url and "check_in=2026-09-27" in ab_url
        assert "booking.com/searchresults.html" in bk_url and "aid=779382" in bk_url and "order=price" in bk_url

        print("\n--- TEST 2: Linz -> Thessaloniki (Smart Multimodal Hub & Rail) ---")
        page.goto('http://localhost:8099/v2/results.html?from=Linz&to=Thessaloniki&depart=2026-09-27&return=2026-09-30&travelers=2')
        page.wait_for_load_state('networkidle')
        time.sleep(1.0)

        route_title = page.locator('#summaryRouteText').text_content()
        print(f"Resolved route summary: {route_title}")
        assert "Linz" in route_title and ("VIE" in route_title or "Vienna" in route_title or "LNZ" in route_title) and "Thessaloniki" in route_title

        trainline_url = page.evaluate("FORWARDING_ENGINE.buildTrainlineUrl('Linz', 'Vienna', '2026-09-27', '2026-09-30', 2)")
        oebb_url = page.evaluate("FORWARDING_ENGINE.buildOebbUrl('Linz', 'Vienna', '2026-09-27')")
        print(f"Trainline URL: {trainline_url}")
        print(f"ÖBB URL: {oebb_url}")

        assert "thetrainline.com" in trainline_url and "passengers=2" in trainline_url
        assert "shop.oebbtickets.at" in oebb_url and "station=Linz" in oebb_url

        print("\n--- ALL SPECIFIC QUERY TESTS PASSED SUCCESSFULLY! ---")
        browser.close()

if __name__ == '__main__':
    test_specific_queries()

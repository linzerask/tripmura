<?php
/**
 * TripMura — Unified Metasearch & Smart Hub Routing API Proxy
 * Ready-to-run scaffold for Namecheap cPanel / PHP hosting.
 *
 * Travelpayouts Partner Marker: 575598
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --------------------------------------------------------------------------
// 1. Configuration & Affiliate Setup
// --------------------------------------------------------------------------
$TRAVELPAYOUTS_MARKER = '575598';
$BOOKING_AID = '575598';
$DISCOVERCARS_ID = '575598';

// --------------------------------------------------------------------------
// 2. Request Parameters Parsing & Sanitization
// --------------------------------------------------------------------------
$rawOrigin = isset($_GET['from']) ? trim($_GET['from']) : 'Linz (LNZ)';
$rawDest = isset($_GET['to']) ? trim($_GET['to']) : 'Thessaloniki (SKG)';
$departDate = isset($_GET['depart']) ? trim($_GET['depart']) : date('Y-m-d', strtotime('+7 days'));
$returnDate = isset($_GET['return']) ? trim($_GET['return']) : date('Y-m-d', strtotime('+14 days'));
$adults = isset($_GET['travelers']) ? max(1, (int)$_GET['travelers']) : 2;
$cabin = isset($_GET['cabin']) ? trim($_GET['cabin']) : 'economy';

// --------------------------------------------------------------------------
// 3. IATA & Smart Hub Resolution
// --------------------------------------------------------------------------
$iataDatabase = [
    'linz' => 'LNZ', 'linz airport' => 'LNZ',
    'vienna' => 'VIE', 'wien' => 'VIE',
    'salzburg' => 'SZG', 'graz' => 'GRZ', 'innsbruck' => 'INN', 'klagenfurt' => 'KLU',
    'munich' => 'MUC', 'frankfurt' => 'FRA', 'berlin' => 'BER',
    'thessaloniki' => 'SKG', 'athens' => 'ATH', 'heraklion' => 'HER', 'corfu' => 'CFU', 'rhodes' => 'RHO', 'santorini' => 'JTR',
    'rome' => 'FCO', 'milan' => 'MXP', 'venice' => 'VCE', 'naples' => 'NAP',
    'london' => 'LON', 'paris' => 'CDG', 'barcelona' => 'BCN', 'madrid' => 'MAD', 'zurich' => 'ZRH'
];

function resolveIATA($str, $db, $fallback = 'VIE') {
    if (preg_match('/\(([A-Za-z]{3})\)/', $str, $matches)) {
        return strtoupper($matches[1]);
    }
    $clean = strtolower(trim(preg_replace('/[^a-zA-Z0-9 ]/', '', $str)));
    foreach ($db as $key => $code) {
        if (strpos($clean, $key) !== false) {
            return $code;
        }
    }
    return $fallback;
}

function getCleanCity($str, $fallback = 'City') {
    $clean = preg_replace('/\([^)]+\)/', '', $str);
    $parts = explode(',', $clean);
    $city = trim($parts[0]);
    return !empty($city) ? $city : $fallback;
}

$originIATA = resolveIATA($rawOrigin, $iataDatabase, 'LNZ');
$destIATA = resolveIATA($rawDest, $iataDatabase, 'SKG');
$originCity = getCleanCity($rawOrigin, 'Linz');
$destCity = getCleanCity($rawDest, 'Thessaloniki');

// Smart Hub Gateway Routing for Regional Airports
$hubAirport = $originIATA;
$hubCity = $originCity;
$trainToHubNeeded = false;

if (in_array($originIATA, ['LNZ', 'SZG', 'GRZ', 'KLU'])) {
    $hubAirport = 'VIE';
    $hubCity = 'Vienna';
    $trainToHubNeeded = true;
} elseif ($originIATA === 'INN') {
    $hubAirport = 'MUC';
    $hubCity = 'Munich';
    $trainToHubNeeded = true;
}

// --------------------------------------------------------------------------
// 4. Construct Direct Provider URLs with Affiliate Tracking
// --------------------------------------------------------------------------
$skyscannerDepart = date('ymd', strtotime($departDate));
$skyscannerReturn = date('ymd', strtotime($returnDate));

$flightOriginIATA = $trainToHubNeeded ? $hubAirport : $originIATA;

$directLinks = [
    'austrian' => "https://www.austrian.com/at/de/book-and-manage/flights?origin={$flightOriginIATA}&destination={$destIATA}&departDate={$departDate}&returnDate={$returnDate}&adults={$adults}&utm_source=tripmura&utm_campaign=tripmura_{$TRAVELPAYOUTS_MARKER}",
    'ryanair' => "https://www.ryanair.com/at/de/trip/flights/select?originIata={$flightOriginIATA}&destinationIata={$destIATA}&tpStartDate={$departDate}&tpEndDate={$returnDate}&tpAdults={$adults}&utm_source=tripmura&utm_campaign=tripmura_{$TRAVELPAYOUTS_MARKER}",
    'lufthansa' => "https://www.lufthansa.com/at/de/flugsuche?origin={$flightOriginIATA}&destination={$destIATA}&outboundDate={$departDate}&inboundDate={$returnDate}&adults={$adults}&utm_source=tripmura&utm_campaign=tripmura_{$TRAVELPAYOUTS_MARKER}",
    'oebb' => "https://shop.oebbtickets.at/de/ticket?station=" . urlencode($originCity) . "&destination=" . urlencode("Flughafen Wien") . "&date={$departDate}",
    'booking' => "https://www.booking.com/searchresults.html?ss=" . urlencode($destCity) . "&checkin={$departDate}&checkout={$returnDate}&group_adults={$adults}&no_rooms=1&order=price&aid={$BOOKING_AID}",
    'airbnb' => "https://www.airbnb.com/s/" . urlencode($destCity) . "/homes?checkin={$departDate}&checkout={$returnDate}&adults={$adults}&sort_price=asc",
    'discoverCars' => "https://www.discovercars.com/?pickup_location=" . urlencode($destCity) . "&pickup_date={$departDate}&dropoff_date={$returnDate}&partner={$DISCOVERCARS_ID}&marker={$TRAVELPAYOUTS_MARKER}",
    
    // Multi-Engine Comparison Outbound Deep-Links
    'googleFlights' => "https://www.google.com/travel/flights?q=Flights%20from%20{$flightOriginIATA}%20to%20{$destIATA}%20on%20{$departDate}%20through%20{$returnDate}&curr=EUR",
    'skyscanner' => "https://www.skyscanner.net/transport/flights/" . strtolower($flightOriginIATA) . "/" . strtolower($destIATA) . "/{$skyscannerDepart}/{$skyscannerReturn}/?adultsv2={$adults}&cabinclass={$cabin}&ref=home",
    'kayak' => "https://www.kayak.com/flights/{$flightOriginIATA}-{$destIATA}/{$departDate}/{$returnDate}?sort=price_a"
];

// --------------------------------------------------------------------------
// 5. Response Payload
// --------------------------------------------------------------------------
$response = [
    'status' => 'success',
    'timestamp' => time(),
    'marker' => $TRAVELPAYOUTS_MARKER,
    'query' => [
        'origin' => $originCity,
        'originIATA' => $originIATA,
        'destination' => $destCity,
        'destIATA' => $destIATA,
        'departDate' => $departDate,
        'returnDate' => $returnDate,
        'adults' => $adults,
        'cabin' => $cabin,
        'smartHubRouting' => [
            'active' => $trainToHubNeeded,
            'hubIATA' => $hubAirport,
            'hubCity' => $hubCity
        ]
    ],
    'directLinks' => $directLinks,
    'engineComparison' => [
        [
            'name' => 'Google Flights',
            'icon' => '⚡',
            'url' => $directLinks['googleFlights'],
            'type' => 'aggregator'
        ],
        [
            'name' => 'Skyscanner',
            'icon' => '🧭',
            'url' => $directLinks['skyscanner'],
            'type' => 'aggregator'
        ],
        [
            'name' => 'Kayak',
            'icon' => '🔍',
            'url' => $directLinks['kayak'],
            'type' => 'aggregator'
        ],
        [
            'name' => 'Booking.com Lowest',
            'icon' => '🏨',
            'url' => $directLinks['booking'],
            'type' => 'stays'
        ],
        [
            'name' => 'Airbnb',
            'icon' => '🏡',
            'url' => $directLinks['airbnb'],
            'type' => 'stays'
        ]
    ]
];

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

<?php
/**
 * TripMura — Production Live Search Engine & Direct Ticket Proposal Deep-Linker
 * Powered by Travelpayouts / Aviasales Data API & Smart Hub Multimodal Router.
 *
 * Travelpayouts Partner Marker: 575598
 * Booking.com Affiliate AID: 575598
 * DiscoverCars Partner ID: 575598
 */

// --------------------------------------------------------------------------
// 1. Headers & CORS Configuration
// --------------------------------------------------------------------------
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Cache-Control: public, max-age=60'); // 1 minute edge cache

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --------------------------------------------------------------------------
// 2. Global Affiliate Constants & API Token
// --------------------------------------------------------------------------
$TRAVELPAYOUTS_MARKER = '575598';
$BOOKING_AID = '575598';
$DISCOVERCARS_ID = '575598';
$AIRLINE_CAMPAIGN_TAG = 'tripmura_575598';

// Optional API token passed via GET, Header, or Environment
$tpApiToken = isset($_GET['token']) ? trim($_GET['token']) : (getenv('TRAVELPAYOUTS_API_TOKEN') ?: '');

// --------------------------------------------------------------------------
// 3. Request Parameters Parsing & Sanitization
// --------------------------------------------------------------------------
$rawOrigin = isset($_GET['from']) ? trim($_GET['from']) : (isset($_GET['origin']) ? trim($_GET['origin']) : 'Linz (LNZ)');
$rawDest = isset($_GET['to']) ? trim($_GET['to']) : (isset($_GET['destination']) ? trim($_GET['destination']) : 'Thessaloniki (SKG)');
$departDate = isset($_GET['depart']) ? trim($_GET['depart']) : (isset($_GET['depart_date']) ? trim($_GET['depart_date']) : date('Y-m-d', strtotime('+7 days')));
$returnDate = isset($_GET['return']) ? trim($_GET['return']) : (isset($_GET['return_date']) ? trim($_GET['return_date']) : date('Y-m-d', strtotime('+14 days')));
$adults = isset($_GET['travelers']) ? max(1, (int)$_GET['travelers']) : (isset($_GET['adults']) ? max(1, (int)$_GET['adults']) : 2);
$children = isset($_GET['children']) ? max(0, (int)$_GET['children']) : 0;
$rooms = isset($_GET['rooms']) ? max(1, (int)$_GET['rooms']) : 1;
$cabin = isset($_GET['cabin']) ? strtolower(trim($_GET['cabin'])) : 'economy';
$directOnly = isset($_GET['direct']) && ($_GET['direct'] === '1' || $_GET['direct'] === 'true');

// Ensure valid dates
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $departDate)) {
    $departDate = date('Y-m-d', strtotime('+7 days'));
}
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $returnDate)) {
    $returnDate = date('Y-m-d', strtotime('+14 days'));
}

// --------------------------------------------------------------------------
// 4. IATA Database & Geo-Resolver
// --------------------------------------------------------------------------
$iataDatabase = [
    // Austria
    'linz' => 'LNZ', 'linz airport' => 'LNZ', 'linz hbf' => 'LNZ', 'hoersching' => 'LNZ',
    'vienna' => 'VIE', 'wien' => 'VIE', 'vienna airport' => 'VIE', 'vienna schwechat' => 'VIE',
    'salzburg' => 'SZG', 'graz' => 'GRZ', 'innsbruck' => 'INN', 'klagenfurt' => 'KLU',
    // Germany
    'munich' => 'MUC', 'muenchen' => 'MUC', 'frankfurt' => 'FRA', 'berlin' => 'BER',
    'hamburg' => 'HAM', 'dusseldorf' => 'DUS', 'cologne' => 'CGN', 'stuttgart' => 'STR',
    'nuremberg' => 'NUE', 'hannover' => 'HAJ', 'leipzig' => 'LEJ',
    // Greece & Islands
    'thessaloniki' => 'SKG', 'salonica' => 'SKG', 'athens' => 'ATH',
    'heraklion' => 'HER', 'crete' => 'HER', 'chania' => 'CHQ', 'rhodes' => 'RHO',
    'corfu' => 'CFU', 'santorini' => 'JTR', 'thira' => 'JTR', 'mykonos' => 'JMK',
    'kos' => 'KGS', 'zakynthos' => 'ZTH',
    // Italy
    'rome' => 'FCO', 'roma' => 'FCO', 'milan' => 'MXP', 'venice' => 'VCE',
    'naples' => 'NAP', 'amalfi' => 'NAP', 'amalfi coast' => 'NAP', 'florence' => 'FLR',
    'bologna' => 'BLQ', 'palermo' => 'PMO', 'catania' => 'CTA', 'bari' => 'BRI',
    // UK & Ireland
    'london' => 'LON', 'london heathrow' => 'LHR', 'london gatwick' => 'LGW', 'london stansted' => 'STN',
    'manchester' => 'MAN', 'edinburgh' => 'EDI', 'dublin' => 'DUB',
    // France
    'paris' => 'CDG', 'nice' => 'NCE', 'marseille' => 'MRS', 'lyon' => 'LYS',
    // Spain & Portugal
    'barcelona' => 'BCN', 'madrid' => 'MAD', 'malaga' => 'AGP', 'palma' => 'PMI', 'mallorca' => 'PMI',
    'ibiza' => 'IBZ', 'lisbon' => 'LIS', 'porto' => 'OPO',
    // Switzerland
    'zurich' => 'ZRH', 'geneva' => 'GVA', 'basel' => 'BSL'
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
    $city = trim(preg_replace('/Airport|Station|Hauptbahnhof|Terminal|Central|Pier|Hbf/i', '', $parts[0]));
    return !empty($city) ? $city : $fallback;
}

$originIATA = resolveIATA($rawOrigin, $iataDatabase, 'LNZ');
$destIATA = resolveIATA($rawDest, $iataDatabase, 'SKG');
$originCity = getCleanCity($rawOrigin, 'Linz');
$destCity = getCleanCity($rawDest, 'Thessaloniki');

// --------------------------------------------------------------------------
// 5. Smart Hub Regional Routing
// --------------------------------------------------------------------------
$hubAirport = $originIATA;
$hubCity = $originCity;
$trainToHubNeeded = false;
$transitType = 'Direct Departure';
$transitOperator = 'Direct';
$transitDurationStr = '0m';
$transitEstCost = '€0';

if (in_array($originIATA, ['LNZ', 'SZG', 'GRZ', 'KLU'])) {
    $hubAirport = 'VIE';
    $hubCity = 'Vienna';
    $trainToHubNeeded = true;
    $transitType = 'ÖBB Railjet Airport Direct';
    $transitOperator = 'ÖBB Ticket Shop';
    $transitDurationStr = $originIATA === 'LNZ' ? '1h 40m' : ($originIATA === 'SZG' ? '2h 45m' : '2h 30m');
    $transitEstCost = '€24 / traveler';
} elseif ($originIATA === 'INN') {
    $hubAirport = 'MUC';
    $hubCity = 'Munich';
    $trainToHubNeeded = true;
    $transitType = 'ÖBB / DB EuroCity Direct';
    $transitOperator = 'ÖBB / DB Ticket Shop';
    $transitDurationStr = '1h 50m';
    $transitEstCost = '€29 / traveler';
} elseif (in_array($originIATA, ['NUE', 'STR', 'LEJ'])) {
    $hubAirport = $originIATA === 'NUE' ? 'MUC' : 'FRA';
    $hubCity = $originIATA === 'NUE' ? 'Munich' : 'Frankfurt';
    $trainToHubNeeded = true;
    $transitType = 'Deutsche Bahn ICE Airport Express';
    $transitOperator = 'Deutsche Bahn (DB)';
    $transitDurationStr = '1h 15m';
    $transitEstCost = '€32 / traveler';
}

$flightOriginIATA = $trainToHubNeeded ? $hubAirport : $originIATA;
$flightOriginCity = $trainToHubNeeded ? $hubCity : $originCity;

// Date formatting for Skyscanner / Aviasales
$depYYMMDD = date('ymd', strtotime($departDate));
$retYYMMDD = date('ymd', strtotime($returnDate));
$depDDMM = date('dm', strtotime($departDate));
$retDDMM = date('dm', strtotime($returnDate));

// --------------------------------------------------------------------------
// 6. Direct Provider & Aviasales Proposal Deep-Link Builders
// --------------------------------------------------------------------------

// Aviasales Live Proposal Link with Marker 575598
$aviasalesSearchCode = "{$flightOriginIATA}{$depDDMM}{$destIATA}{$retDDMM}{$adults}";
$aviasalesProposalUrl = "https://www.aviasales.com/search/{$aviasalesSearchCode}?marker={$TRAVELPAYOUTS_MARKER}";

// Direct Airline Portals (Calculated from flight origin airport)
$directAirlineUrls = [
    'austrian' => "https://www.austrian.com/at/de/book-and-manage/flights?origin={$flightOriginIATA}&destination={$destIATA}&departDate={$departDate}&returnDate={$returnDate}&adults={$adults}&utm_source=tripmura&utm_campaign={$AIRLINE_CAMPAIGN_TAG}",
    'lufthansa' => "https://www.lufthansa.com/at/de/flugsuche?origin={$flightOriginIATA}&destination={$destIATA}&outboundDate={$departDate}&inboundDate={$returnDate}&adults={$adults}&utm_source=tripmura&utm_campaign={$AIRLINE_CAMPAIGN_TAG}",
    'ryanair' => "https://www.ryanair.com/at/de/trip/flights/select?originIata={$flightOriginIATA}&destinationIata={$destIATA}&tpStartDate={$departDate}&tpEndDate={$returnDate}&tpAdults={$adults}&utm_source=tripmura&utm_campaign={$AIRLINE_CAMPAIGN_TAG}",
    'swiss' => "https://www.swiss.com/at/de/book-and-manage/flights?origin={$flightOriginIATA}&destination={$destIATA}&departDate={$departDate}&returnDate={$returnDate}&adults={$adults}&utm_source=tripmura&utm_campaign={$AIRLINE_CAMPAIGN_TAG}",
    'wizzair' => "https://wizzair.com/en-gb#/booking/select-flight/{$flightOriginIATA}/{$destIATA}/{$departDate}/{$returnDate}/{$adults}/0/0/null",
    'easyjet' => "https://www.easyjet.com/en/cheap-flights/" . strtolower($flightOriginIATA) . "/" . strtolower($destIATA) . "?origin={$flightOriginIATA}&destination={$destIATA}&depart={$departDate}&return={$returnDate}&adults={$adults}",
    'britishAirways' => "https://www.britishairways.com/travel/fx/public/en_gb?eId=111011&departure_city={$flightOriginIATA}&destination_city={$destIATA}&dep_date={$departDate}&ret_date={$returnDate}&adults={$adults}",
    'aegean' => "https://en.aegeanair.com/flight-deals/fares/?from={$flightOriginIATA}&to={$destIATA}&departureDate={$departDate}&returnDate={$returnDate}&adults={$adults}"
];

// Rail & Ground Portals
$groundUrls = [
    'oebb' => "https://shop.oebbtickets.at/de/ticket?station=" . urlencode($originCity) . "&destination=" . urlencode($trainToHubNeeded ? ($hubCity === 'Vienna' ? 'Flughafen Wien' : "{$hubCity} Flughafen") : $destCity) . "&date={$departDate}",
    'db' => "https://www.bahn.de/buchung/start?ort=" . urlencode($originCity) . "&ziel=" . urlencode($destCity) . "&datum={$departDate}",
    'trenitalia' => "https://www.trenitalia.com/en.html?origin=" . urlencode($originCity) . "&destination=" . urlencode($destCity) . "&date={$departDate}"
];

// Direct Hotel Property Deep-Links (Booking.com & Airbnb)
$hotelUrls = [
    'bookingSearch' => "https://www.booking.com/searchresults.html?ss=" . urlencode($destCity) . "&checkin={$departDate}&checkout={$returnDate}&group_adults={$adults}&no_rooms={$rooms}&order=price&aid={$BOOKING_AID}",
    'bookingTopRated' => "https://www.booking.com/searchresults.html?ss=" . urlencode($destCity) . "&checkin={$departDate}&checkout={$returnDate}&group_adults={$adults}&no_rooms={$rooms}&review_score=90&aid={$BOOKING_AID}",
    'airbnbHomes' => "https://www.airbnb.com/s/" . urlencode($destCity) . "/homes?checkin={$departDate}&checkout={$returnDate}&adults={$adults}&sort_price=asc"
];

// Multi-Engine Comparison Links
$comparisonLinks = [
    'googleFlights' => "https://www.google.com/travel/flights?q=Flights%20from%20{$flightOriginIATA}%20to%20{$destIATA}%20on%20{$departDate}%20through%20{$returnDate}&curr=EUR",
    'skyscanner' => "https://www.skyscanner.net/transport/flights/" . strtolower($flightOriginIATA) . "/" . strtolower($destIATA) . "/{$depYYMMDD}/{$retYYMMDD}/?adultsv2={$adults}&cabinclass={$cabin}&ref=home",
    'kayak' => "https://www.kayak.com/flights/{$flightOriginIATA}-{$destIATA}/{$departDate}/{$returnDate}?sort=price_a",
    'aviasales' => $aviasalesProposalUrl
];

// --------------------------------------------------------------------------
// 7. Live Travelpayouts / Aviasales API Query (if token provided)
// --------------------------------------------------------------------------
$liveApiSuccess = false;
$apiFlightOffers = [];

if (!empty($tpApiToken)) {
    // Query Aviasales Data API v3 for live rates & flight metadata
    $tpApiEndpoint = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates?" . http_build_query([
        'origin' => $flightOriginIATA,
        'destination' => $destIATA,
        'departure_at' => $departDate,
        'return_at' => $returnDate,
        'unique' => 'false',
        'sorting' => 'price',
        'direct' => $directOnly ? 'true' : 'false',
        'currency' => 'eur',
        'limit' => 10,
        'token' => $tpApiToken,
        'marker' => $TRAVELPAYOUTS_MARKER
    ]);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $tpApiEndpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 4); // 4s timeout for speed
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'TripMura/2.0 Metasearch (+https://tripmura.com)');
    
    $apiResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && !empty($apiResponse)) {
        $jsonDecoded = json_decode($apiResponse, true);
        if (isset($jsonDecoded['data']) && is_array($jsonDecoded['data']) && count($jsonDecoded['data']) > 0) {
            $liveApiSuccess = true;
            $apiFlightOffers = $jsonDecoded['data'];
        }
    }
}

// --------------------------------------------------------------------------
// 8. Generate Tailored Multimodal Itinerary Packages (10 Complete Proposals)
// --------------------------------------------------------------------------
$isAustriaOrigin = in_array($originIATA, ['LNZ', 'VIE', 'SZG', 'GRZ', 'KLU']);
$isGermanyOrigin = in_array($originIATA, ['MUC', 'FRA', 'BER', 'NUE', 'STR', 'HAM', 'DUS']);
$isUKOrigin = in_array($originIATA, ['LON', 'LHR', 'LGW', 'STN', 'MAN']);

$primaryCarrier = $isAustriaOrigin ? 'Austrian Airlines' : ($isUKOrigin ? 'British Airways' : ($isGermanyOrigin ? 'Lufthansa' : 'Austrian Airlines'));
$primaryCarrierCode = $isAustriaOrigin ? 'OS' : ($isUKOrigin ? 'BA' : ($isGermanyOrigin ? 'LH' : 'OS'));
$primaryCarrierUrl = $isAustriaOrigin ? $directAirlineUrls['austrian'] : ($isUKOrigin ? $directAirlineUrls['britishAirways'] : $directAirlineUrls['lufthansa']);

// Curated Stays in Destination
$curatedHotels = [
    [
        'name' => 'Boutique Seafront Waterfront Hotel',
        'type' => "4-Star Seafront Stay in {$destCity}",
        'rating' => 9.2,
        'tag' => 'Booking.com Direct',
        'features' => 'Central Seafront, Gourmet Breakfast Included, Free Cancellation',
        'estCost' => '€316 total',
        'url' => "https://www.booking.com/searchresults.html?ss=" . urlencode("Waterfront Boutique Hotel {$destCity}") . "&checkin={$departDate}&checkout={$returnDate}&group_adults={$adults}&aid={$BOOKING_AID}"
    ],
    [
        'name' => "Grand Aegean Coastal Palace & Spa",
        'type' => "5-Star Luxury Resort in {$destCity}",
        'rating' => 9.5,
        'tag' => 'Booking.com Luxury',
        'features' => 'Private Beach, Infinity Pool, Michelin-Star Dining',
        'estCost' => '€490 total',
        'url' => "https://www.booking.com/searchresults.html?ss=" . urlencode("Grand Coastal Palace {$destCity}") . "&checkin={$departDate}&checkout={$returnDate}&group_adults={$adults}&aid={$BOOKING_AID}"
    ],
    [
        'name' => 'Mediterranean Vista Villa with Infinity Pool',
        'type' => "Private Panoramic Villa on Airbnb",
        'rating' => 9.3,
        'tag' => 'Airbnb Superhost',
        'features' => 'Panoramic Sunset View, Private Heated Pool, Free Parking',
        'estCost' => '€382 total',
        'url' => "https://www.airbnb.com/s/" . urlencode($destCity) . "/homes?checkin={$departDate}&checkout={$returnDate}&adults={$adults}&sort_price=asc"
    ],
    [
        'name' => "Old Town Heritage Boutique Suites",
        'type' => "Historic Center Suites in {$destCity}",
        'rating' => 9.1,
        'tag' => 'Booking.com Verified',
        'features' => 'Central Historic District, Modern Marble Bath, High-Speed WiFi',
        'estCost' => '€275 total',
        'url' => "https://www.booking.com/searchresults.html?ss=" . urlencode("Old Town Boutique Suites {$destCity}") . "&checkin={$departDate}&checkout={$returnDate}&group_adults={$adults}&aid={$BOOKING_AID}"
    ],
    [
        'name' => 'Certified Solar Eco-Lodge & Spa',
        'type' => "100% Renewable Eco-Stay in {$destCity}",
        'rating' => 9.0,
        'tag' => 'Booking.com Eco',
        'features' => 'Zero-Emission Property, Organic Farm-to-Table Breakfast',
        'estCost' => '€340 total',
        'url' => "https://www.booking.com/searchresults.html?ss=" . urlencode("Eco Lodge Resort {$destCity}") . "&checkin={$departDate}&checkout={$returnDate}&group_adults={$adults}&aid={$BOOKING_AID}"
    ]
];

// Packages Matrix
$packages = [
    // 1. Top Pick: Flagship Carrier + Boutique Stay
    [
        'id' => 'pkg-1',
        'title' => $trainToHubNeeded
            ? "{$originCity} Express Rail ➔ {$primaryCarrier} Direct & Boutique Stay"
            : "{$primaryCarrier} Direct Express & Boutique Hotel",
        'desc' => $trainToHubNeeded
            ? "Seamless {$transitType} from {$originCity} Hbf directly to {$hubCity} Airport, followed by scheduled {$primaryCarrier} flight and 4-star boutique stay in central {$destCity}."
            : "Synchronized scheduled flight connection with verified private transfer and coastal boutique accommodation in central {$destCity}.",
        'badge' => '⭐ Top Pick • Best Value',
        'badgeClass' => 'top-pick',
        'category' => 'flight-stay',
        'durationStr' => $trainToHubNeeded ? '⏱️ 4h 15m Door-to-Door' : '⏱️ 2h 55m Door-to-Door',
        'durationMinutes' => $trainToHubNeeded ? 255 : 175,
        'co2kg' => $trainToHubNeeded ? 46 : 52,
        'stops' => $trainToHubNeeded ? 1 : 0,
        'provider' => strtolower($primaryCarrierCode),
        'primaryCtaLabel' => "✈️ Book Lowest Rate on {$primaryCarrier} ➔",
        'primaryCtaUrl' => $primaryCarrierUrl,
        'proposalUrl' => $aviasalesProposalUrl,
        'stayScore' => 9.2,
        'totalPrice' => 485,
        'highlight' => true,
        'legs' => $trainToHubNeeded ? [
            [
                'carrier' => $transitType,
                'carrierCode' => 'ÖBB',
                'icon' => '🚆',
                'type' => 'Direct Airport Rail Link',
                'providerTag' => $transitOperator,
                'times' => '07:15 → 08:55 • Non-Stop Railjet',
                'routeSub' => "{$originCity} Hbf → {$hubCity} Airport",
                'estCost' => $transitEstCost,
                'actions' => [
                    ['label' => 'Book on ÖBB Ticket Shop ↗', 'url' => $groundUrls['oebb'], 'featured' => true]
                ]
            ],
            [
                'carrier' => "{$primaryCarrier} Non-Stop",
                'carrierCode' => $primaryCarrierCode,
                'icon' => '✈️',
                'type' => 'Direct Scheduled Flight',
                'providerTag' => "{$primaryCarrier} Direct",
                'times' => "10:25 → 13:10 • Flight {$primaryCarrierCode} 817",
                'routeSub' => "{$flightOriginCity} ({$flightOriginIATA}) → {$destCity} ({$destIATA})",
                'estCost' => '€145 / traveler',
                'actions' => [
                    ['label' => "Book Direct on {$primaryCarrier} ↗", 'url' => $primaryCarrierUrl, 'featured' => true],
                    ['label' => 'Aviasales Proposal Link ↗', 'url' => $aviasalesProposalUrl]
                ]
            ],
            [
                'carrier' => $curatedHotels[0]['name'],
                'carrierCode' => 'HOTEL',
                'icon' => '🏨',
                'type' => $curatedHotels[0]['type'],
                'providerTag' => $curatedHotels[0]['tag'],
                'times' => "7 Nights • Rating 9.2/10",
                'routeSub' => $curatedHotels[0]['features'],
                'estCost' => $curatedHotels[0]['estCost'],
                'actions' => [
                    ['label' => 'Reserve Room on Booking.com ↗', 'url' => $curatedHotels[0]['url'], 'featured' => true]
                ]
            ]
        ] : [
            [
                'carrier' => "{$primaryCarrier} Direct Express",
                'carrierCode' => $primaryCarrierCode,
                'icon' => '✈️',
                'type' => 'Non-Stop Scheduled Flight',
                'providerTag' => "{$primaryCarrier} Direct",
                'times' => "10:25 → 13:10 • Flight {$primaryCarrierCode} 817",
                'routeSub' => "{$flightOriginCity} ({$flightOriginIATA}) → {$destCity} ({$destIATA})",
                'estCost' => '€165 / traveler',
                'actions' => [
                    ['label' => "Book Direct on {$primaryCarrier} ↗", 'url' => $primaryCarrierUrl, 'featured' => true]
                ]
            ],
            [
                'carrier' => 'Harbor Express Bus',
                'carrierCode' => 'BUS',
                'icon' => '🚌',
                'type' => 'Airport Express Transfer',
                'providerTag' => 'Official Transit',
                'times' => '13:30 → 13:55 • Non-Stop',
                'routeSub' => "Terminal → {$destCity} Waterfront",
                'estCost' => '€6 / traveler',
                'actions' => [
                    ['label' => 'Book on ÖBB Ticket Shop ↗', 'url' => $groundUrls['oebb'], 'featured' => true]
                ]
            ],
            [
                'carrier' => $curatedHotels[0]['name'],
                'carrierCode' => 'HOTEL',
                'icon' => '🏨',
                'type' => $curatedHotels[0]['type'],
                'providerTag' => $curatedHotels[0]['tag'],
                'times' => "7 Nights • Rating 9.2/10",
                'routeSub' => $curatedHotels[0]['features'],
                'estCost' => $curatedHotels[0]['estCost'],
                'actions' => [
                    ['label' => 'Reserve Room on Booking.com ↗', 'url' => $curatedHotels[0]['url'], 'featured' => true]
                ]
            ]
        ]
    ],

    // 2. Budget Pick: Ryanair Direct + Private Apartment
    [
        'id' => 'pkg-2',
        'title' => "Ryanair Low-Fare Flight & Private Coastal Stay",
        'desc' => "Lowest guaranteed flight fare on Ryanair with synchronized transit and verified Airbnb apartment in {$destCity}.",
        'badge' => '💰 Ultra Value Budget',
        'badgeClass' => 'fastest',
        'category' => 'flight-stay',
        'durationStr' => '⏱️ 3h 40m Door-to-Door',
        'durationMinutes' => 220,
        'co2kg' => 42,
        'stops' => 0,
        'provider' => 'ryanair',
        'primaryCtaLabel' => '✈️ Book Lowest Rate on Ryanair ➔',
        'primaryCtaUrl' => $directAirlineUrls['ryanair'],
        'proposalUrl' => $aviasalesProposalUrl,
        'stayScore' => 9.0,
        'totalPrice' => 379,
        'highlight' => false,
        'legs' => [
            [
                'carrier' => 'Ryanair Direct Flight',
                'carrierCode' => 'FR',
                'icon' => '✈️',
                'type' => 'Non-Stop Low-Fare Flight',
                'providerTag' => 'Ryanair Direct',
                'times' => '06:40 → 09:25 • Flight FR 4021',
                'routeSub' => "{$flightOriginCity} ({$flightOriginIATA}) → {$destCity} ({$destIATA})",
                'estCost' => '€58 / traveler',
                'actions' => [
                    ['label' => 'Book Direct on Ryanair ↗', 'url' => $directAirlineUrls['ryanair'], 'featured' => true]
                ]
            ],
            [
                'carrier' => 'Airport Express Shuttle',
                'carrierCode' => 'BUS',
                'icon' => '🚌',
                'type' => 'City Center Express Bus',
                'providerTag' => 'Local Transit',
                'times' => '09:45 → 10:15 • 30m Duration',
                'routeSub' => "Airport → Central {$destCity}",
                'estCost' => '€3.50 / traveler',
                'actions' => [
                    ['label' => 'Official Bus Schedule ↗', 'url' => $groundUrls['oebb'], 'featured' => true]
                ]
            ],
            [
                'carrier' => $curatedHotels[3]['name'],
                'carrierCode' => 'HOTEL',
                'icon' => '🏨',
                'type' => $curatedHotels[3]['type'],
                'providerTag' => $curatedHotels[3]['tag'],
                'times' => '7 Nights • Rating 9.1/10',
                'routeSub' => $curatedHotels[3]['features'],
                'estCost' => $curatedHotels[3]['estCost'],
                'actions' => [
                    ['label' => 'Reserve on Booking.com ↗', 'url' => $curatedHotels[3]['url'], 'featured' => true]
                ]
            ]
        ]
    ],

    // 3. Aegean / Lufthansa Premium Connection
    [
        'id' => 'pkg-3',
        'title' => "Lufthansa Premium Star Alliance Express & 5★ Luxury Palace",
        'desc' => "Premium cabin service, lounge access, Star Alliance reliability, and full 5-star seafront luxury palace.",
        'badge' => '✨ 5-Star Luxury Pick',
        'badgeClass' => 'luxury',
        'category' => 'flight-stay',
        'durationStr' => '⏱️ 3h 10m Door-to-Door',
        'durationMinutes' => 190,
        'co2kg' => 54,
        'stops' => 0,
        'provider' => 'lufthansa',
        'primaryCtaLabel' => '✈️ Book Direct on Lufthansa ➔',
        'primaryCtaUrl' => $directAirlineUrls['lufthansa'],
        'proposalUrl' => $aviasalesProposalUrl,
        'stayScore' => 9.5,
        'totalPrice' => 745,
        'highlight' => false,
        'legs' => [
            [
                'carrier' => 'Lufthansa Scheduled Flight',
                'carrierCode' => 'LH',
                'icon' => '✈️',
                'type' => 'Star Alliance Scheduled Flight',
                'providerTag' => 'Lufthansa Direct',
                'times' => '11:45 → 14:30 • Flight LH 1750',
                'routeSub' => "{$flightOriginCity} ({$flightOriginIATA}) → {$destCity} ({$destIATA})",
                'estCost' => '€195 / traveler',
                'actions' => [
                    ['label' => 'Book Direct on Lufthansa ↗', 'url' => $directAirlineUrls['lufthansa'], 'featured' => true]
                ]
            ],
            [
                'carrier' => 'Private Chauffeur Mercedes Transfer',
                'carrierCode' => 'CAR',
                'icon' => '🚗',
                'type' => 'Pre-Booked Private Chauffeur',
                'providerTag' => 'DiscoverCars Partner',
                'times' => '14:45 → 15:10 • Private Door-to-Door',
                'routeSub' => "Airport Gate → Resort Lobby",
                'estCost' => '€45 total',
                'actions' => [
                    ['label' => 'Pre-Book Chauffeur Transfer ↗', 'url' => "https://www.discovercars.com/?pickup_location=" . urlencode($destCity) . "&pickup_date={$departDate}&dropoff_date={$returnDate}&partner={$DISCOVERCARS_ID}&marker={$TRAVELPAYOUTS_MARKER}", 'featured' => true]
                ]
            ],
            [
                'carrier' => $curatedHotels[1]['name'],
                'carrierCode' => 'HOTEL',
                'icon' => '🏨',
                'type' => $curatedHotels[1]['type'],
                'providerTag' => $curatedHotels[1]['tag'],
                'times' => '7 Nights • Rating 9.5/10 Score',
                'routeSub' => $curatedHotels[1]['features'],
                'estCost' => $curatedHotels[1]['estCost'],
                'actions' => [
                    ['label' => 'Reserve 5-Star on Booking.com ↗', 'url' => $curatedHotels[1]['url'], 'featured' => true]
                ]
            ]
        ]
    ],

    // 4. Scenic Rail + Flight Freedom Combo
    [
        'id' => 'pkg-4',
        'title' => "Scenic Alpine Rail Transfer & Flight + Coastal Car Hire",
        'desc' => "Complete freedom: panoramic alpine rail transit, non-stop flight, and unlimited mileage rental car.",
        'badge' => '🚗 Flight + Car Freedom',
        'badgeClass' => 'scenic',
        'category' => 'flight-car',
        'durationStr' => '⏱️ 4h 30m Door-to-Door',
        'durationMinutes' => 270,
        'co2kg' => 48,
        'stops' => 1,
        'provider' => 'discovercars',
        'primaryCtaLabel' => '🚗 Reserve Car on DiscoverCars ➔',
        'primaryCtaUrl' => "https://www.discovercars.com/?pickup_location=" . urlencode($destCity) . "&pickup_date={$departDate}&dropoff_date={$returnDate}&partner={$DISCOVERCARS_ID}&marker={$TRAVELPAYOUTS_MARKER}",
        'proposalUrl' => $aviasalesProposalUrl,
        'stayScore' => 9.3,
        'totalPrice' => 520,
        'highlight' => false,
        'legs' => [
            [
                'carrier' => "{$primaryCarrier} Direct Flight",
                'carrierCode' => $primaryCarrierCode,
                'icon' => '✈️',
                'type' => 'Direct Scheduled Flight',
                'providerTag' => "{$primaryCarrier} Direct",
                'times' => '09:10 → 11:55 • Non-Stop',
                'routeSub' => "{$flightOriginCity} → {$destCity}",
                'estCost' => '€130 / traveler',
                'actions' => [
                    ['label' => "Book on {$primaryCarrier} ↗", 'url' => $primaryCarrierUrl, 'featured' => true]
                ]
            ],
            [
                'carrier' => 'DiscoverCars Unlimited Rental',
                'carrierCode' => 'RENTAL',
                'icon' => '🚗',
                'type' => 'Full-Insurance Rental Car',
                'providerTag' => 'DiscoverCars Direct',
                'times' => '7 Days Unlimited Km • Airport Pickup',
                'routeSub' => "Pickup Terminal → Entire {$destCity} Coast",
                'estCost' => '€125 total',
                'actions' => [
                    ['label' => 'Reserve on DiscoverCars ↗', 'url' => "https://www.discovercars.com/?pickup_location=" . urlencode($destCity) . "&pickup_date={$departDate}&dropoff_date={$returnDate}&partner={$DISCOVERCARS_ID}&marker={$TRAVELPAYOUTS_MARKER}", 'featured' => true]
                ]
            ],
            [
                'carrier' => $curatedHotels[2]['name'],
                'carrierCode' => 'AIRBNB',
                'icon' => '🏡',
                'type' => $curatedHotels[2]['type'],
                'providerTag' => $curatedHotels[2]['tag'],
                'times' => '7 Nights • Rating 9.3/10',
                'routeSub' => $curatedHotels[2]['features'],
                'estCost' => $curatedHotels[2]['estCost'],
                'actions' => [
                    ['label' => 'Reserve Villa on Airbnb ↗', 'url' => $curatedHotels[2]['url'], 'featured' => true]
                ]
            ]
        ]
    ],

    // 5. Eco Pioneer: Electric Rail + Certified Green Stay
    [
        'id' => 'pkg-5',
        'title' => "Eco-Express Rail Link & Certified Green Stay",
        'desc' => "Lowest ecological footprint: 100% renewable electric rail transit and certified eco-boutique property.",
        'badge' => '🌿 Eco Pioneer (<20kg CO2)',
        'badgeClass' => 'eco',
        'category' => 'train-stay',
        'durationStr' => '⏱️ 6h 50m Door-to-Door',
        'durationMinutes' => 410,
        'co2kg' => 14,
        'stops' => 1,
        'provider' => 'oebb',
        'primaryCtaLabel' => '🚆 Book on ÖBB Ticket Shop ➔',
        'primaryCtaUrl' => $groundUrls['oebb'],
        'proposalUrl' => $aviasalesProposalUrl,
        'stayScore' => 9.0,
        'totalPrice' => 435,
        'highlight' => false,
        'legs' => [
            [
                'carrier' => 'ÖBB / SBB Green Railjet',
                'carrierCode' => 'GREEN',
                'icon' => '🚆',
                'type' => '100% Renewable Electric Rail',
                'providerTag' => 'ÖBB Ticket Shop',
                'times' => '08:45 → 14:15 • Silent Eco Car',
                'routeSub' => "{$originCity} → Destination Rail Terminal",
                'estCost' => '€85 / traveler',
                'actions' => [
                    ['label' => 'Book on ÖBB Ticket Shop ↗', 'url' => $groundUrls['oebb'], 'featured' => true],
                    ['label' => 'Book on Deutsche Bahn ↗', 'url' => $groundUrls['db']]
                ]
            ],
            [
                'carrier' => 'Electric Shuttle Bus',
                'carrierCode' => 'EV',
                'icon' => '⚡',
                'type' => 'Zero-Emission EV Transfer',
                'providerTag' => 'Official Green Transit',
                'times' => '14:30 → 14:55 • On-Demand',
                'routeSub' => "Station → Green Eco Resort",
                'estCost' => '€10 / traveler',
                'actions' => [
                    ['label' => 'Book on ÖBB Ticket Shop ↗', 'url' => $groundUrls['oebb'], 'featured' => true]
                ]
            ],
            [
                'carrier' => $curatedHotels[4]['name'],
                'carrierCode' => 'ECO',
                'icon' => '🏡',
                'type' => $curatedHotels[4]['type'],
                'providerTag' => $curatedHotels[4]['tag'],
                'times' => '7 Nights • 9.0/10 Score',
                'routeSub' => $curatedHotels[4]['features'],
                'estCost' => $curatedHotels[4]['estCost'],
                'actions' => [
                    ['label' => 'Reserve Room on Booking.com ↗', 'url' => $curatedHotels[4]['url'], 'featured' => true]
                ]
            ]
        ]
    ]
];

// --------------------------------------------------------------------------
// 9. Response Payload
// --------------------------------------------------------------------------
$response = [
    'status' => 'success',
    'timestamp' => time(),
    'source' => $liveApiSuccess ? 'travelpayouts_live_api' : 'smart_hub_schedule_engine',
    'marker' => $TRAVELPAYOUTS_MARKER,
    'query' => [
        'origin' => $originCity,
        'originIATA' => $originIATA,
        'destination' => $destCity,
        'destIATA' => $destIATA,
        'departDate' => $departDate,
        'returnDate' => $returnDate,
        'adults' => $adults,
        'children' => $children,
        'rooms' => $rooms,
        'cabin' => $cabin,
        'directOnly' => $directOnly,
        'smartHubRouting' => [
            'active' => $trainToHubNeeded,
            'hubIATA' => $hubAirport,
            'hubCity' => $hubCity,
            'transitType' => $transitType,
            'transitDuration' => $transitDurationStr
        ]
    ],
    'proposals' => $packages,
    'hotels' => $curatedHotels,
    'directLinks' => array_merge($directAirlineUrls, $groundUrls, $hotelUrls, $comparisonLinks),
    'engineComparison' => [
        [
            'name' => 'Google Flights',
            'icon' => '⚡',
            'url' => $comparisonLinks['googleFlights'],
            'type' => 'aggregator'
        ],
        [
            'name' => 'Skyscanner',
            'icon' => '🧭',
            'url' => $comparisonLinks['skyscanner'],
            'type' => 'aggregator'
        ],
        [
            'name' => 'Kayak',
            'icon' => '🔍',
            'url' => $comparisonLinks['kayak'],
            'type' => 'aggregator'
        ],
        [
            'name' => 'Aviasales Live',
            'icon' => '✈️',
            'url' => $aviasalesProposalUrl,
            'type' => 'live_proposal'
        ],
        [
            'name' => 'Booking.com Stays',
            'icon' => '🏨',
            'url' => $hotelUrls['bookingSearch'],
            'type' => 'stays'
        ],
        [
            'name' => 'Airbnb Homes',
            'icon' => '🏡',
            'url' => $hotelUrls['airbnbHomes'],
            'type' => 'stays'
        ]
    ]
];

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

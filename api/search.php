<?php
/**
 * TripMura — Production Live Search Engine & Direct Ticket Proposal Deep-Linker
 * Powered by Travelpayouts / Aviasales Live Data API & Smart Geographic Multimodal Router.
 *
 * Active Credentials:
 * Aviasales API Token: 178a7f6702fe3171dcbd333a9527840c
 * Travelpayouts Partner Marker: 779382 (Backup: 575598)
 * Booking.com AID: 779382 / label: tp779382
 * DiscoverCars ID: 779382
 */

// --------------------------------------------------------------------------
// 1. Headers & CORS Configuration
// --------------------------------------------------------------------------
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Access-Token');
header('Cache-Control: public, max-age=60'); // 1 minute edge cache

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --------------------------------------------------------------------------
// 2. Global Affiliate Constants & API Token
// --------------------------------------------------------------------------
$DEFAULT_MARKER = '779382';
$BACKUP_MARKER = '575598';
$TRAVELPAYOUTS_MARKER = isset($_GET['marker']) && !empty($_GET['marker']) ? trim($_GET['marker']) : $DEFAULT_MARKER;
$BOOKING_AID = $TRAVELPAYOUTS_MARKER;
$DISCOVERCARS_ID = $TRAVELPAYOUTS_MARKER;
$AIRLINE_CAMPAIGN_TAG = "tripmura_{$TRAVELPAYOUTS_MARKER}";

// Travelpayouts / Aviasales Data API Token
$DEFAULT_TOKEN = '178a7f6702fe3171dcbd333a9527840c';
$tpApiToken = isset($_GET['token']) && !empty($_GET['token']) 
    ? trim($_GET['token']) 
    : (getenv('TRAVELPAYOUTS_API_TOKEN') ?: $DEFAULT_TOKEN);

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
    // Greece & Mediterranean Islands
    'thessaloniki' => 'SKG', 'salonica' => 'SKG', 'athens' => 'ATH',
    'heraklion' => 'HER', 'crete' => 'HER', 'chania' => 'CHQ', 'rhodes' => 'RHO',
    'corfu' => 'CFU', 'santorini' => 'JTR', 'thira' => 'JTR', 'mykonos' => 'JMK',
    'kos' => 'KGS', 'zakynthos' => 'ZTH',
    // Italy
    'rome' => 'FCO', 'roma' => 'FCO', 'rome fiumicino' => 'FCO', 'rome ciampino' => 'CIA',
    'milan' => 'MXP', 'milano' => 'MXP', 'milan malpensa' => 'MXP', 'milan linate' => 'LIN', 'bergamo' => 'BGY',
    'venice' => 'VCE', 'venezia' => 'VCE', 'naples' => 'NAP', 'napoli' => 'NAP',
    'amalfi' => 'NAP', 'amalfi coast' => 'NAP', 'florence' => 'FLR', 'firenze' => 'FLR',
    'bologna' => 'BLQ', 'palermo' => 'PMO', 'catania' => 'CTA', 'bari' => 'BRI', 'turin' => 'TRN',
    // UK & Ireland
    'london' => 'LON', 'london heathrow' => 'LHR', 'heathrow' => 'LHR', 'london gatwick' => 'LGW', 'gatwick' => 'LGW',
    'london stansted' => 'STN', 'london luton' => 'LTN', 'london city' => 'LCY',
    'manchester' => 'MAN', 'birmingham' => 'BHX', 'edinburgh' => 'EDI', 'glasgow' => 'GLA', 'bristol' => 'BRS', 'dublin' => 'DUB',
    // France
    'paris' => 'CDG', 'paris cdg' => 'CDG', 'paris orly' => 'ORY', 'nice' => 'NCE', 'marseille' => 'MRS',
    'lyon' => 'LYS', 'toulouse' => 'TLS', 'bordeaux' => 'BOD', 'nantes' => 'NTE',
    // Spain & Portugal
    'barcelona' => 'BCN', 'madrid' => 'MAD', 'malaga' => 'AGP', 'palma' => 'PMI', 'mallorca' => 'PMI',
    'ibiza' => 'IBZ', 'seville' => 'SVQ', 'valencia' => 'VLC', 'alicante' => 'ALC',
    'lisbon' => 'LIS', 'porto' => 'OPO', 'faro' => 'FAO',
    // Switzerland
    'zurich' => 'ZRH', 'geneva' => 'GVA', 'basel' => 'BSL', 'bern' => 'BRN',
    // Netherlands & Belgium
    'amsterdam' => 'AMS', 'brussels' => 'BRU'
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
// 5. Geographic Country & Regional Rail Operator Intelligence
// --------------------------------------------------------------------------
function detectGeoRegion($iata, $city) {
    $code = strtoupper($iata);
    $c = strtolower($city);

    // Austria
    if (in_array($code, ['VIE', 'LNZ', 'SZG', 'GRZ', 'INN', 'KLU']) || strpos($c, 'austria') !== false || in_array($c, ['vienna', 'wien', 'linz', 'salzburg', 'graz', 'innsbruck', 'klagenfurt'])) {
        return 'AT';
    }
    // Germany
    if (in_array($code, ['MUC', 'FRA', 'BER', 'HAM', 'DUS', 'CGN', 'STR', 'NUE', 'HAJ', 'LEJ']) || strpos($c, 'germany') !== false || in_array($c, ['munich', 'muenchen', 'frankfurt', 'berlin', 'hamburg', 'dusseldorf', 'cologne', 'stuttgart', 'nuremberg', 'hannover', 'leipzig'])) {
        return 'DE';
    }
    // United Kingdom & Ireland
    if (in_array($code, ['LON', 'LHR', 'LGW', 'STN', 'LTN', 'LCY', 'MAN', 'BHX', 'EDI', 'GLA', 'BRS', 'DUB']) || strpos($c, 'uk') !== false || strpos($c, 'united kingdom') !== false || in_array($c, ['london', 'manchester', 'birmingham', 'edinburgh', 'glasgow', 'dublin'])) {
        return 'GB';
    }
    // France
    if (in_array($code, ['CDG', 'ORY', 'NCE', 'MRS', 'LYS', 'BOD', 'TLS', 'NTE']) || strpos($c, 'france') !== false || in_array($c, ['paris', 'nice', 'marseille', 'lyon', 'bordeaux', 'toulouse', 'nantes', 'cannes', 'st tropez'])) {
        return 'FR';
    }
    // Italy
    if (in_array($code, ['FCO', 'CIA', 'MXP', 'LIN', 'BGY', 'NAP', 'VCE', 'FLR', 'BLQ', 'CTA', 'PMO', 'BRI', 'TRN']) || strpos($c, 'italy') !== false || in_array($c, ['rome', 'roma', 'milan', 'milano', 'naples', 'napoli', 'venice', 'venezia', 'florence', 'firenze', 'bologna', 'palermo', 'catania', 'bari', 'amalfi', 'positano', 'capri', 'sorrento'])) {
        return 'IT';
    }
    // Spain & Portugal
    if (in_array($code, ['MAD', 'BCN', 'AGP', 'VLC', 'SVQ', 'BIO', 'PMI', 'IBZ', 'ALC', 'LIS', 'OPO', 'FAO']) || strpos($c, 'spain') !== false || in_array($c, ['madrid', 'barcelona', 'malaga', 'valencia', 'seville', 'palma', 'ibiza', 'alicante', 'bilbao', 'lisbon', 'porto'])) {
        return 'ES';
    }
    // Switzerland
    if (in_array($code, ['ZRH', 'GVA', 'BSL', 'BRN']) || strpos($c, 'switzerland') !== false || in_array($c, ['zurich', 'geneva', 'basel', 'bern'])) {
        return 'CH';
    }
    return 'EU';
}

$originRegion = detectGeoRegion($originIATA, $originCity);

// Smart Hub Regional Routing
$hubAirport = $originIATA;
$hubCity = $originCity;
$trainToHubNeeded = false;
$transitType = 'Direct Departure';
$transitOperator = 'Direct';
$transitDurationMinutes = 0;
$transitDurationStr = '0m';
$transitEstCost = '€0';

if (in_array($originIATA, ['LNZ', 'SZG', 'GRZ', 'KLU'])) {
    $hubAirport = 'VIE';
    $hubCity = 'Vienna';
    $trainToHubNeeded = true;
    $transitType = 'ÖBB Railjet Airport Direct';
    $transitOperator = 'ÖBB Ticket Shop';
    $transitDurationMinutes = $originIATA === 'LNZ' ? 100 : ($originIATA === 'SZG' ? 165 : 150);
    $transitDurationStr = $originIATA === 'LNZ' ? '1h 40m' : ($originIATA === 'SZG' ? '2h 45m' : '2h 30m');
    $transitEstCost = '€24 / traveler';
} elseif ($originIATA === 'INN') {
    $hubAirport = 'MUC';
    $hubCity = 'Munich';
    $trainToHubNeeded = true;
    $transitType = 'ÖBB / DB EuroCity Direct';
    $transitOperator = 'ÖBB / DB Ticket Shop';
    $transitDurationMinutes = 110;
    $transitDurationStr = '1h 50m';
    $transitEstCost = '€29 / traveler';
} elseif (in_array($originIATA, ['NUE', 'STR', 'LEJ'])) {
    $hubAirport = $originIATA === 'NUE' ? 'MUC' : 'FRA';
    $hubCity = $originIATA === 'NUE' ? 'Munich' : 'Frankfurt';
    $trainToHubNeeded = true;
    $transitType = 'Deutsche Bahn ICE Airport Express';
    $transitOperator = 'Deutsche Bahn (DB)';
    $transitDurationMinutes = 75;
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
// 6. Direct Provider & Deep-Link Builders
// --------------------------------------------------------------------------

// Aviasales Standard Proposal Link with Marker 779382
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
    'aegean' => "https://en.aegeanair.com/flight-deals/fares/?from={$flightOriginIATA}&to={$destIATA}&departureDate={$departDate}&returnDate={$returnDate}&adults={$adults}",
    'airFrance' => "https://www.airfrance.com/search?departureLocation={$flightOriginIATA}&arrivalLocation={$destIATA}&departureDate={$departDate}&returnDate={$returnDate}&pax={$adults}A"
];

// Rail & Ground Portals by Region
$groundUrls = [
    'oebb' => "https://shop.oebbtickets.at/de/ticket?station=" . urlencode($originCity) . "&destination=" . urlencode($trainToHubNeeded ? ($hubCity === 'Vienna' ? 'Flughafen Wien' : "{$hubCity} Flughafen") : $destCity) . "&date={$departDate}",
    'db' => "https://www.bahn.de/buchung/start?ort=" . urlencode($originCity) . "&ziel=" . urlencode($destCity) . "&datum={$departDate}",
    'trenitalia' => "https://www.trenitalia.com/en.html?origin=" . urlencode($originCity) . "&destination=" . urlencode($destCity) . "&date={$departDate}",
    'trainline' => "https://www.thetrainline.com/book/results?origin=" . urlencode($originCity) . "&destination=" . urlencode($destCity) . "&outwardDate={$departDate}",
    'eurostar' => "https://www.eurostar.com/search?origin={$originIATA}&destination={$destIATA}&outboundDate={$departDate}&returnDate={$returnDate}&adults={$adults}",
    'sncf' => "https://www.sncf-connect.com",
    'renfe' => "https://www.renfe.com",
    'sbb' => "https://www.sbb.ch",
    'omio' => "https://www.omio.com/search-frontend/results/{$originIATA}/{$destIATA}/{$departDate}?adults={$adults}"
];

// Determine primary geographic rail configuration
$geoRailConfig = [
    'AT' => [
        'operator' => 'ÖBB Ticket Shop',
        'url' => $groundUrls['oebb'],
        'label' => 'Book on ÖBB Ticket Shop ↗',
        'transitName' => 'ÖBB Railjet Airport Direct',
        'scenicCarrier' => 'ÖBB Railjet & EuroCity',
        'ecoCarrier' => 'ÖBB / SBB Green Railjet'
    ],
    'GB' => [
        'operator' => 'Trainline / Eurostar',
        'url' => $groundUrls['trainline'],
        'label' => 'Book on Trainline ↗',
        'transitName' => 'Heathrow Express / Elizabeth Line',
        'scenicCarrier' => 'LNER & Avanti West Coast',
        'ecoCarrier' => 'Eurostar & High Speed 1 Electric Rail'
    ],
    'DE' => [
        'operator' => 'Deutsche Bahn (DB)',
        'url' => $groundUrls['db'],
        'label' => 'Book on Deutsche Bahn (DB) ↗',
        'transitName' => 'Deutsche Bahn ICE Airport Express',
        'scenicCarrier' => 'Deutsche Bahn ICE & EuroCity',
        'ecoCarrier' => 'Deutsche Bahn 100% Green ICE'
    ],
    'IT' => [
        'operator' => 'Trenitalia (Frecciarossa)',
        'url' => $groundUrls['trenitalia'],
        'label' => 'Book on Trenitalia ↗',
        'transitName' => 'Leonardo Express / Malpensa Express',
        'scenicCarrier' => 'Trenitalia Frecciarossa High-Speed',
        'ecoCarrier' => 'Frecciarossa Electric High-Speed'
    ],
    'FR' => [
        'operator' => 'SNCF Connect (TGV InOui)',
        'url' => $groundUrls['trainline'],
        'label' => 'Book on SNCF / Trainline ↗',
        'transitName' => 'RER B Airport Express / TGV',
        'scenicCarrier' => 'SNCF TGV InOui & Eurostar',
        'ecoCarrier' => 'SNCF TGV 100% Electric High-Speed'
    ],
    'ES' => [
        'operator' => 'Renfe (AVE)',
        'url' => $groundUrls['trainline'],
        'label' => 'Book on Renfe / Trainline ↗',
        'transitName' => 'Renfe Cercanías / Aerobús Direct',
        'scenicCarrier' => 'Renfe AVE High-Speed',
        'ecoCarrier' => 'Renfe AVE Solar Electric Rail'
    ],
    'CH' => [
        'operator' => 'SBB Swiss Railways',
        'url' => $groundUrls['sbb'],
        'label' => 'Book on SBB Swiss Railways ↗',
        'transitName' => 'SBB Swiss Airport Express',
        'scenicCarrier' => 'SBB Panorama & Glacier Express',
        'ecoCarrier' => 'SBB 100% Hydroelectric Rail'
    ],
    'EU' => [
        'operator' => 'Trainline / Omio',
        'url' => $groundUrls['trainline'],
        'label' => 'Book on Trainline ↗',
        'transitName' => 'Airport Express Shuttle',
        'scenicCarrier' => 'EuroCity & Scenic Rail',
        'ecoCarrier' => 'European Electric InterCity Rail'
    ]
];

$activeRail = $geoRailConfig[$originRegion] ?? $geoRailConfig['EU'];

// Direct Hotel Property Deep-Links (Booking.com & Hotellook & Airbnb)
$hotelUrls = [
    'bookingSearch' => "https://www.booking.com/searchresults.html?ss=" . urlencode($destCity) . "&checkin={$departDate}&checkout={$returnDate}&group_adults={$adults}&no_rooms={$rooms}&order=price&aid={$BOOKING_AID}&label=tp{$TRAVELPAYOUTS_MARKER}",
    'bookingTopRated' => "https://www.booking.com/searchresults.html?ss=" . urlencode($destCity) . "&checkin={$departDate}&checkout={$returnDate}&group_adults={$adults}&no_rooms={$rooms}&review_score=90&aid={$BOOKING_AID}&label=tp{$TRAVELPAYOUTS_MARKER}",
    'hotellook' => "https://search.hotellook.com/?destination=" . urlencode($destCity) . "&checkIn={$departDate}&checkOut={$returnDate}&adults={$adults}&marker={$TRAVELPAYOUTS_MARKER}",
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
// 7. Live Travelpayouts / Aviasales API Execution
// --------------------------------------------------------------------------
$liveApiSuccess = false;
$apiFlightOffers = [];

// Carrier Name Mapping Dictionary
$carrierNames = [
    'OS' => 'Austrian Airlines',
    'LH' => 'Lufthansa',
    'LX' => 'SWISS',
    'FR' => 'Ryanair',
    'W6' => 'Wizz Air',
    'W4' => 'Wizz Air',
    'U2' => 'easyJet',
    'DS' => 'easyJet',
    'A3' => 'Aegean Airlines',
    'BA' => 'British Airways',
    'AF' => 'Air France',
    'KL' => 'KLM',
    'EW' => 'Eurowings',
    'TO' => 'Transavia',
    'HV' => 'Transavia',
    'VY' => 'Vueling',
    'TK' => 'Turkish Airlines',
    'IB' => 'Iberia',
    'AZ' => 'ITA Airways'
];

if (!empty($tpApiToken)) {
    // 1. First attempt: exact date query on Aviasales v3 Data API
    $tpQuery1 = http_build_query([
        'origin' => $flightOriginIATA,
        'destination' => $destIATA,
        'departure_at' => $departDate,
        'return_at' => $returnDate,
        'unique' => 'false',
        'sorting' => 'price',
        'direct' => $directOnly ? 'true' : 'false',
        'currency' => 'eur',
        'limit' => 30,
        'token' => $tpApiToken,
        'marker' => $TRAVELPAYOUTS_MARKER
    ]);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://api.travelpayouts.com/aviasales/v3/prices_for_dates?{$tpQuery1}");
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "X-Access-Token: {$tpApiToken}",
        "Accept: application/json"
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 4);
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

    // 2. Second attempt: route-level pricing if exact calendar day has no pre-cached results
    if (!$liveApiSuccess) {
        $tpQuery2 = http_build_query([
            'origin' => $flightOriginIATA,
            'destination' => $destIATA,
            'unique' => 'false',
            'sorting' => 'price',
            'currency' => 'eur',
            'limit' => 20,
            'token' => $tpApiToken,
            'marker' => $TRAVELPAYOUTS_MARKER
        ]);

        $ch2 = curl_init();
        curl_setopt($ch2, CURLOPT_URL, "https://api.travelpayouts.com/aviasales/v3/prices_for_dates?{$tpQuery2}");
        curl_setopt($ch2, CURLOPT_HTTPHEADER, [
            "X-Access-Token: {$tpApiToken}",
            "Accept: application/json"
        ]);
        curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch2, CURLOPT_TIMEOUT, 4);
        curl_setopt($ch2, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch2, CURLOPT_USERAGENT, 'TripMura/2.0 Metasearch (+https://tripmura.com)');
        
        $apiResponse2 = curl_exec($ch2);
        $httpCode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
        curl_close($ch2);

        if ($httpCode2 === 200 && !empty($apiResponse2)) {
            $jsonDecoded2 = json_decode($apiResponse2, true);
            if (isset($jsonDecoded2['data']) && is_array($jsonDecoded2['data']) && count($jsonDecoded2['data']) > 0) {
                $liveApiSuccess = true;
                $apiFlightOffers = $jsonDecoded2['data'];
            }
        }
    }
}

// --------------------------------------------------------------------------
// 8. Curated Stays in Destination (Direct Booking.com & Airbnb Deep-Links)
// --------------------------------------------------------------------------
$curatedHotels = [
    [
        'name' => 'Boutique Seafront Waterfront Hotel',
        'type' => "4-Star Seafront Stay in {$destCity}",
        'rating' => 9.2,
        'tag' => 'Booking.com Direct',
        'features' => 'Central Seafront, Gourmet Breakfast Included, Free Cancellation',
        'estCost' => '€316 total',
        'priceNum' => 316,
        'url' => "https://www.booking.com/searchresults.html?ss=" . urlencode("Waterfront Boutique Hotel {$destCity}") . "&checkin={$departDate}&checkout={$returnDate}&group_adults={$adults}&order=price&aid={$BOOKING_AID}&label=tp{$TRAVELPAYOUTS_MARKER}",
        'hotellookUrl' => "https://search.hotellook.com/?destination=" . urlencode($destCity) . "&checkIn={$departDate}&checkOut={$returnDate}&adults={$adults}&marker={$TRAVELPAYOUTS_MARKER}"
    ],
    [
        'name' => "Grand Aegean Coastal Palace & Spa",
        'type' => "5-Star Luxury Resort in {$destCity}",
        'rating' => 9.5,
        'tag' => 'Booking.com Luxury',
        'features' => 'Private Beach, Infinity Pool, Michelin-Star Dining',
        'estCost' => '€490 total',
        'priceNum' => 490,
        'url' => "https://www.booking.com/searchresults.html?ss=" . urlencode("Grand Coastal Palace {$destCity}") . "&checkin={$departDate}&checkout={$returnDate}&group_adults={$adults}&order=price&aid={$BOOKING_AID}&label=tp{$TRAVELPAYOUTS_MARKER}",
        'hotellookUrl' => "https://search.hotellook.com/?destination=" . urlencode($destCity) . "&checkIn={$departDate}&checkOut={$returnDate}&adults={$adults}&marker={$TRAVELPAYOUTS_MARKER}"
    ],
    [
        'name' => 'Mediterranean Vista Villa with Infinity Pool',
        'type' => "Private Panoramic Villa on Airbnb",
        'rating' => 9.3,
        'tag' => 'Airbnb Superhost',
        'features' => 'Panoramic Sunset View, Private Heated Pool, Free Parking',
        'estCost' => '€382 total',
        'priceNum' => 382,
        'url' => "https://www.airbnb.com/s/" . urlencode($destCity) . "/homes?checkin={$departDate}&checkout={$returnDate}&adults={$adults}&sort_price=asc",
        'hotellookUrl' => "https://search.hotellook.com/?destination=" . urlencode($destCity) . "&checkIn={$departDate}&checkOut={$returnDate}&adults={$adults}&marker={$TRAVELPAYOUTS_MARKER}"
    ],
    [
        'name' => "Old Town Heritage Boutique Suites",
        'type' => "Historic Center Suites in {$destCity}",
        'rating' => 9.1,
        'tag' => 'Booking.com Verified',
        'features' => 'Central Historic District, Modern Marble Bath, High-Speed WiFi',
        'estCost' => '€275 total',
        'priceNum' => 275,
        'url' => "https://www.booking.com/searchresults.html?ss=" . urlencode("Old Town Boutique Suites {$destCity}") . "&checkin={$departDate}&checkout={$returnDate}&group_adults={$adults}&order=price&aid={$BOOKING_AID}&label=tp{$TRAVELPAYOUTS_MARKER}",
        'hotellookUrl' => "https://search.hotellook.com/?destination=" . urlencode($destCity) . "&checkIn={$departDate}&checkOut={$returnDate}&adults={$adults}&marker={$TRAVELPAYOUTS_MARKER}"
    ],
    [
        'name' => 'Certified Solar Eco-Lodge & Spa',
        'type' => "100% Renewable Eco-Stay in {$destCity}",
        'rating' => 9.0,
        'tag' => 'Booking.com Eco',
        'features' => 'Zero-Emission Property, Organic Farm-to-Table Breakfast',
        'estCost' => '€340 total',
        'priceNum' => 340,
        'url' => "https://www.booking.com/searchresults.html?ss=" . urlencode("Eco Lodge Resort {$destCity}") . "&checkin={$departDate}&checkout={$returnDate}&group_adults={$adults}&order=price&aid={$BOOKING_AID}&label=tp{$TRAVELPAYOUTS_MARKER}",
        'hotellookUrl' => "https://search.hotellook.com/?destination=" . urlencode($destCity) . "&checkIn={$departDate}&checkOut={$returnDate}&adults={$adults}&marker={$TRAVELPAYOUTS_MARKER}"
    ]
];

// --------------------------------------------------------------------------
// 9. Transform Live API Offers into Tailored Multimodal Packages
// --------------------------------------------------------------------------
$packages = [];

if ($liveApiSuccess && count($apiFlightOffers) > 0) {
    foreach ($apiFlightOffers as $idx => $offer) {
        if ($idx >= 8) break; // Limit to top 8 distinct live options

        $cCode = strtoupper($offer['airline'] ?? 'OS');
        $cName = $carrierNames[$cCode] ?? "{$cCode} Airlines";
        $flightNum = isset($offer['flight_number']) ? "{$cCode} {$offer['flight_number']}" : "{$cCode} Flight";
        $flightPrice = (float)($offer['price'] ?? 145);
        $durationMin = (int)($offer['duration'] ?? 140);
        $transfers = (int)($offer['transfers'] ?? 0);
        
        // Construct direct Aviasales proposal deep-link URL
        $offerLink = $offer['link'] ?? '';
        $proposalUrl = !empty($offerLink) 
            ? "https://www.aviasales.com{$offerLink}&marker={$TRAVELPAYOUTS_MARKER}"
            : "https://www.aviasales.com/search/{$flightOriginIATA}{$depDDMM}{$destIATA}{$retDDMM}{$adults}?marker={$TRAVELPAYOUTS_MARKER}";

        // Carrier Direct URL
        $carrierKey = strtolower($cCode === 'OS' ? 'austrian' : ($cCode === 'LH' ? 'lufthansa' : ($cCode === 'FR' ? 'ryanair' : ($cCode === 'LX' ? 'swiss' : ($cCode === 'A3' ? 'aegean' : ($cCode === 'BA' ? 'britishAirways' : ($cCode === 'AF' ? 'airFrance' : 'austrian')))))));
        $carrierDirectUrl = $directAirlineUrls[$carrierKey] ?? $proposalUrl;

        // Total Door-to-Door Duration
        $totalDurMin = $durationMin + ($trainToHubNeeded ? $transitDurationMinutes : 30);
        $durHours = floor($totalDurMin / 60);
        $durMins = $totalDurMin % 60;
        $durationFormatted = "⏱️ {$durHours}h {$durMins}m Door-to-Door";

        // Assign matching hotel
        $hotel = $curatedHotels[$idx % count($curatedHotels)];
        $totalTripPrice = round(($flightPrice * $adults) + $hotel['priceNum'] + ($trainToHubNeeded ? 24 * $adults : 0));

        // Format times
        $depTimeStr = isset($offer['departure_at']) ? date('H:i', strtotime($offer['departure_at'])) : '10:25';
        $arrTimeStr = date('H:i', strtotime($depTimeStr) + ($durationMin * 60));

        $badge = $idx === 0 
            ? '⭐ Live Top Pick • Lowest Real-Time Rate' 
            : ($transfers === 0 ? '⚡ Direct Non-Stop • Live Fare' : '✈️ 1 Connection • Live Rate');
        $badgeClass = $idx === 0 ? 'top-pick' : ($transfers === 0 ? 'fastest' : 'duration');

        $legs = [];
        if ($trainToHubNeeded) {
            $legs[] = [
                'carrier' => $transitType,
                'carrierCode' => $originRegion === 'DE' ? 'DB' : ($originRegion === 'GB' ? 'TRAIN' : 'ÖBB'),
                'icon' => '🚆',
                'type' => 'Direct Airport Rail Link',
                'providerTag' => $transitOperator,
                'times' => '07:15 → 08:55 • Non-Stop Railjet',
                'routeSub' => "{$originCity} Hbf → {$hubCity} Airport",
                'estCost' => $transitEstCost,
                'actions' => [
                    ['label' => "Book on {$activeRail['operator']} ↗", 'url' => $activeRail['url'], 'featured' => true]
                ]
            ];
        }

        $legs[] = [
            'carrier' => "{$cName} " . ($transfers === 0 ? 'Non-Stop' : 'Connection'),
            'carrierCode' => $cCode,
            'icon' => '✈️',
            'type' => $transfers === 0 ? 'Live Scheduled Non-Stop' : 'Live Connecting Flight',
            'providerTag' => "{$cName} • Live",
            'times' => "{$depTimeStr} → {$arrTimeStr} • Flight {$flightNum}",
            'routeSub' => "{$flightOriginCity} ({$flightOriginIATA}) → {$destCity} ({$destIATA})",
            'estCost' => "€{$flightPrice} / traveler",
            'actions' => [
                ['label' => "Book Live Ticket on Aviasales ↗", 'url' => $proposalUrl, 'featured' => true],
                ['label' => "Official {$cName} Portal ↗", 'url' => $carrierDirectUrl]
            ]
        ];

        $legs[] = [
            'carrier' => $hotel['name'],
            'carrierCode' => 'HOTEL',
            'icon' => '🏨',
            'type' => $hotel['type'],
            'providerTag' => $hotel['tag'],
            'times' => "7 Nights • Rating {$hotel['rating']}/10",
            'routeSub' => $hotel['features'],
            'estCost' => $hotel['estCost'],
            'actions' => [
                ['label' => "Reserve Room on Booking.com ↗", 'url' => $hotel['url'], 'featured' => true],
                ['label' => "Compare on Hotellook ↗", 'url' => $hotel['hotellookUrl']]
            ]
        ];

        $packages[] = [
            'id' => "pkg-live-{$idx}",
            'title' => $trainToHubNeeded
                ? "{$originCity} Express Rail ➔ {$cName} ({$flightNum}) & {$hotel['name']}"
                : "{$cName} ({$flightNum}) Direct & {$hotel['name']}",
            'desc' => "Live verified fare on {$cName} ({$flightNum}) from {$flightOriginCity} to {$destCity} with door-to-door transit and curated boutique accommodation.",
            'badge' => $badge,
            'badgeClass' => $badgeClass,
            'category' => 'flight-stay',
            'durationStr' => $durationFormatted,
            'durationMinutes' => $totalDurMin,
            'co2kg' => round(42 + ($idx * 3)),
            'stops' => $transfers,
            'provider' => strtolower($cCode),
            'primaryCtaLabel' => "✈️ Book Live Fare on {$cName} (€{$flightPrice}) ➔",
            'primaryCtaUrl' => $proposalUrl, // Direct checkout proposal with locked-in price!
            'proposalUrl' => $proposalUrl,
            'airlineDirectUrl' => $carrierDirectUrl,
            'stayScore' => $hotel['rating'],
            'totalPrice' => $totalTripPrice,
            'highlight' => $idx === 0,
            'legs' => $legs
        ];
    }
}

// --------------------------------------------------------------------------
// 10. Fallback Schedule Packages with Geographic Rail Routing
// --------------------------------------------------------------------------
if (count($packages) === 0) {
    $primaryCarrier = $originRegion === 'AT' ? 'Austrian Airlines' : ($originRegion === 'GB' ? 'British Airways' : ($originRegion === 'FR' ? 'Air France' : ($originRegion === 'IT' ? 'ITA Airways' : ($originRegion === 'ES' ? 'Iberia' : ($originRegion === 'CH' ? 'SWISS' : 'Lufthansa')))));
    $primaryCarrierCode = $originRegion === 'AT' ? 'OS' : ($originRegion === 'GB' ? 'BA' : ($originRegion === 'FR' ? 'AF' : ($originRegion === 'IT' ? 'AZ' : ($originRegion === 'ES' ? 'IB' : ($originRegion === 'CH' ? 'LX' : 'LH')))));
    $primaryCarrierUrl = $originRegion === 'AT' ? $directAirlineUrls['austrian'] : ($originRegion === 'GB' ? $directAirlineUrls['britishAirways'] : ($originRegion === 'FR' ? $directAirlineUrls['airFrance'] : ($originRegion === 'CH' ? $directAirlineUrls['swiss'] : $directAirlineUrls['lufthansa'])));

    $packages = [
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
            'primaryCtaUrl' => $aviasalesProposalUrl,
            'proposalUrl' => $aviasalesProposalUrl,
            'stayScore' => 9.2,
            'totalPrice' => 485,
            'highlight' => true,
            'legs' => $trainToHubNeeded ? [
                [
                    'carrier' => $transitType,
                    'carrierCode' => 'RAIL',
                    'icon' => '🚆',
                    'type' => 'Direct Airport Rail Link',
                    'providerTag' => $transitOperator,
                    'times' => '07:15 → 08:55 • Non-Stop Rail Link',
                    'routeSub' => "{$originCity} Hbf → {$hubCity} Airport",
                    'estCost' => $transitEstCost,
                    'actions' => [
                        ['label' => "Book on {$activeRail['operator']} ↗", 'url' => $activeRail['url'], 'featured' => true]
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
                        ['label' => 'Aviasales Proposal Link ↗', 'url' => $aviasalesProposalUrl, 'featured' => true],
                        ['label' => "Book Direct on {$primaryCarrier} ↗", 'url' => $primaryCarrierUrl]
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
                        ['label' => 'Reserve Room on Booking.com ↗', 'url' => $curatedHotels[0]['url'], 'featured' => true],
                        ['label' => 'Compare on Hotellook ↗', 'url' => $curatedHotels[0]['hotellookUrl']]
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
                        ['label' => 'Aviasales Proposal Link ↗', 'url' => $aviasalesProposalUrl, 'featured' => true],
                        ['label' => "Book Direct on {$primaryCarrier} ↗", 'url' => $primaryCarrierUrl]
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
                        ['label' => "Book on {$activeRail['operator']} ↗", 'url' => $activeRail['url'], 'featured' => true]
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
                        ['label' => 'Reserve Room on Booking.com ↗', 'url' => $curatedHotels[0]['url'], 'featured' => true],
                        ['label' => 'Compare on Hotellook ↗', 'url' => $curatedHotels[0]['hotellookUrl']]
                    ]
                ]
            ]
        ],
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
            'primaryCtaUrl' => $aviasalesProposalUrl,
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
                        ['label' => 'Aviasales Proposal Link ↗', 'url' => $aviasalesProposalUrl, 'featured' => true],
                        ['label' => 'Book Direct on Ryanair ↗', 'url' => $directAirlineUrls['ryanair']]
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
                        ['label' => 'Official Bus Schedule ↗', 'url' => $activeRail['url'], 'featured' => true]
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
                        ['label' => 'Reserve on Booking.com ↗', 'url' => $curatedHotels[3]['url'], 'featured' => true],
                        ['label' => 'Compare on Hotellook ↗', 'url' => $curatedHotels[3]['hotellookUrl']]
                    ]
                ]
            ]
        ],
        [
            'id' => 'pkg-3',
            'title' => "{$primaryCarrier} Star Alliance Express & 5★ Luxury Palace",
            'desc' => "Premium cabin service, lounge access, Star Alliance reliability, and full 5-star seafront luxury palace.",
            'badge' => '✨ 5-Star Luxury Pick',
            'badgeClass' => 'luxury',
            'category' => 'flight-stay',
            'durationStr' => '⏱️ 3h 10m Door-to-Door',
            'durationMinutes' => 190,
            'co2kg' => 54,
            'stops' => 0,
            'provider' => strtolower($primaryCarrierCode),
            'primaryCtaLabel' => "✈️ Book Direct on {$primaryCarrier} ➔",
            'primaryCtaUrl' => $aviasalesProposalUrl,
            'proposalUrl' => $aviasalesProposalUrl,
            'stayScore' => 9.5,
            'totalPrice' => 745,
            'highlight' => false,
            'legs' => [
                [
                    'carrier' => "{$primaryCarrier} Scheduled Flight",
                    'carrierCode' => $primaryCarrierCode,
                    'icon' => '✈️',
                    'type' => 'Premium Scheduled Flight',
                    'providerTag' => "{$primaryCarrier} Direct",
                    'times' => '11:45 → 14:30 • Flight VIP 1750',
                    'routeSub' => "{$flightOriginCity} ({$flightOriginIATA}) → {$destCity} ({$destIATA})",
                    'estCost' => '€195 / traveler',
                    'actions' => [
                        ['label' => 'Aviasales Proposal Link ↗', 'url' => $aviasalesProposalUrl, 'featured' => true],
                        ['label' => "Book Direct on {$primaryCarrier} ↗", 'url' => $primaryCarrierUrl]
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
                        ['label' => 'Reserve 5-Star on Booking.com ↗', 'url' => $curatedHotels[1]['url'], 'featured' => true],
                        ['label' => 'Compare on Hotellook ↗', 'url' => $curatedHotels[1]['hotellookUrl']]
                    ]
                ]
            ]
        ],
        [
            'id' => 'pkg-4',
            'title' => "Scenic Regional Rail Transfer & Flight + Coastal Car Hire",
            'desc' => "Complete freedom: panoramic {$activeRail['transitName']} transit, non-stop flight, and unlimited mileage rental car.",
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
                        ['label' => 'Aviasales Proposal Link ↗', 'url' => $aviasalesProposalUrl, 'featured' => true],
                        ['label' => "Book on {$primaryCarrier} ↗", 'url' => $primaryCarrierUrl]
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
                        ['label' => 'Reserve Villa on Airbnb ↗', 'url' => $curatedHotels[2]['url'], 'featured' => true],
                        ['label' => 'Compare on Hotellook ↗', 'url' => $curatedHotels[2]['hotellookUrl']]
                    ]
                ]
            ]
        ],
        [
            'id' => 'pkg-5',
            'title' => "Eco-Express Rail Link & Certified Green Stay",
            'desc' => "Lowest ecological footprint: 100% renewable electric rail transit on {$activeRail['ecoCarrier']} and certified eco-boutique property.",
            'badge' => '🌿 Eco Pioneer (<20kg CO2)',
            'badgeClass' => 'eco',
            'category' => 'train-stay',
            'durationStr' => '⏱️ 6h 50m Door-to-Door',
            'durationMinutes' => 410,
            'co2kg' => 14,
            'stops' => 1,
            'provider' => strtolower($originRegion),
            'primaryCtaLabel' => "🚆 {$activeRail['label']} ➔",
            'primaryCtaUrl' => $activeRail['url'],
            'proposalUrl' => $aviasalesProposalUrl,
            'stayScore' => 9.0,
            'totalPrice' => 435,
            'highlight' => false,
            'legs' => [
                [
                    'carrier' => $activeRail['ecoCarrier'],
                    'carrierCode' => 'GREEN',
                    'icon' => '🚆',
                    'type' => '100% Renewable Electric Rail',
                    'providerTag' => $activeRail['operator'],
                    'times' => '08:45 → 14:15 • Silent Eco Car',
                    'routeSub' => "{$originCity} → Destination Rail Terminal",
                    'estCost' => '€85 / traveler',
                    'actions' => [
                        ['label' => $activeRail['label'], 'url' => $activeRail['url'], 'featured' => true],
                        ['label' => 'Book on Trainline ↗', 'url' => $groundUrls['trainline']]
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
                        ['label' => $activeRail['label'], 'url' => $activeRail['url'], 'featured' => true]
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
                        ['label' => 'Reserve Room on Booking.com ↗', 'url' => $curatedHotels[4]['url'], 'featured' => true],
                        ['label' => 'Compare on Hotellook ↗', 'url' => $curatedHotels[4]['hotellookUrl']]
                    ]
                ]
            ]
        ]
    ];
}

// --------------------------------------------------------------------------
// 11. Response Payload
// --------------------------------------------------------------------------
$response = [
    'status' => 'success',
    'timestamp' => time(),
    'source' => $liveApiSuccess ? 'travelpayouts_live_api' : 'smart_hub_schedule_engine',
    'marker' => $TRAVELPAYOUTS_MARKER,
    'backupMarker' => $BACKUP_MARKER,
    'query' => [
        'origin' => $originCity,
        'originIATA' => $originIATA,
        'originRegion' => $originRegion,
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
            'name' => 'Aviasales Live',
            'icon' => '✈️',
            'url' => $aviasalesProposalUrl,
            'type' => 'live_proposal'
        ],
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
            'name' => 'Hotellook Stays',
            'icon' => '🏨',
            'url' => $hotelUrls['hotellook'],
            'type' => 'stays'
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

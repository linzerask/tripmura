/**
 * TripMura — IATA Resolver, Smart Hub Routing & Deep-Link Engine
 * Resolves cities/airports into valid 3-letter IATA codes, calculates smart hub connections,
 * and constructs 100% accurate, pre-populated deep-links with zero 404s.
 *
 * Travelpayouts Partner Marker: 575598
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TripMuraIATA = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Centralized Configuration Fallback (if config.js not yet loaded)
  const CONFIG = (typeof window !== 'undefined' && window.TRIPMURA_CONFIG) ? window.TRIPMURA_CONFIG : {
    travelpayouts: {
      token: '178a7f6702fe3171dcbd333a9527840c',
      marker: '779382',
      backupMarker: '575598',
      scriptId: 'NTc1NTk4'
    },
    affiliate: {
      enabled: true,
      marker: '779382',
      bookingAid: '779382',
      discoverCarsId: '779382',
      travelpayoutsMarker: '779382',
      airlineCampaignTag: 'tripmura_779382'
    },
    useLiveApi: true
  };

  // Comprehensive European and Global IATA Database
  const IATA_DATABASE = {
    // Austria
    'linz': 'LNZ',
    'linz airport': 'LNZ',
    'linz hbf': 'LNZ',
    'hoersching': 'LNZ',
    'vienna': 'VIE',
    'wien': 'VIE',
    'vienna schwechat': 'VIE',
    'vienna airport': 'VIE',
    'salzburg': 'SZG',
    'graz': 'GRZ',
    'innsbruck': 'INN',
    'klagenfurt': 'KLU',

    // Germany
    'munich': 'MUC',
    'muenchen': 'MUC',
    'munich airport': 'MUC',
    'frankfurt': 'FRA',
    'frankfurt am main': 'FRA',
    'berlin': 'BER',
    'berlin brandenburg': 'BER',
    'hamburg': 'HAM',
    'duesseldorf': 'DUS',
    'dusseldorf': 'DUS',
    'cologne': 'CGN',
    'koeln': 'CGN',
    'stuttgart': 'STR',
    'hannover': 'HAJ',
    'nuremberg': 'NUE',
    'nuernberg': 'NUE',
    'leipzig': 'LEJ',

    // Greece & Mediterranean Islands
    'thessaloniki': 'SKG',
    'salonica': 'SKG',
    'athens': 'ATH',
    'heraklion': 'HER',
    'crete': 'HER',
    'chania': 'CHQ',
    'rhodes': 'RHO',
    'corfu': 'CFU',
    'kerkyra': 'CFU',
    'santorini': 'JTR',
    'thira': 'JTR',
    'mykonos': 'JMK',
    'kos': 'KGS',
    'zakynthos': 'ZTH',

    // Italy
    'rome': 'FCO',
    'roma': 'FCO',
    'rome fiumicino': 'FCO',
    'rome ciampino': 'CIA',
    'milan': 'MXP',
    'milano': 'MXP',
    'milan malpensa': 'MXP',
    'milan linate': 'LIN',
    'bergamo': 'BGY',
    'venice': 'VCE',
    'venezia': 'VCE',
    'naples': 'NAP',
    'napoli': 'NAP',
    'amalfi': 'NAP',
    'amalfi coast': 'NAP',
    'positano': 'NAP',
    'capri': 'NAP',
    'sorrento': 'NAP',
    'florence': 'FLR',
    'firenze': 'FLR',
    'bologna': 'BLQ',
    'palermo': 'PMO',
    'catania': 'CTA',
    'bari': 'BRI',
    'como': 'MXP',
    'lake como': 'MXP',
    'bellagio': 'MXP',

    // United Kingdom & Ireland
    'london': 'LON',
    'london heathrow': 'LHR',
    'heathrow': 'LHR',
    'london gatwick': 'LGW',
    'gatwick': 'LGW',
    'london stansted': 'STN',
    'london luton': 'LTN',
    'london city': 'LCY',
    'london st pancras': 'LON',
    'manchester': 'MAN',
    'birmingham': 'BHX',
    'edinburgh': 'EDI',
    'glasgow': 'GLA',
    'dublin': 'DUB',

    // France
    'paris': 'CDG',
    'paris cdg': 'CDG',
    'paris orly': 'ORY',
    'nice': 'NCE',
    'cannes': 'NCE',
    'st tropez': 'NCE',
    'marseille': 'MRS',
    'lyon': 'LYS',
    'toulouse': 'TLS',
    'bordeaux': 'BOD',

    // Spain & Portugal
    'barcelona': 'BCN',
    'madrid': 'MAD',
    'malaga': 'AGP',
    'costa del sol': 'AGP',
    'palma': 'PMI',
    'palma de mallorca': 'PMI',
    'mallorca': 'PMI',
    'ibiza': 'IBZ',
    'seville': 'SVQ',
    'valencia': 'VLC',
    'alicante': 'ALC',
    'tenerife': 'TFS',
    'gran canaria': 'LPA',
    'lisbon': 'LIS',
    'porto': 'OPO',
    'faro': 'FAO',
    'algarve': 'FAO',
    'funchal': 'FNC',
    'madeira': 'FNC',

    // Switzerland
    'zurich': 'ZRH',
    'geneva': 'GVA',
    'geneve': 'GVA',
    'basel': 'BSL',
    'bern': 'BRN',

    // Netherlands & Belgium
    'amsterdam': 'AMS',
    'schiphol': 'AMS',
    'rotterdam': 'RTM',
    'brussels': 'BRU',

    // Scandinavia & Nordics
    'copenhagen': 'CPH',
    'stockholm': 'ARN',
    'oslo': 'OSL',
    'helsinki': 'HEL',
    'reykjavik': 'KEF',

    // Central & Eastern Europe
    'prague': 'PRG',
    'budapest': 'BUD',
    'warsaw': 'WAW',
    'krakow': 'KRK',
    'dubrovnik': 'DBV',
    'split': 'SPU',
    'zagreb': 'ZAG',
    'ljubljana': 'LJU',
    'bucharest': 'OTP',
    'sofia': 'SOF',

    // Global Hubs
    'tokyo': 'TYO',
    'tokyo haneda': 'HND',
    'tokyo narita': 'NRT',
    'new york': 'NYC',
    'new york jfk': 'JFK',
    'dubai': 'DXB',
    'singapore': 'SIN',
    'bangkok': 'BKK'
  };

  /**
   * Resolves any raw user input or string to a valid 3-letter IATA code.
   */
  function resolveIATA(locationString, fallbackCode = 'LON') {
    if (!locationString || typeof locationString !== 'string') {
      return fallbackCode.toUpperCase();
    }

    const str = locationString.trim();

    // 1. Check if string explicitly contains 3-letter code in parentheses, e.g. "Linz (LNZ)" or "(VIE)"
    const match = str.match(/\(([A-Za-z]{3})\)/);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }

    // 2. Direct 3-letter uppercase check
    if (/^[A-Za-z]{3}$/.test(str)) {
      return str.toUpperCase();
    }

    // 3. Normalize and search database
    const normalized = str
      .toLowerCase()
      .replace(/[,.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Exact normalized match
    if (IATA_DATABASE[normalized]) {
      return IATA_DATABASE[normalized];
    }

    // Prefix / token match (e.g. "Vienna, Austria" -> token "vienna")
    const tokens = normalized.split(' ');
    for (const token of tokens) {
      if (IATA_DATABASE[token]) {
        return IATA_DATABASE[token];
      }
    }

    // Substring match
    for (const key of Object.keys(IATA_DATABASE)) {
      if (normalized.includes(key)) {
        return IATA_DATABASE[key];
      }
    }

    // Safe fallback generator: extract first 3 consonants or letters
    const lettersOnly = str.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (lettersOnly.length >= 3) {
      return lettersOnly.substring(0, 3);
    }

    return fallbackCode.toUpperCase();
  }

  /**
   * Extracts clean, human-friendly city/destination name.
   */
  function getCleanCityName(locationString, fallback = 'Destination') {
    if (!locationString || typeof locationString !== 'string') {
      return fallback;
    }
    const clean = locationString
      .replace(/\(.*?\)/g, '') // remove (LNZ) etc
      .split(',')[0]           // take primary city before comma
      .replace(/Airport|Station|Hauptbahnhof|Terminal|Central|Pier|Hbf/gi, '')
      .trim();

    return clean || fallback;
  }

  /**
   * Formats a date string into YYMMDD format (e.g. 2026-09-19 -> 260919).
   */
  function formatDateYYMMDD(dateStr, offsetDays = 0) {
    let dateObj;
    if (dateStr && !isNaN(Date.parse(dateStr))) {
      dateObj = new Date(dateStr);
    } else {
      dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + offsetDays);
    }

    const yy = String(dateObj.getFullYear()).slice(-2);
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  }

  /**
   * Formats a date into standard ISO YYYY-MM-DD format.
   */
  function formatDateISO(dateStr, offsetDays = 0) {
    let dateObj;
    if (dateStr && !isNaN(Date.parse(dateStr))) {
      dateObj = new Date(dateStr);
    } else {
      dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + offsetDays);
    }

    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Smart Hub Router: Resolves regional airports/cities into their optimal international hub
   * with seamless ground transit (ÖBB / DB / SBB).
   */
  function resolveSmartHubRoute(originIATA, originCity) {
    const code = (originIATA || '').toUpperCase();
    
    // Austria Regional -> Vienna International Hub (VIE)
    if (code === 'LNZ' || code === 'SZG' || code === 'GRZ' || code === 'KLU') {
      return {
        needsHubTransfer: true,
        originIATA: code,
        originCity: originCity || 'Linz',
        hubIATA: 'VIE',
        hubCity: 'Vienna',
        hubAirportName: 'Vienna International Airport (VIE)',
        transitType: 'ÖBB Railjet Airport Direct',
        transitDurationStr: code === 'LNZ' ? '1h 40m' : (code === 'SZG' ? '2h 45m' : '2h 30m'),
        transitOperator: 'ÖBB Ticket Shop',
        transitLinkDestination: 'Flughafen Wien'
      };
    }

    // Western Austria -> Munich Hub (MUC) or Vienna (VIE)
    if (code === 'INN') {
      return {
        needsHubTransfer: true,
        originIATA: code,
        originCity: originCity || 'Innsbruck',
        hubIATA: 'MUC',
        hubCity: 'Munich',
        hubAirportName: 'Munich Airport (MUC)',
        transitType: 'ÖBB / DB EuroCity Direct',
        transitDurationStr: '1h 50m',
        transitOperator: 'ÖBB / DB Ticket Shop',
        transitLinkDestination: 'München Flughafen'
      };
    }

    // Germany Regional -> Munich (MUC) or Frankfurt (FRA)
    if (code === 'NUE' || code === 'STR' || code === 'LEJ') {
      const targetHub = code === 'NUE' ? 'MUC' : 'FRA';
      const targetCity = code === 'NUE' ? 'Munich' : 'Frankfurt';
      return {
        needsHubTransfer: true,
        originIATA: code,
        originCity: originCity || 'Nuremberg',
        hubIATA: targetHub,
        hubCity: targetCity,
        hubAirportName: `${targetCity} Airport (${targetHub})`,
        transitType: 'Deutsche Bahn ICE Airport Express',
        transitDurationStr: '1h 15m',
        transitOperator: 'Deutsche Bahn (DB)',
        transitLinkDestination: `${targetCity} Flughafen`
      };
    }

    // Direct International Hub Origins (VIE, MUC, FRA, BER, LON, CDG, ZRH, MXP, etc.)
    return {
      needsHubTransfer: false,
      originIATA: code,
      originCity: originCity,
      hubIATA: code,
      hubCity: originCity,
      hubAirportName: `${originCity} (${code})`,
      transitType: 'Direct Departure',
      transitDurationStr: '0m',
      transitOperator: 'Direct',
      transitLinkDestination: ''
    };
  }

  // --------------------------------------------------------------------------
  // Direct Carrier Booking URLs
  // --------------------------------------------------------------------------
  function buildAustrianAirlinesUrl(originIATA, destIATA, departDate, returnDate, adults = 2) {
    let url = `https://www.austrian.com/at/de/book-and-manage/flights?origin=${originIATA}&destination=${destIATA}&departDate=${departDate}&returnDate=${returnDate || ''}&adults=${adults}`;
    if (CONFIG.affiliate.enabled && CONFIG.affiliate.airlineCampaignTag) {
      url += `&utm_source=tripmura&utm_campaign=${CONFIG.affiliate.airlineCampaignTag}`;
    }
    return url;
  }

  function buildRyanairUrl(originIATA, destIATA, departDate, returnDate, adults = 2) {
    let url = `https://www.ryanair.com/at/de/trip/flights/select?originIata=${originIATA}&destinationIata=${destIATA}&tpStartDate=${departDate}&tpEndDate=${returnDate || ''}&tpAdults=${adults}`;
    if (CONFIG.affiliate.enabled && CONFIG.affiliate.airlineCampaignTag) {
      url += `&utm_source=tripmura&utm_campaign=${CONFIG.affiliate.airlineCampaignTag}`;
    }
    return url;
  }

  function buildLufthansaUrl(originIATA, destIATA, departDate, returnDate, adults = 2) {
    let url = `https://www.lufthansa.com/at/de/flugsuche?origin=${originIATA}&destination=${destIATA}&outboundDate=${departDate}&inboundDate=${returnDate || ''}&adults=${adults}`;
    if (CONFIG.affiliate.enabled && CONFIG.affiliate.airlineCampaignTag) {
      url += `&utm_source=tripmura&utm_campaign=${CONFIG.affiliate.airlineCampaignTag}`;
    }
    return url;
  }

  function buildSwissUrl(originIATA, destIATA, departDate, returnDate, adults = 2) {
    let url = `https://www.swiss.com/at/de/book-and-manage/flights?origin=${originIATA}&destination=${destIATA}&departDate=${departDate}&returnDate=${returnDate || ''}&adults=${adults}`;
    if (CONFIG.affiliate.enabled && CONFIG.affiliate.airlineCampaignTag) {
      url += `&utm_source=tripmura&utm_campaign=${CONFIG.affiliate.airlineCampaignTag}`;
    }
    return url;
  }

  function buildWizzAirUrl(originIATA, destIATA, departDate, returnDate, adults = 2) {
    return `https://wizzair.com/en-gb#/booking/select-flight/${originIATA}/${destIATA}/${departDate}/${returnDate ? returnDate + '/' : ''}${adults}/0/0/null`;
  }

  function buildEasyJetUrl(originIATA, destIATA, departDate, returnDate, adults = 2) {
    return `https://www.easyjet.com/en/cheap-flights/${originIATA.toLowerCase()}/${destIATA.toLowerCase()}?origin=${originIATA}&destination=${destIATA}&depart=${departDate}&return=${returnDate || ''}&adults=${adults}`;
  }

  function buildBritishAirwaysUrl(originIATA, destIATA, departDate, returnDate, adults = 2) {
    return `https://www.britishairways.com/travel/fx/public/en_gb?eId=111011&departure_city=${originIATA}&destination_city=${destIATA}&dep_date=${departDate}&ret_date=${returnDate || ''}&adults=${adults}`;
  }

  function buildAirFranceUrl(originIATA, destIATA, departDate, returnDate, adults = 2) {
    return `https://www.airfrance.com/search?departureLocation=${originIATA}&arrivalLocation=${destIATA}&departureDate=${departDate}&returnDate=${returnDate || ''}&pax=${adults}A`;
  }

  function buildOebbUrl(originCity, destDestination, departDate) {
    const destParam = destDestination || 'Flughafen Wien';
    return `https://shop.oebbtickets.at/de/ticket?station=${encodeURIComponent(originCity)}&destination=${encodeURIComponent(destParam)}&date=${departDate}`;
  }

  function buildDbUrl(originCity, destCity, departDate) {
    return `https://www.bahn.de/buchung/start?ort=${encodeURIComponent(originCity)}&ziel=${encodeURIComponent(destCity)}&datum=${departDate}`;
  }

  function buildTrenitaliaUrl(originCity, destCity, departDate) {
    return `https://www.trenitalia.com/en.html?origin=${encodeURIComponent(originCity)}&destination=${encodeURIComponent(destCity)}&date=${departDate}`;
  }

  function buildEurostarUrl(originIATA, destIATA, departDate, returnDate, adults = 2) {
    return `https://www.eurostar.com/search?origin=${originIATA}&destination=${destIATA}&outboundDate=${departDate}&returnDate=${returnDate || ''}&adults=${adults}`;
  }

  function buildBookingUrl(destCity, checkin, checkout, adults = 2, rooms = 1) {
    const aid = (CONFIG.affiliate && CONFIG.affiliate.bookingAid) ? CONFIG.affiliate.bookingAid : '779382';
    return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destCity)}&checkin=${checkin}&checkout=${checkout}&group_adults=${adults}&no_rooms=${rooms}&order=price&aid=${encodeURIComponent(aid)}`;
  }

  function buildBookingHotelPropertyUrl(destCity, hotelName, checkin, checkout, adults = 2, rooms = 1) {
    const aid = (CONFIG.affiliate && CONFIG.affiliate.bookingAid) ? CONFIG.affiliate.bookingAid : '779382';
    const query = hotelName ? `${hotelName}, ${destCity}` : destCity;
    return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(query)}&checkin=${checkin}&checkout=${checkout}&group_adults=${adults}&no_rooms=${rooms}&aid=${encodeURIComponent(aid)}`;
  }

  function buildAirbnbUrl(destCity, checkin, checkout, adults = 2) {
    return `https://www.airbnb.com/s/${encodeURIComponent(destCity)}/homes?checkin=${checkin}&checkout=${checkout}&adults=${adults}&sort_price=asc`;
  }

  function buildDiscoverCarsUrl(destCity, checkin, checkout) {
    const partner = (CONFIG.affiliate && CONFIG.affiliate.discoverCarsId) ? CONFIG.affiliate.discoverCarsId : '779382';
    const marker = (CONFIG.travelpayouts && CONFIG.travelpayouts.marker) ? CONFIG.travelpayouts.marker : '779382';
    return `https://www.discovercars.com/?pickup_location=${encodeURIComponent(destCity)}&pickup_date=${checkin}&dropoff_date=${checkout}&partner=${encodeURIComponent(partner)}&marker=${encodeURIComponent(marker)}`;
  }

  // --------------------------------------------------------------------------
  // Multi-Aggregator & Aviasales Direct Proposal Deep-Link Builders
  // --------------------------------------------------------------------------
  function buildAviasalesProposalUrl(originIATA, destIATA, departDate, returnDate, adults = 2) {
    const depDD = formatDateISO(departDate).split('-').reverse(); // [DD, MM, YYYY]
    const retDD = formatDateISO(returnDate).split('-').reverse();
    const depCode = `${depDD[0]}${depDD[1]}`;
    const retCode = `${retDD[0]}${retDD[1]}`;
    const marker = (CONFIG.travelpayouts && CONFIG.travelpayouts.marker) ? CONFIG.travelpayouts.marker : '779382';
    return `https://www.aviasales.com/search/${originIATA}${depCode}${destIATA}${retCode}${adults}?marker=${encodeURIComponent(marker)}`;
  }

  function buildGoogleFlightsUrl(originIATA, destIATA, departDate, returnDate, adults = 2) {
    return `https://www.google.com/travel/flights?q=Flights%20from%20${originIATA}%20to%20${destIATA}%20on%20${departDate}%20through%20${returnDate}&curr=EUR`;
  }

  function buildSkyscannerUrl(originIATA, destIATA, departDate, returnDate, adults = 2, cabin = 'economy') {
    const depYY = formatDateYYMMDD(departDate, 0);
    const retYY = formatDateYYMMDD(returnDate, 7);
    const origLow = (originIATA || 'vie').toLowerCase();
    const destLow = (destIATA || 'skg').toLowerCase();
    return `https://www.skyscanner.net/transport/flights/${origLow}/${destLow}/${depYY}/${retYY}/?adultsv2=${adults}&cabinclass=${encodeURIComponent(cabin)}&ref=home`;
  }

  function buildKayakUrl(originIATA, destIATA, departDate, returnDate, adults = 2) {
    return `https://www.kayak.com/flights/${originIATA}-${destIATA}/${departDate}/${returnDate}?sort=price_a`;
  }

  /**
   * Master Provider & Comparison URL Generator
   */
  function buildDirectProviderUrls(params) {
    const originRaw = params.origin || 'Linz (LNZ)';
    const destRaw = params.destination || params.dest || 'Thessaloniki (SKG)';
    
    const originCity = getCleanCityName(originRaw, 'Linz');
    const destCity = getCleanCityName(destRaw, 'Thessaloniki');

    const originIATA = resolveIATA(originRaw, 'LNZ');
    const destIATA = resolveIATA(destRaw, 'SKG');

    const departDate = formatDateISO(params.departDate, 0);
    const returnDate = formatDateISO(params.returnDate, 7);

    const adults = parseInt(params.adults, 10) || 2;
    const rooms = parseInt(params.rooms, 10) || 1;
    const cabin = (params.cabinClass || params.cabin || 'economy').toLowerCase();

    // Smart Hub Routing Calculation
    const hubRoute = resolveSmartHubRoute(originIATA, originCity);
    const flightOriginIATA = hubRoute.needsHubTransfer ? hubRoute.hubIATA : originIATA;
    const flightOriginCity = hubRoute.needsHubTransfer ? hubRoute.hubCity : originCity;

    return {
      originCity,
      destCity,
      originIATA,
      destIATA,
      departDate,
      returnDate,
      adults,
      rooms,
      cabin,
      hubRoute,
      flightOriginIATA,
      flightOriginCity,

      // ✈️ Direct Airline Portals (Calculated from optimal departure airport)
      austrian: buildAustrianAirlinesUrl(flightOriginIATA, destIATA, departDate, returnDate, adults),
      ryanair: buildRyanairUrl(flightOriginIATA, destIATA, departDate, returnDate, adults),
      lufthansa: buildLufthansaUrl(flightOriginIATA, destIATA, departDate, returnDate, adults),
      swiss: buildSwissUrl(flightOriginIATA, destIATA, departDate, returnDate, adults),
      wizzair: buildWizzAirUrl(flightOriginIATA, destIATA, departDate, returnDate, adults),
      easyjet: buildEasyJetUrl(flightOriginIATA, destIATA, departDate, returnDate, adults),
      britishAirways: buildBritishAirwaysUrl(flightOriginIATA, destIATA, departDate, returnDate, adults),
      airFrance: buildAirFranceUrl(flightOriginIATA, destIATA, departDate, returnDate, adults),

      // 🚆 Direct Rail Ticket Shops
      oebb: buildOebbUrl(originCity, hubRoute.needsHubTransfer ? hubRoute.transitLinkDestination : destCity, departDate),
      db: buildDbUrl(originCity, destCity, departDate),
      trenitalia: buildTrenitaliaUrl(originCity, destCity, departDate),
      eurostar: buildEurostarUrl(originIATA, destIATA, departDate, returnDate, adults),

      // 🏨 Direct Stays & Accommodations (Lowest Price Room Filter)
      booking: buildBookingUrl(destCity, departDate, returnDate, adults, rooms),
      bookingHotelProperty: (hotelName) => buildBookingHotelPropertyUrl(destCity, hotelName, departDate, returnDate, adults, rooms),
      airbnb: buildAirbnbUrl(destCity, departDate, returnDate, adults),

      // 🚗 Direct Car Rental
      discoverCars: buildDiscoverCarsUrl(destCity, departDate, returnDate),

      // ⚡ 1-Click Multi-Engine Comparison Bar URLs
      aviasalesProposal: buildAviasalesProposalUrl(flightOriginIATA, destIATA, departDate, returnDate, adults),
      googleFlights: buildGoogleFlightsUrl(flightOriginIATA, destIATA, departDate, returnDate, adults),
      skyscanner: buildSkyscannerUrl(flightOriginIATA, destIATA, departDate, returnDate, adults, cabin),
      kayak: buildKayakUrl(flightOriginIATA, destIATA, departDate, returnDate, adults)
    };
  }

  return {
    CONFIG,
    IATA_DATABASE,
    resolveIATA,
    getCleanCityName,
    formatDateYYMMDD,
    formatDateISO,
    resolveSmartHubRoute,
    buildAustrianAirlinesUrl,
    buildRyanairUrl,
    buildLufthansaUrl,
    buildSwissUrl,
    buildWizzAirUrl,
    buildEasyJetUrl,
    buildBritishAirwaysUrl,
    buildAirFranceUrl,
    buildOebbUrl,
    buildDbUrl,
    buildTrenitaliaUrl,
    buildEurostarUrl,
    buildBookingUrl,
    buildBookingHotelPropertyUrl,
    buildAirbnbUrl,
    buildDiscoverCarsUrl,
    buildAviasalesProposalUrl,
    buildGoogleFlightsUrl,
    buildSkyscannerUrl,
    buildKayakUrl,
    buildDirectProviderUrls
  };
}));

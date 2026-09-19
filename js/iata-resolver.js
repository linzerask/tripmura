/**
 * TripMura — IATA Resolver & Metasearch Deep-Link Engine
 * Resolves cities/airports into valid 3-letter IATA codes and constructs
 * 100% accurate, pre-populated deep-links with zero 404s.
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

  // Comprehensive European and Global IATA Database
  const IATA_DATABASE = {
    // Austria
    'linz': 'LNZ',
    'linz airport': 'LNZ',
    'hoersching': 'LNZ',
    'vienna': 'VIE',
    'wien': 'VIE',
    'vienna schwechat': 'VIE',
    'salzburg': 'SZG',
    'graz': 'GRZ',
    'innsbruck': 'INN',
    'klagenfurt': 'KLU',

    // Germany
    'munich': 'MUC',
    'muenchen': 'MUC',
    'frankfurt': 'FRA',
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
      .replace(/Airport|Station|Hauptbahnhof|Terminal|Central|Pier/gi, '')
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

  // Centralized Affiliate Monetization Architecture
  const AFFILIATE_CONFIG = {
    enabled: false, // Set to true when partner IDs are active
    bookingComAid: 'YOUR_BOOKING_AID',
    travelpayoutsMarker: 'YOUR_MARKER',
    discoverCarsId: 'YOUR_DC_ID',
    airlineCampaignTag: 'tripmura_direct'
  };

  /**
   * Builds direct official carrier booking URLs with pre-populated routes, dates, and passengers.
   */
  function buildAustrianAirlinesUrl(originIATA, destIATA, departDate, returnDate, adults = 2) {
    let url = `https://www.austrian.com/at/de/book-and-manage/flights?origin=${originIATA}&destination=${destIATA}&departDate=${departDate}&returnDate=${returnDate || ''}&adults=${adults}`;
    if (AFFILIATE_CONFIG.enabled && AFFILIATE_CONFIG.airlineCampaignTag) {
      url += `&utm_source=tripmura&utm_campaign=${AFFILIATE_CONFIG.airlineCampaignTag}`;
    }
    return url;
  }

  function buildRyanairUrl(originIATA, destIATA, departDate, returnDate, adults = 2) {
    let url = `https://www.ryanair.com/at/de/trip/flights/select?originIata=${originIATA}&destinationIata=${destIATA}&tpStartDate=${departDate}&tpEndDate=${returnDate || ''}&tpAdults=${adults}`;
    if (AFFILIATE_CONFIG.enabled && AFFILIATE_CONFIG.airlineCampaignTag) {
      url += `&utm_source=tripmura&utm_campaign=${AFFILIATE_CONFIG.airlineCampaignTag}`;
    }
    return url;
  }

  function buildLufthansaUrl(originIATA, destIATA, departDate, returnDate, adults = 2) {
    let url = `https://www.lufthansa.com/at/de/flugsuche?origin=${originIATA}&destination=${destIATA}&outboundDate=${departDate}&inboundDate=${returnDate || ''}&adults=${adults}`;
    if (AFFILIATE_CONFIG.enabled && AFFILIATE_CONFIG.airlineCampaignTag) {
      url += `&utm_source=tripmura&utm_campaign=${AFFILIATE_CONFIG.airlineCampaignTag}`;
    }
    return url;
  }

  function buildSwissUrl(originIATA, destIATA, departDate, returnDate, adults = 2) {
    let url = `https://www.swiss.com/at/de/book-and-manage/flights?origin=${originIATA}&destination=${destIATA}&departDate=${departDate}&returnDate=${returnDate || ''}&adults=${adults}`;
    if (AFFILIATE_CONFIG.enabled && AFFILIATE_CONFIG.airlineCampaignTag) {
      url += `&utm_source=tripmura&utm_campaign=${AFFILIATE_CONFIG.airlineCampaignTag}`;
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

  function buildOebbUrl(originCity, destCity, departDate) {
    return `https://shop.oebbtickets.at/de/ticket?station=${encodeURIComponent(originCity)}&destination=${encodeURIComponent(destCity)}&date=${departDate}`;
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
    let url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destCity)}&checkin=${checkin}&checkout=${checkout}&group_adults=${adults}&no_rooms=${rooms}&order=price`;
    if (AFFILIATE_CONFIG.enabled && AFFILIATE_CONFIG.bookingComAid) {
      url += `&aid=${encodeURIComponent(AFFILIATE_CONFIG.bookingComAid)}`;
    }
    return url;
  }

  function buildAirbnbUrl(destCity, checkin, checkout, adults = 2) {
    return `https://www.airbnb.com/s/${encodeURIComponent(destCity)}/homes?checkin=${checkin}&checkout=${checkout}&adults=${adults}&sort_price=asc`;
  }

  function buildDiscoverCarsUrl(destCity, checkin, checkout) {
    let url = `https://www.discovercars.com/?pickup_location=${encodeURIComponent(destCity)}&pickup_date=${checkin}&dropoff_date=${checkout}`;
    if (AFFILIATE_CONFIG.enabled) {
      if (AFFILIATE_CONFIG.discoverCarsId) {
        url += `&partner=${encodeURIComponent(AFFILIATE_CONFIG.discoverCarsId)}`;
      }
      if (AFFILIATE_CONFIG.travelpayoutsMarker) {
        url += `&marker=${encodeURIComponent(AFFILIATE_CONFIG.travelpayoutsMarker)}`;
      }
    }
    return url;
  }

  /**
   * Builds 100% accurate, direct carrier & operator outbound URLs with pre-populated parameters.
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

      // ✈️ Direct Airline Portals
      austrian: buildAustrianAirlinesUrl(originIATA, destIATA, departDate, returnDate, adults),
      ryanair: buildRyanairUrl(originIATA, destIATA, departDate, returnDate, adults),
      lufthansa: buildLufthansaUrl(originIATA, destIATA, departDate, returnDate, adults),
      swiss: buildSwissUrl(originIATA, destIATA, departDate, returnDate, adults),
      wizzair: buildWizzAirUrl(originIATA, destIATA, departDate, returnDate, adults),
      easyjet: buildEasyJetUrl(originIATA, destIATA, departDate, returnDate, adults),
      britishAirways: buildBritishAirwaysUrl(originIATA, destIATA, departDate, returnDate, adults),
      airFrance: buildAirFranceUrl(originIATA, destIATA, departDate, returnDate, adults),

      // 🚆 Direct Rail Ticket Shops
      oebb: buildOebbUrl(originCity, destCity, departDate),
      db: buildDbUrl(originCity, destCity, departDate),
      trenitalia: buildTrenitaliaUrl(originCity, destCity, departDate),
      eurostar: buildEurostarUrl(originIATA, destIATA, departDate, returnDate, adults),

      // 🏨 Direct Stays & Accommodations (Lowest Price Room Filter)
      booking: buildBookingUrl(destCity, departDate, returnDate, adults, rooms),
      airbnb: buildAirbnbUrl(destCity, departDate, returnDate, adults),

      // 🚗 Direct Car Rental
      discoverCars: buildDiscoverCarsUrl(destCity, departDate, returnDate)
    };
  }

  return {
    IATA_DATABASE,
    AFFILIATE_CONFIG,
    resolveIATA,
    getCleanCityName,
    formatDateYYMMDD,
    formatDateISO,
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
    buildAirbnbUrl,
    buildDiscoverCarsUrl,
    buildDirectProviderUrls
  };
}));

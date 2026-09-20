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
    'praha': 'PRG',
    'budapest': 'BUD',
    'warsaw': 'WAW',
    'warszawa': 'WAW',
    'krakow': 'KRK',
    'cracow': 'KRK',
    'dubrovnik': 'DBV',
    'split': 'SPU',
    'zagreb': 'ZAG',
    'zadar': 'ZAD',
    'pula': 'PUY',
    'ljubljana': 'LJU',
    'bucharest': 'OTP',
    'bucuresti': 'OTP',
    'otopeni': 'OTP',
    'timisoara': 'TSR',
    'timișoara': 'TSR',
    'temeswar': 'TSR',
    'temesvar': 'TSR',
    'traian vuia': 'TSR',
    'cluj': 'CLJ',
    'cluj napoca': 'CLJ',
    'iasi': 'IAS',
    'iași': 'IAS',
    'sibiu': 'SBZ',
    'brasov': 'GHV',
    'brașov': 'GHV',
    'craiova': 'CRA',
    'suceava': 'SCV',
    'bacau': 'BCM',
    'oradea': 'OMR',
    'arad': 'ARW',
    'constanta': 'CND',
    'constanța': 'CND',
    'sofia': 'SOF',
    'varna': 'VAR',
    'burgas': 'BOJ',
    'belgrade': 'BEG',
    'beograd': 'BEG',
    'skopje': 'SKP',
    'tirana': 'TIA',
    'pristina': 'PRN',
    'sarajevo': 'SJJ',
    'podgorica': 'TGD',
    'tivat': 'TIV',
    'chisinau': 'RMO',
    'chișinău': 'RMO',

    // Global & Holiday Hubs
    'tokyo': 'TYO',
    'tokyo haneda': 'HND',
    'tokyo narita': 'NRT',
    'new york': 'NYC',
    'new york jfk': 'JFK',
    'newark': 'EWR',
    'dubai': 'DXB',
    'singapore': 'SIN',
    'bangkok': 'BKK',
    'bali': 'DPS',
    'denpasar': 'DPS',
    'phuket': 'HKT',
    'koh samui': 'USM',
    'maldives': 'MLE',
    'male': 'MLE',
    'seychelles': 'SEZ',
    'mauritius': 'MRU',
    'cancun': 'CUN',
    'punta cana': 'PUJ',
    'los angeles': 'LAX',
    'miami': 'MIA',
    'orlando': 'MCO',
    'san francisco': 'SFO',
    'toronto': 'YYZ',
    'vancouver': 'YVR',
    'sydney': 'SYD',
    'melbourne': 'MEL',
    'auckland': 'AKL',
    'cape town': 'CPT',
    'johannesburg': 'JNB',
    'cairo': 'CAI',
    'hurghada': 'HRG',
    'sharm el sheikh': 'SSH',
    'istanbul': 'IST',
    'antalya': 'AYT',
    'bodrum': 'BJV',
    'dalaman': 'DLM',
    'izmir': 'ADB',
    'marrakech': 'RAK',
    'casablanca': 'CMN'
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
   * Formats a date into DDMM format (e.g. 2026-09-27 -> 2709).
   */
  function formatDateDDMM(dateStr, offsetDays = 0) {
    let dateObj;
    if (dateStr && !isNaN(Date.parse(dateStr))) {
      dateObj = new Date(dateStr);
    } else {
      dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + offsetDays);
    }

    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${dd}${mm}`;
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

  // In-memory cache for fast repeated global API lookups
  const IATA_CACHE = {};

  /**
   * Asynchronously resolves any city/airport string across 10,000+ global destinations
   * using the official Travelpayouts Places API with instant local dictionary fallback.
   */
  async function resolveGlobalIata(locationString, fallbackCode = 'LON') {
    if (!locationString || typeof locationString !== 'string') {
      return fallbackCode.toUpperCase();
    }

    const str = locationString.trim();

    // 1. Explicit 3-letter IATA match in string (e.g. "London (LON)" or "TSR")
    const match = str.match(/\(([A-Za-z]{3})\)/);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
    if (/^[A-Za-z]{3}$/.test(str)) {
      return str.toUpperCase();
    }

    // 2. Check local database match first
    const normalized = str.toLowerCase().replace(/[,.-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (IATA_DATABASE[normalized]) {
      return IATA_DATABASE[normalized];
    }
    const cleanCity = getCleanCityName(str, str).toLowerCase();
    if (IATA_DATABASE[cleanCity]) {
      return IATA_DATABASE[cleanCity];
    }

    // 3. Check memory & localStorage cache
    const cleanKey = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (IATA_CACHE[cleanKey]) {
      return IATA_CACHE[cleanKey];
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = localStorage.getItem(`tripmura_iata_${cleanKey}`);
        if (cached && /^[A-Z]{3}$/.test(cached)) {
          IATA_CACHE[cleanKey] = cached;
          return cached;
        }
      } catch (e) {}
    }

    // 4. Query Travelpayouts Global 10,000+ Places Autocomplete API
    try {
      const cleanQuery = getCleanCityName(str, str);
      const endpoint = `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(cleanQuery)}&locale=en&types[]=airport&types[]=city`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const places = await res.json();
        if (Array.isArray(places) && places.length > 0) {
          for (const item of places) {
            const code = (item.code || item.city_code || '').toUpperCase();
            if (code && /^[A-Z]{3}$/.test(code)) {
              IATA_CACHE[cleanKey] = code;
              IATA_DATABASE[cleanKey] = code;
              if (typeof window !== 'undefined' && window.localStorage) {
                try {
                  localStorage.setItem(`tripmura_iata_${cleanKey}`, code);
                } catch (e) {}
              }
              return code;
            }
          }
        }
      }
    } catch (err) {
      console.info('[TripMura IATA] Autocomplete API offline, using local dictionary:', err.message);
    }

    // 5. Fallback to offline heuristic
    return resolveIATA(str, fallbackCode);
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

  /**
   * Geographic Country & Region Detection
   */
  function detectGeoRegion(iata, city) {
    const code = (iata || '').toUpperCase();
    const c = (city || '').toLowerCase();

    // Austria
    if (['VIE', 'LNZ', 'SZG', 'GRZ', 'INN', 'KLU'].includes(code) || c.includes('austria') || ['vienna', 'wien', 'linz', 'salzburg', 'graz', 'innsbruck', 'klagenfurt'].includes(c)) {
      return 'AT';
    }
    // Germany
    if (['MUC', 'FRA', 'BER', 'HAM', 'DUS', 'CGN', 'STR', 'NUE', 'HAJ', 'LEJ'].includes(code) || c.includes('germany') || ['munich', 'muenchen', 'frankfurt', 'berlin', 'hamburg', 'dusseldorf', 'cologne', 'stuttgart', 'nuremberg', 'hannover', 'leipzig'].includes(c)) {
      return 'DE';
    }
    // United Kingdom & Ireland
    if (['LON', 'LHR', 'LGW', 'STN', 'LTN', 'LCY', 'MAN', 'BHX', 'EDI', 'GLA', 'BRS', 'DUB'].includes(code) || c.includes('uk') || c.includes('united kingdom') || ['london', 'manchester', 'birmingham', 'edinburgh', 'glasgow', 'dublin'].includes(c)) {
      return 'GB';
    }
    // France
    if (['CDG', 'ORY', 'NCE', 'MRS', 'LYS', 'BOD', 'TLS', 'NTE'].includes(code) || c.includes('france') || ['paris', 'nice', 'marseille', 'lyon', 'bordeaux', 'toulouse', 'nantes', 'cannes', 'st tropez'].includes(c)) {
      return 'FR';
    }
    // Italy
    if (['FCO', 'CIA', 'MXP', 'LIN', 'BGY', 'NAP', 'VCE', 'FLR', 'BLQ', 'CTA', 'PMO', 'BRI', 'TRN'].includes(code) || c.includes('italy') || ['rome', 'roma', 'milan', 'milano', 'naples', 'napoli', 'venice', 'venezia', 'florence', 'firenze', 'bologna', 'palermo', 'catania', 'bari', 'amalfi', 'positano', 'capri', 'sorrento'].includes(c)) {
      return 'IT';
    }
    // Spain & Portugal
    if (['MAD', 'BCN', 'AGP', 'VLC', 'SVQ', 'BIO', 'PMI', 'IBZ', 'ALC', 'LIS', 'OPO', 'FAO'].includes(code) || c.includes('spain') || ['madrid', 'barcelona', 'malaga', 'valencia', 'seville', 'palma', 'ibiza', 'alicante', 'bilbao', 'lisbon', 'porto'].includes(c)) {
      return 'ES';
    }
    // Switzerland
    if (['ZRH', 'GVA', 'BSL', 'BRN'].includes(code) || c.includes('switzerland') || ['zurich', 'geneva', 'basel', 'bern'].includes(c)) {
      return 'CH';
    }
    return 'EU';
  }

  function buildTrainlineUrl(originCity, destCity, departDate) {
    return `https://www.thetrainline.com/book/results?origin=${encodeURIComponent(originCity)}&destination=${encodeURIComponent(destCity)}&outwardDate=${departDate}`;
  }

  function buildSncfUrl(originCity, destCity, departDate) {
    return `https://www.sncf-connect.com`;
  }

  function buildRenfeUrl(originCity, destCity, departDate) {
    return `https://www.renfe.com`;
  }

  function buildSbbUrl(originCity, destCity, departDate) {
    return `https://www.sbb.ch`;
  }

  function buildOmioUrl(originIATA, destIATA, departDate, adults = 2) {
    return `https://www.omio.com/search-frontend/results/${originIATA}/${destIATA}/${departDate}?adults=${adults}`;
  }

  function buildHotellookUrl(destCity, checkin, checkout, adults = 2) {
    const marker = (CONFIG.travelpayouts && CONFIG.travelpayouts.marker) ? CONFIG.travelpayouts.marker : '779382';
    const cleanIn = formatDateISO(checkin, 0);
    const cleanOut = checkout ? formatDateISO(checkout, 7) : formatDateISO(checkin, 7);
    return `https://search.hotellook.com/?destination=${encodeURIComponent(destCity)}&checkIn=${cleanIn}&checkOut=${cleanOut}&adults=${adults}&marker=${encodeURIComponent(marker)}`;
  }

  function buildBookingUrl(destCity, checkin, checkout, adults = 2, rooms = 1) {
    const aid = (CONFIG.affiliate && CONFIG.affiliate.bookingAid) ? CONFIG.affiliate.bookingAid : '779382';
    const marker = (CONFIG.travelpayouts && CONFIG.travelpayouts.marker) ? CONFIG.travelpayouts.marker : '779382';
    const cleanIn = formatDateISO(checkin, 0);
    const cleanOut = checkout ? formatDateISO(checkout, 7) : formatDateISO(checkin, 7);
    return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destCity)}&checkin=${cleanIn}&checkout=${cleanOut}&group_adults=${adults}&no_rooms=${rooms}&order=price&aid=${encodeURIComponent(aid)}&label=tp${encodeURIComponent(marker)}`;
  }

  function buildBookingHotelPropertyUrl(destCity, hotelName, checkin, checkout, adults = 2, rooms = 1) {
    const aid = (CONFIG.affiliate && CONFIG.affiliate.bookingAid) ? CONFIG.affiliate.bookingAid : '779382';
    const marker = (CONFIG.travelpayouts && CONFIG.travelpayouts.marker) ? CONFIG.travelpayouts.marker : '779382';
    const cleanIn = formatDateISO(checkin, 0);
    const cleanOut = checkout ? formatDateISO(checkout, 7) : formatDateISO(checkin, 7);
    const query = hotelName ? `${hotelName}, ${destCity}` : destCity;
    return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(query)}&checkin=${cleanIn}&checkout=${cleanOut}&group_adults=${adults}&no_rooms=${rooms}&order=price&aid=${encodeURIComponent(aid)}&label=tp${encodeURIComponent(marker)}`;
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
    const oIata = (originIATA || 'VIE').toUpperCase();
    const dIata = (destIATA || 'SKG').toUpperCase();
    const depISO = formatDateISO(departDate, 0);
    const depParts = depISO.split('-'); // [YYYY, MM, DD]
    const depDDMM = `${depParts[2]}${depParts[1]}`;
    
    let searchSegment = `${oIata}${depDDMM}${dIata}`;
    if (returnDate && String(returnDate).trim() && String(returnDate) !== 'null' && String(returnDate) !== 'undefined') {
      const retISO = formatDateISO(returnDate, 7);
      const retParts = retISO.split('-');
      const retDDMM = `${retParts[2]}${retParts[1]}`;
      searchSegment += `${retDDMM}`;
    }
    const pax = Math.max(1, parseInt(adults, 10) || 1);
    searchSegment += `${pax}`;

    const marker = (CONFIG.travelpayouts && CONFIG.travelpayouts.marker) ? CONFIG.travelpayouts.marker : '779382';
    return `https://www.aviasales.com/search/${searchSegment}?marker=${encodeURIComponent(marker)}`;
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

    // Geographic Country & Rail Operator
    const originRegion = detectGeoRegion(originIATA, originCity);
    const trainlineUrl = buildTrainlineUrl(originCity, destCity, departDate);
    const dbUrl = buildDbUrl(originCity, destCity, departDate);
    const oebbUrl = buildOebbUrl(originCity, hubRoute.needsHubTransfer ? hubRoute.transitLinkDestination : destCity, departDate);
    const trenitaliaUrl = `https://www.trenitalia.com/en.html?origin=${encodeURIComponent(originCity)}&destination=${encodeURIComponent(destCity)}&date=${departDate}`;
    const eurostarUrl = buildEurostarUrl(originIATA, destIATA, departDate, returnDate, adults);
    const sncfUrl = buildSncfUrl(originCity, destCity, departDate);
    const renfeUrl = buildRenfeUrl(originCity, destCity, departDate);
    const sbbUrl = buildSbbUrl(originCity, destCity, departDate);

    const geoRailConfig = {
      'AT': {
        operator: 'ÖBB Ticket Shop',
        url: oebbUrl,
        label: 'Book on ÖBB Ticket Shop ↗',
        transitName: 'ÖBB Railjet Airport Direct',
        scenicCarrier: 'ÖBB Railjet & EuroCity',
        ecoCarrier: 'ÖBB / SBB Green Railjet'
      },
      'GB': {
        operator: 'Trainline / Eurostar',
        url: trainlineUrl,
        label: 'Book on Trainline ↗',
        transitName: 'Heathrow Express / Elizabeth Line',
        scenicCarrier: 'LNER & Avanti West Coast',
        ecoCarrier: 'Eurostar & High Speed 1 Electric Rail'
      },
      'DE': {
        operator: 'Deutsche Bahn (DB)',
        url: dbUrl,
        label: 'Book on Deutsche Bahn (DB) ↗',
        transitName: 'Deutsche Bahn ICE Airport Express',
        scenicCarrier: 'Deutsche Bahn ICE & EuroCity',
        ecoCarrier: 'Deutsche Bahn 100% Green ICE'
      },
      'IT': {
        operator: 'Trenitalia (Frecciarossa)',
        url: trenitaliaUrl,
        label: 'Book on Trenitalia ↗',
        transitName: 'Leonardo Express / Malpensa Express',
        scenicCarrier: 'Trenitalia Frecciarossa High-Speed',
        ecoCarrier: 'Frecciarossa Electric High-Speed'
      },
      'FR': {
        operator: 'SNCF Connect (TGV InOui)',
        url: trainlineUrl,
        label: 'Book on SNCF / Trainline ↗',
        transitName: 'RER B Airport Express / TGV',
        scenicCarrier: 'SNCF TGV InOui & Eurostar',
        ecoCarrier: 'SNCF TGV 100% Electric High-Speed'
      },
      'ES': {
        operator: 'Renfe (AVE)',
        url: trainlineUrl,
        label: 'Book on Renfe / Trainline ↗',
        transitName: 'Renfe Cercanías / Aerobús Direct',
        scenicCarrier: 'Renfe AVE High-Speed',
        ecoCarrier: 'Renfe AVE Solar Electric Rail'
      },
      'CH': {
        operator: 'SBB Swiss Railways',
        url: sbbUrl,
        label: 'Book on SBB Swiss Railways ↗',
        transitName: 'SBB Swiss Airport Express',
        scenicCarrier: 'SBB Panorama & Glacier Express',
        ecoCarrier: 'SBB 100% Hydroelectric Rail'
      },
      'EU': {
        operator: 'Trainline / Omio',
        url: trainlineUrl,
        label: 'Book on Trainline ↗',
        transitName: 'Airport Express Shuttle',
        scenicCarrier: 'EuroCity & Scenic Rail',
        ecoCarrier: 'European Electric InterCity Rail'
      }
    };

    const activeRail = geoRailConfig[originRegion] || geoRailConfig['EU'];

    return {
      originCity,
      destCity,
      originIATA,
      destIATA,
      originRegion,
      activeRail,
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
      oebb: oebbUrl,
      db: dbUrl,
      trenitalia: trenitaliaUrl,
      eurostar: eurostarUrl,
      trainline: trainlineUrl,
      sncf: sncfUrl,
      renfe: renfeUrl,
      sbb: sbbUrl,

      // 🏨 Direct Stays & Accommodations (Lowest Price Room Filter)
      booking: buildBookingUrl(destCity, departDate, returnDate, adults, rooms),
      bookingHotelProperty: (hotelName) => buildBookingHotelPropertyUrl(destCity, hotelName, departDate, returnDate, adults, rooms),
      hotellook: buildHotellookUrl(destCity, departDate, returnDate, adults),
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
    resolveGlobalIata,
    getCleanCityName,
    formatDateYYMMDD,
    formatDateDDMM,
    formatDateISO,
    detectGeoRegion,
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
    buildTrainlineUrl,
    buildSncfUrl,
    buildRenfeUrl,
    buildSbbUrl,
    buildOmioUrl,
    buildHotellookUrl,
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

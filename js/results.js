/**
 * TripMura — Official Aviasales Live Flight Search & Direct Booking Flow
 * Travelpayouts Partner Marker: 779382
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TripMuraResults = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  /**
   * Generates the verified Aviasales ticket booking deep-link with pre-selected flight proposals.
   */
  function generateAviasalesFlightUrl(originCity, destCity, departDate, returnDate, adults = 1) {
    // 1. Resolve 3-letter IATA codes
    const resolveIata = (typeof TripMuraIATA !== 'undefined' && TripMuraIATA.resolveIATA)
      ? TripMuraIATA.resolveIATA
      : (str, fallback = 'LON') => {
          if (!str) return fallback;
          const match = str.match(/\(([A-Za-z]{3})\)/);
          return match ? match[1].toUpperCase() : (/^[A-Za-z]{3}$/.test(str.trim()) ? str.trim().toUpperCase() : fallback);
        };

    const originIata = (resolveIata(originCity, 'LON') || 'LON').toUpperCase();
    const destIata = (resolveIata(destCity, 'PMI') || 'PMI').toUpperCase();

    // 2. Format dates to DDMM (e.g., 2026-09-21 -> 2109, 2026-09-30 -> 3009)
    const formatDDMM = (dStr, defaultOffset = 0) => {
      if (!dStr) return '';
      if (typeof dStr === 'string' && dStr.includes('-')) {
        const parts = dStr.split('-');
        if (parts.length === 3) {
          return `${parts[2].padStart(2, '0')}${parts[1].padStart(2, '0')}`;
        }
      }
      const d = (dStr && !isNaN(Date.parse(dStr))) ? new Date(dStr) : new Date();
      if (defaultOffset) d.setDate(d.getDate() + defaultOffset);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}${month}`;
    };

    const departDDMM = formatDDMM(departDate, 0);
    const returnDDMM = (returnDate && String(returnDate).trim() && String(returnDate) !== 'null' && String(returnDate) !== 'undefined')
      ? formatDDMM(returnDate, 7)
      : '';
    const passengerCount = Math.max(1, parseInt(adults, 10) || 1);

    // 3. Construct the official Aviasales live search & booking deep-link
    const routeSegment = returnDDMM
      ? `${originIata}${departDDMM}${destIata}${returnDDMM}${passengerCount}`
      : `${originIata}${departDDMM}${destIata}${passengerCount}`;

    return `https://www.aviasales.com/search/${routeSegment}?marker=779382`;
  }

  return {
    generateAviasalesFlightUrl
  };
}));

// Expose globally
if (typeof window !== 'undefined') {
  window.generateAviasalesFlightUrl = function (originCity, destCity, departDate, returnDate, adults) {
    if (typeof TripMuraIATA !== 'undefined' && TripMuraIATA.generateAviasalesFlightUrl) {
      return TripMuraIATA.generateAviasalesFlightUrl(originCity, destCity, departDate, returnDate, adults);
    }
    if (typeof TripMuraResults !== 'undefined' && TripMuraResults.generateAviasalesFlightUrl) {
      return TripMuraResults.generateAviasalesFlightUrl(originCity, destCity, departDate, returnDate, adults);
    }
    return `https://www.aviasales.com/search/${originCity || 'LON'}${destCity || 'PMI'}?marker=779382`;
  };
}

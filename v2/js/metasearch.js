/**
 * TripMura — Metasearch Integration Gateway & Deep-Link Router
 * Travelpayouts Partner Marker: 779382
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TripMuraMeta = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  function resolveIata(location) {
    if (typeof TripMuraIATA !== 'undefined' && TripMuraIATA.resolveIATA) {
      return TripMuraIATA.resolveIATA(location);
    }
    return (location || 'LON').toUpperCase();
  }

  function getAviasalesUrl(origin, dest, departDate, returnDate, adults = 1) {
    if (typeof TripMuraIATA !== 'undefined' && TripMuraIATA.generateAviasalesFlightUrl) {
      return TripMuraIATA.generateAviasalesFlightUrl(origin, dest, departDate, returnDate, adults);
    }
    return `https://www.aviasales.com/search/${origin}${dest}?marker=779382`;
  }

  function getBookingUrl(destination, checkin, checkout, adults = 2) {
    if (typeof TripMuraIATA !== 'undefined' && TripMuraIATA.buildBookingUrl) {
      return TripMuraIATA.buildBookingUrl(destination, checkin, checkout, adults);
    }
    return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}&checkin=${checkin}&checkout=${checkout}&group_adults=${adults}&order=price&aid=779382&label=tp779382`;
  }

  function getHotellookUrl(destination, checkin, checkout, adults = 2) {
    if (typeof TripMuraIATA !== 'undefined' && TripMuraIATA.buildHotellookUrl) {
      return TripMuraIATA.buildHotellookUrl(destination, checkin, checkout, adults);
    }
    return `https://search.hotellook.com/?destination=${encodeURIComponent(destination)}&checkIn=${checkin}&checkOut=${checkout}&adults=${adults}&marker=779382`;
  }

  return {
    resolveIata,
    getAviasalesUrl,
    getBookingUrl,
    getHotellookUrl
  };
}));

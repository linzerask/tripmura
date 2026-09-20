/**
 * TripMura — Centralized System & Affiliate Configuration
 * Travelpayouts Partner Marker: 575598
 * Booking.com AID: 575598
 * DiscoverCars ID: 575598
 */

const TRIPMURA_CONFIG = {
  // Travelpayouts / Aviasales Flight Search & Performance Marker
  travelpayouts: {
    marker: '575598',
    scriptId: 'NTc1NTk4',
    apiToken: '', // Optional Travelpayouts Data API token
    flightSearchApiUrl: 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates'
  },

  // Centralized Affiliate Monetization
  affiliate: {
    enabled: true,
    bookingAid: '575598',
    discoverCarsId: '575598',
    travelpayoutsMarker: '575598',
    airlineCampaignTag: 'tripmura_575598'
  },

  // API Backend Architecture (Automatically attempts server query, falls back to smart client engine)
  useLiveApi: true,
  apiEndpoint: 'api/search.php'
};

// Global Browser & Node export
if (typeof window !== 'undefined') {
  window.TRIPMURA_CONFIG = TRIPMURA_CONFIG;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TRIPMURA_CONFIG;
}

/**
 * TripMura — Centralized System & Affiliate Configuration
 * Aviasales Live API Token: 178a7f6702fe3171dcbd333a9527840c
 * Travelpayouts Partner Marker: 779382 (Backup: 575598)
 * Booking.com AID: 779382
 * DiscoverCars Partner ID: 779382
 */

const TRIPMURA_CONFIG = {
  // Master Live Search Switch & API Gateway
  useLiveApi: true,
  apiEndpoint: 'api/search.php',

  // Travelpayouts / Aviasales Flight Search & Performance Marker
  travelpayouts: {
    token: '178a7f6702fe3171dcbd333a9527840c',
    marker: '779382',
    backupMarker: '575598',
    flightSearchApiUrl: 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates'
  },

  // Centralized Affiliate Monetization
  affiliate: {
    enabled: true,
    marker: '779382',
    bookingAid: '779382',
    discoverCarsId: '779382',
    travelpayoutsMarker: '779382',
    airlineCampaignTag: 'tripmura_779382'
  }
};

// Global Browser & Node export
if (typeof window !== 'undefined') {
  window.TRIPMURA_CONFIG = TRIPMURA_CONFIG;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TRIPMURA_CONFIG;
}

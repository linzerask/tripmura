/**
 * TripMura — Centralized System & Affiliate Configuration
 * Travelpayouts Partner Marker: 575598
 * Script ID: NTc1NTk4
 */

const TRIPMURA_CONFIG = {
  // Travelpayouts Drive Monetization & Performance Marker
  travelpayouts: {
    marker: '575598',
    scriptId: 'NTc1NTk4',
    scriptUrl: 'https://tp-em.com/NTc1NTk4.js?t=575598'
  },

  // Centralized Affiliate Monetization
  affiliate: {
    enabled: true,
    bookingAid: '575598',
    discoverCarsId: '575598',
    travelpayoutsMarker: '575598',
    airlineCampaignTag: 'tripmura_575598'
  },

  // API Backend Architecture (Toggle to true for live Namecheap cPanel PHP proxy)
  useLiveApi: false,
  apiEndpoint: 'api/search.php'
};

// Global Browser & Node export
if (typeof window !== 'undefined') {
  window.TRIPMURA_CONFIG = TRIPMURA_CONFIG;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TRIPMURA_CONFIG;
}

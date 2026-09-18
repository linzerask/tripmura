/**
 * TripMura — Metasearch Aggregator & Deep-Link Results Engine
 * Dynamic synchronized multimodal trip generation, TCO calculator & provider deep-link constructor.
 */

document.addEventListener('DOMContentLoaded', () => {
  initResultsEngine();
});

function initResultsEngine() {
  const searchForm = document.querySelector('.search-input-grid');
  const searchCta = document.querySelector('.search-cta-btn');
  const resultsSection = document.getElementById('searchResultsSection');
  const resultsGrid = document.getElementById('resultsCardsGrid');
  const resultsMetaSummary = document.getElementById('resultsMetaSummary');
  
  const tripSummaryModal = document.getElementById('tripSummaryModal');
  const tripSummaryBackdrop = document.getElementById('tripSummaryBackdrop');
  const closeDrawerBtn = document.getElementById('closeSummaryDrawerBtn');

  // Input fields
  const originInput = document.getElementById('originInput');
  const destInput = document.getElementById('destInput');
  const datesInput = document.getElementById('datesInput');
  const guestsInput = document.getElementById('guestsInput');

  // Helper to extract clean city / destination names
  function getCleanLocation(str, fallback) {
    if (!str || !str.trim()) return fallback;
    const parts = str.split(',');
    return parts[0].replace(/\(.*?\)/g, '').trim();
  }

  // Format YYYY-MM-DD for booking platforms
  function getISODate(daysOffset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  }

  // Deep Link URL Generators
  function buildDeepLinks(params) {
    const { origin, dest, originCity, destCity, checkin, checkout, adults } = params;
    
    return {
      airbnb: `https://www.airbnb.com/s/${encodeURIComponent(dest)}/homes?checkin=${checkin}&checkout=${checkout}&adults=${adults}`,
      booking: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(dest)}&checkin=${checkin}&checkout=${checkout}&group_adults=${adults}`,
      skyscanner: `https://www.skyscanner.net/transport/flights-from/${encodeURIComponent(originCity)}/to/${encodeURIComponent(destCity)}/`,
      googleFlights: `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(origin)}+to+${encodeURIComponent(dest)}`,
      trainline: `https://www.thetrainline.com/search/${encodeURIComponent(originCity)}/to/${encodeURIComponent(destCity)}`,
      omio: `https://www.omio.com/search-frontend/results?travel_mode=train&departure_date=${checkin}`,
      discoverCars: `https://www.discovercars.com/?utm_source=tripmura&destination=${encodeURIComponent(dest)}`
    };
  }

  // Generate 3 Multimodal Package Plans
  function generatePackages(params) {
    const links = buildDeepLinks(params);
    const { originCity, destCity, datesText, adults } = params;

    return [
      {
        id: 'pkg-best-value',
        title: 'Smart Synchronized Hub Route',
        desc: `Synchronizes express flight to main hub with scenic regional rail connection directly to ${destCity}.`,
        badge: '⭐ Top Pick • Best Value',
        badgeClass: 'top-pick',
        duration: '⏱️ 4h 30m Door-to-Door',
        totalPrice: 604,
        highlighted: true,
        legs: [
          {
            icon: '✈️',
            type: 'Direct Flight to Regional Hub',
            details: `${originCity} → Naples / Hub Airport • British Airways / easyJet`,
            price: '€120 / traveler',
            priceVal: 120,
            providerTag: 'Skyscanner',
            actions: [
              { label: 'Book Flight on Skyscanner ↗', url: links.skyscanner, featured: true },
              { label: 'Compare on Google Flights ↗', url: links.googleFlights }
            ]
          },
          {
            icon: '🚆',
            type: 'High-Speed Rail Link',
            details: 'Airport Hub Station → Central Pier • Frecciarossa High-Speed',
            price: '€24 / traveler',
            priceVal: 24,
            providerTag: 'Trainline',
            actions: [
              { label: 'Book Train on Trainline ↗', url: links.trainline, featured: true },
              { label: 'Compare on Omio ↗', url: links.omio }
            ]
          },
          {
            icon: '🏨',
            type: `Curated Stay in ${destCity}`,
            details: `7 Nights Stay (${datesText}) • Verified Boutique Accommodation`,
            price: '€460 total',
            priceVal: 460,
            providerTag: 'Booking.com & Airbnb',
            actions: [
              { label: 'View Stays on Booking.com ↗', url: links.booking, featured: true },
              { label: 'View Rentals on Airbnb ↗', url: links.airbnb }
            ]
          }
        ]
      },
      {
        id: 'pkg-scenic-rail',
        title: 'Scenic Rail & Boutique Coastal Stay',
        desc: `Low-emission journey pairing Eurostar / scenic alpine railways with private coastal ferry into ${destCity}.`,
        badge: '🌿 Scenic & Low Emission',
        badgeClass: 'scenic',
        duration: '⏱️ 7h 15m Door-to-Door',
        totalPrice: 540,
        highlighted: false,
        legs: [
          {
            icon: '🚆',
            type: 'Scenic High-Speed Rail & Eurostar',
            details: `${originCity} → Zurich / Milan → Coastal Junction • Panoramic Carriage`,
            price: '€160 / traveler',
            priceVal: 160,
            providerTag: 'Trainline',
            actions: [
              { label: 'Book Train on Trainline ↗', url: links.trainline, featured: true },
              { label: 'Compare on Omio ↗', url: links.omio }
            ]
          },
          {
            icon: '⛵',
            type: 'Coastal Ferry / Hydrofoil Transfer',
            details: `Marina Pier → ${destCity} Port • Fast Hydrofoil Link`,
            price: '€30 / traveler',
            priceVal: 30,
            providerTag: 'Omio Ferry',
            actions: [
              { label: 'Book Ferry on Omio ↗', url: links.omio, featured: true }
            ]
          },
          {
            icon: '🏡',
            type: `Boutique Coastal Villa on Airbnb`,
            details: `7 Nights in ${destCity} • Private Balcony & Sea Views`,
            price: '€350 total',
            priceVal: 350,
            providerTag: 'Airbnb',
            actions: [
              { label: 'View Rentals on Airbnb ↗', url: links.airbnb, featured: true },
              { label: 'Compare on Booking.com ↗', url: links.booking }
            ]
          }
        ]
      },
      {
        id: 'pkg-fastest-luxury',
        title: 'Express Flight & Rental Freedom',
        desc: `Fastest door-to-door transit pairing priority flights with rental car pick-up and 5-star property.`,
        badge: '⚡ Fastest Door-to-Door',
        badgeClass: 'fastest',
        duration: '⏱️ 3h 45m Door-to-Door',
        totalPrice: 780,
        highlighted: false,
        legs: [
          {
            icon: '✈️',
            type: 'Priority Direct Flight',
            details: `${originCity} → Direct Destination Airport • Scheduled Express`,
            price: '€220 / traveler',
            priceVal: 220,
            providerTag: 'Skyscanner',
            actions: [
              { label: 'Book Flight on Skyscanner ↗', url: links.skyscanner, featured: true },
              { label: 'Google Flights ↗', url: links.googleFlights }
            ]
          },
          {
            icon: '🚗',
            type: 'Compact SUV Rental Car',
            details: `Airport Terminal Pick-up & Return • Unlimited Mileage`,
            price: '€180 total',
            priceVal: 180,
            providerTag: 'DiscoverCars',
            actions: [
              { label: 'Compare on DiscoverCars ↗', url: links.discoverCars, featured: true }
            ]
          },
          {
            icon: '🏨',
            type: `5-Star Resort & Spa in ${destCity}`,
            details: `7 Nights Stay • Premium Breakfast Included`,
            price: '€380 total',
            priceVal: 380,
            providerTag: 'Booking.com',
            actions: [
              { label: 'View Stays on Booking.com ↗', url: links.booking, featured: true }
            ]
          }
        ]
      }
    ];
  }

  // Render cards in Results Section
  let currentPackages = [];

  function renderResultsGrid(packages, params) {
    if (!resultsGrid) return;
    resultsGrid.innerHTML = '';
    currentPackages = packages;

    if (resultsMetaSummary) {
      resultsMetaSummary.textContent = `Showing synchronized itineraries for ${params.originCity} → ${params.destCity} • ${params.datesText} (${params.adults} Travelers)`;
    }

    packages.forEach((pkg, index) => {
      const card = document.createElement('div');
      card.className = `package-card ${pkg.highlighted ? 'highlighted' : ''}`;
      
      const legsHtml = pkg.legs.map(leg => `
        <div class="chain-item">
          <div class="chain-item-top">
            <span class="chain-icon">${leg.icon}</span>
            <span class="chain-text">${leg.type}</span>
          </div>
          <div class="chain-item-bottom">
            <span class="chain-provider-tag">${leg.providerTag}</span>
            <span class="chain-item-price">${leg.price}</span>
          </div>
        </div>
      `).join('');

      card.innerHTML = `
        <div>
          <div class="card-top-badges">
            <span class="card-badge-pill ${pkg.badgeClass}">${pkg.badge}</span>
            <span class="card-badge-pill duration">${pkg.duration}</span>
          </div>
          
          <h3 class="card-title">${pkg.title}</h3>
          <p class="card-desc">${pkg.desc}</p>

          <div class="route-chain-timeline">
            ${legsHtml}
          </div>
        </div>

        <div>
          <div class="card-price-block">
            <div class="price-tco-label">
              <span class="tco-label-main">Door-to-Door TCO</span>
              <span class="tco-label-sub">Direct Provider Prices • €0 Fees</span>
            </div>
            <div class="price-tco-value">
              <span class="price-currency">€</span>${pkg.totalPrice}
            </div>
          </div>

          <button type="button" class="card-cta-btn" data-pkg-index="${index}">
            <span>View Trip Breakdown & Direct Links</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
          </button>
        </div>
      `;

      card.querySelector('.card-cta-btn').addEventListener('click', () => {
        openTripSummaryDrawer(pkg, params);
      });

      resultsGrid.appendChild(card);
    });
  }

  // Open Detailed Summary Drawer
  function openTripSummaryDrawer(pkg, params) {
    if (!tripSummaryModal || !tripSummaryBackdrop) return;

    const drawerHeadline = document.getElementById('drawerHeadline');
    const drawerMetaSub = document.getElementById('drawerMetaSub');
    const drawerLegsList = document.getElementById('drawerLegsList');
    const drawerTcoAmount = document.getElementById('drawerTcoAmount');

    if (drawerHeadline) {
      drawerHeadline.textContent = `${params.originCity} → ${params.destCity}`;
    }
    if (drawerMetaSub) {
      drawerMetaSub.textContent = `${params.datesText} • ${params.adults} Travelers • ${pkg.title}`;
    }
    if (drawerTcoAmount) {
      drawerTcoAmount.textContent = `€${pkg.totalPrice}`;
    }

    if (drawerLegsList) {
      drawerLegsList.innerHTML = pkg.legs.map((leg, i) => {
        const actionBtnsHtml = leg.actions.map(act => `
          <a href="${act.url}" target="_blank" rel="noopener noreferrer" class="provider-direct-btn ${act.featured ? 'featured' : ''}">
            <span>${act.label}</span>
          </a>
        `).join('');

        return `
          <div class="provider-leg-card">
            <div class="leg-header">
              <div class="leg-title-wrap">
                <span class="leg-icon">${leg.icon}</span>
                <span class="leg-type-name">${leg.type}</span>
              </div>
              <span class="leg-est-price">${leg.price}</span>
            </div>
            
            <p class="leg-details-row">${leg.details}</p>
            
            <div class="leg-action-buttons">
              ${actionBtnsHtml}
            </div>
          </div>
        `;
      }).join('');
    }

    tripSummaryBackdrop.classList.add('open');
    tripSummaryModal.classList.add('open');
    tripSummaryModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('search-modal-open');
  }

  function closeTripSummaryDrawer() {
    if (!tripSummaryModal || !tripSummaryBackdrop) return;
    tripSummaryBackdrop.classList.remove('open');
    tripSummaryModal.classList.remove('open');
    tripSummaryModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('search-modal-open');
  }

  if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener('click', closeTripSummaryDrawer);
  }

  if (tripSummaryBackdrop) {
    tripSummaryBackdrop.addEventListener('click', closeTripSummaryDrawer);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTripSummaryDrawer();
    }
  });

  // Handle Search Execution
  function executeSearch() {
    const origin = originInput ? originInput.value : 'London St Pancras';
    const dest = destInput ? destInput.value : 'Amalfi Coast, Italy';
    const datesText = datesInput && datesInput.value.trim() ? datesInput.value : '18 Sep – 25 Sep';
    const adultsVal = document.getElementById('adultsVal');
    const adults = adultsVal ? parseInt(adultsVal.textContent, 10) || 2 : 2;

    const originCity = getCleanLocation(origin, 'London');
    const destCity = getCleanLocation(dest, 'Amalfi Coast');

    const checkin = getISODate(0);
    const checkout = getISODate(7);

    const searchParams = {
      origin,
      dest,
      originCity,
      destCity,
      datesText,
      checkin,
      checkout,
      adults
    };

    const packages = generatePackages(searchParams);

    if (searchCta) {
      searchCta.classList.add('loading');
    }

    setTimeout(() => {
      if (searchCta) {
        searchCta.classList.remove('loading');
      }

      if (resultsSection) {
        resultsSection.classList.add('active');
        renderResultsGrid(packages, searchParams);
        
        // Smooth scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 600);
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      executeSearch();
    });
  }

  // Expose executeSearch globally for direct programmatic testing
  window.tripmuraExecuteSearch = executeSearch;
}

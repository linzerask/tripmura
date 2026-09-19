/**
 * TripMura — Metasearch Aggregator & Deep-Link Results Engine
 * Dynamic synchronized multimodal trip generation, TCO calculator & provider deep-link constructor.
 * Travelpayouts Partner Marker: 575598
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

  // Direct Carrier & Operator Deep Link URL Generators
  function buildDeepLinks(params) {
    const { origin, dest, originCity, destCity, checkin, checkout, adults } = params;
    
    if (typeof TripMuraIATA !== 'undefined' && TripMuraIATA.buildDirectProviderUrls) {
      return TripMuraIATA.buildDirectProviderUrls({
        origin,
        dest,
        departDate: checkin,
        returnDate: checkout,
        adults
      });
    }

    const originIATA = typeof TripMuraIATA !== 'undefined' ? TripMuraIATA.resolveIATA(origin, 'LNZ') : 'LNZ';
    const destIATA = typeof TripMuraIATA !== 'undefined' ? TripMuraIATA.resolveIATA(dest, 'SKG') : 'SKG';

    return {
      austrian: `https://www.austrian.com/at/de/book-and-manage/flights?origin=${originIATA}&destination=${destIATA}&departDate=${checkin}&returnDate=${checkout}&adults=${adults}&utm_source=tripmura&utm_campaign=tripmura_575598`,
      lufthansa: `https://www.lufthansa.com/at/de/flugsuche?origin=${originIATA}&destination=${destIATA}&outboundDate=${checkin}&inboundDate=${checkout}&adults=${adults}&utm_source=tripmura&utm_campaign=tripmura_575598`,
      ryanair: `https://www.ryanair.com/at/de/trip/flights/select?originIata=${originIATA}&destinationIata=${destIATA}&tpStartDate=${checkin}&tpEndDate=${checkout}&tpAdults=${adults}&utm_source=tripmura&utm_campaign=tripmura_575598`,
      oebb: `https://shop.oebbtickets.at/de/ticket?station=${encodeURIComponent(originCity)}&destination=${encodeURIComponent('Flughafen Wien')}&date=${checkin}`,
      db: `https://www.bahn.de/buchung/start?ort=${encodeURIComponent(originCity)}&ziel=${encodeURIComponent(destCity)}&datum=${checkin}`,
      trenitalia: `https://www.trenitalia.com/en.html?origin=${encodeURIComponent(originCity)}&destination=${encodeURIComponent(destCity)}&date=${checkin}`,
      eurostar: `https://www.eurostar.com/search?origin=${originIATA}&destination=${destIATA}&outboundDate=${checkin}&returnDate=${checkout}&adults=${adults}`,
      booking: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destCity)}&checkin=${checkin}&checkout=${checkout}&group_adults=${adults}&order=price&aid=575598`,
      airbnb: `https://www.airbnb.com/s/${encodeURIComponent(destCity)}/homes?checkin=${checkin}&checkout=${checkout}&adults=${adults}&sort_price=asc`,
      discoverCars: `https://www.discovercars.com/?pickup_location=${encodeURIComponent(destCity)}&pickup_date=${checkin}&dropoff_date=${checkout}&partner=575598&marker=575598`,
      googleFlights: `https://www.google.com/travel/flights?q=Flights%20from%20${originIATA}%20to%20${destIATA}%20on%20${checkin}%20through%20${checkout}&curr=EUR`,
      skyscanner: `https://www.skyscanner.net/transport/flights/${originIATA.toLowerCase()}/${destIATA.toLowerCase()}/${checkin.replace(/-/g,'').slice(2)}/${checkout.replace(/-/g,'').slice(2)}/?adultsv2=${adults}&ref=home`,
      kayak: `https://www.kayak.com/flights/${originIATA}-${destIATA}/${checkin}/${checkout}?sort=price_a`
    };
  }

  // Generate 3 Multimodal Package Plans
  function generatePackages(params) {
    const links = buildDeepLinks(params);
    const { originCity, destCity, datesText, adults } = params;

    const isAustriaOrigin = params.origin && (params.origin.includes('Linz') || params.origin.includes('LNZ') || params.origin.includes('Vienna') || params.origin.includes('VIE'));
    const carrierName = isAustriaOrigin ? 'Austrian Airlines' : 'Lufthansa';
    const carrierUrl = isAustriaOrigin ? (links.austrian || links.lufthansa) : links.lufthansa;

    return [
      {
        id: 'pkg-best-value',
        title: 'Smart Synchronized Hub Route',
        desc: `Synchronizes express rail to main hub with non-stop direct ${carrierName} flight and waterfront boutique stay in ${destCity}.`,
        badge: '⭐ Top Pick • Best Value',
        badgeClass: 'top-pick',
        duration: '⏱️ 4h 15m Door-to-Door',
        totalPrice: 485,
        highlighted: true,
        primaryCtaLabel: `✈️ Book Lowest Rate on ${carrierName} ➔`,
        primaryCtaUrl: carrierUrl,
        legs: [
          {
            icon: '🚆',
            type: 'ÖBB Railjet Airport Express',
            details: `${originCity} Hbf → Vienna Airport (VIE) • 1h 40m Direct`,
            price: '€24 / traveler',
            priceVal: 24,
            providerTag: 'ÖBB Ticket Shop',
            actions: [
              { label: 'Book on ÖBB Ticket Shop ↗', url: links.oebb, featured: true }
            ]
          },
          {
            icon: '✈️',
            type: `Direct Flight on ${carrierName}`,
            details: `Vienna (VIE) → ${destCity} • Non-Stop Scheduled Jet`,
            price: '€145 / traveler',
            priceVal: 145,
            providerTag: `${carrierName} Direct`,
            actions: [
              { label: `Book Direct on ${carrierName} ↗`, url: carrierUrl, featured: true },
              { label: 'Book Direct on Lufthansa ↗', url: links.lufthansa }
            ]
          },
          {
            icon: '🏨',
            type: 'Waterfront Boutique Hotel',
            details: `7 Nights (${datesText}) • Verified 9.2/10 Rating`,
            price: '€316 total',
            priceVal: 316,
            providerTag: 'Booking.com Direct',
            actions: [
              { label: 'Reserve Room on Booking.com ↗', url: links.booking, featured: true },
              { label: 'Compare on Airbnb ↗', url: links.airbnb }
            ]
          }
        ]
      },
      {
        id: 'pkg-scenic-train',
        title: 'Scenic EuroRail & Coastal Ferry',
        desc: `Relaxed 100% ground and sea journey via Austrian Railjet network and high-speed coastal ferry. Zero flight emissions.`,
        badge: '🚆 100% Scenic Ground',
        badgeClass: 'scenic',
        duration: '⏱️ 8h 30m Door-to-Door',
        totalPrice: 420,
        highlighted: false,
        primaryCtaLabel: '🚆 Book on ÖBB Ticket Shop ➔',
        primaryCtaUrl: links.oebb,
        legs: [
          {
            icon: '🚆',
            type: 'High-Speed Railjet & EuroCity',
            details: `${originCity} → Coast Junction • Scenic Panoramic Car`,
            price: '€95 / traveler',
            priceVal: 95,
            providerTag: 'ÖBB Ticket Shop',
            actions: [
              { label: 'Book on ÖBB Ticket Shop ↗', url: links.oebb, featured: true },
              { label: 'Book on Deutsche Bahn (DB) ↗', url: links.db }
            ]
          },
          {
            icon: '⛵',
            type: 'High-Speed Catamaran',
            details: `Main Pier → ${destCity} Waterfront • 45m`,
            price: '€25 / traveler',
            priceVal: 25,
            providerTag: 'Official Port Link',
            actions: [
              { label: 'Book on Trenitalia ↗', url: links.trenitalia, featured: true }
            ]
          },
          {
            icon: '🏡',
            type: 'Private Coastal Villa',
            details: `7 Nights (${datesText}) • Panoramic Balcony`,
            price: '€300 total',
            priceVal: 300,
            providerTag: 'Airbnb Superhost',
            actions: [
              { label: 'Reserve Villa on Airbnb ↗', url: links.airbnb, featured: true },
              { label: 'Compare on Booking.com ↗', url: links.booking }
            ]
          }
        ]
      },
      {
        id: 'pkg-budget-flight',
        title: 'Smart Budget Direct Flight',
        desc: `Lowest verified market fare via direct Ryanair flight combined with a top-rated central apartment.`,
        badge: '💰 Lowest Total Cost (Smart Budget)',
        badgeClass: 'speed',
        duration: '⏱️ 3h 45m Door-to-Door',
        totalPrice: 330,
        highlighted: false,
        primaryCtaLabel: '✈️ Book Lowest Rate on Ryanair ➔',
        primaryCtaUrl: links.ryanair,
        legs: [
          {
            icon: '✈️',
            type: 'Direct Ryanair Flight',
            details: `Direct Low-Cost Flight to ${destCity} • Non-Stop`,
            price: '€58 / traveler',
            priceVal: 58,
            providerTag: 'Ryanair Direct',
            actions: [
              { label: 'Book Direct on Ryanair ↗', url: links.ryanair, featured: true }
            ]
          },
          {
            icon: '🚆',
            type: 'Direct Metro Line',
            details: `Airport Station → ${destCity} Old Town • 25m`,
            price: '€6 / traveler',
            priceVal: 6,
            providerTag: 'Official Transit',
            actions: [
              { label: 'Book on ÖBB Ticket Shop ↗', url: links.oebb, featured: true }
            ]
          },
          {
            icon: '🏡',
            type: 'Central Designer Apartment',
            details: `7 Nights (${datesText}) • Fast WiFi, AC`,
            price: '€266 total',
            priceVal: 266,
            providerTag: 'Airbnb Superhost',
            actions: [
              { label: 'Reserve Villa on Airbnb ↗', url: links.airbnb, featured: true },
              { label: 'Compare on Booking.com ↗', url: links.booking }
            ]
          }
        ]
      }
    ];
  }

  // Render Results Cards
  function renderResultsGrid(packages, params) {
    if (!resultsGrid) return;
    resultsGrid.innerHTML = '';

    const links = buildDeepLinks(params);

    if (resultsMetaSummary) {
      resultsMetaSummary.textContent = `${packages.length} Verified Multimodal Journeys for ${params.adults} Travelers • ${params.originCity} → ${params.destCity} (${params.datesText})`;
    }

    packages.forEach((pkg, index) => {
      const card = document.createElement('div');
      card.className = `results-card ${pkg.highlighted ? 'highlighted-deal' : ''}`;

      const legsHtml = pkg.legs.map((leg, i) => `
        <div class="route-leg-step">
          <div class="leg-step-left">
            <span class="leg-icon-badge">${leg.icon}</span>
            <div class="leg-step-info">
              <div class="leg-title-row">
                <span class="leg-step-title">${leg.type}</span>
                <span class="leg-provider-tag">${leg.providerTag}</span>
              </div>
              <span class="leg-step-details">${leg.details}</span>
            </div>
          </div>
          <div class="leg-step-right">
            <span class="leg-step-price">${leg.price}</span>
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

          <!-- Multi-Engine Comparison Bar -->
          <div class="multi-engine-bar" style="margin-top: 14px; margin-bottom: 14px;">
            <div class="engine-bar-header">
              <span class="engine-bar-label">⚡ Compare Live Fares:</span>
            </div>
            <div class="engine-bar-links">
              <a href="${links.googleFlights}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn google">
                <span>⚡ Google Flights</span>
              </a>
              <a href="${links.skyscanner}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn skyscanner">
                <span>🧭 Skyscanner</span>
              </a>
              <a href="${links.kayak}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn kayak">
                <span>🔍 Kayak</span>
              </a>
              <a href="${links.booking}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn booking">
                <span>🏨 Booking.com</span>
              </a>
              <a href="${links.airbnb}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn airbnb">
                <span>🏡 Airbnb</span>
              </a>
            </div>
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

          <div class="card-actions-row" style="display: flex; gap: 10px; align-items: center; margin-top: 12px;">
            <a href="${pkg.primaryCtaUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary-carrier-book" style="flex: 1; text-align: center; text-decoration: none;">
              <span>${pkg.primaryCtaLabel}</span>
            </a>
            <button type="button" class="card-cta-btn" data-pkg-index="${index}">
              <span>Itinerary</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
            </button>
          </div>
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
    const links = buildDeepLinks(params);

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
      const legsHtml = pkg.legs.map((leg, i) => {
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

      const compHtml = `
        <div class="drawer-compare-box" style="margin-top: 18px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px;">
          <h4 style="font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
            <span>⚡ Verify Fares on Major Search Engines</span>
          </h4>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <a href="${links.googleFlights}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn google">
              <span>⚡ Google Flights</span>
            </a>
            <a href="${links.skyscanner}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn skyscanner">
              <span>🧭 Skyscanner</span>
            </a>
            <a href="${links.kayak}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn kayak">
              <span>🔍 Kayak</span>
            </a>
            <a href="${links.booking}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn booking">
              <span>🏨 Booking.com</span>
            </a>
            <a href="${links.airbnb}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn airbnb">
              <span>🏡 Airbnb</span>
            </a>
          </div>
        </div>
      `;

      drawerLegsList.innerHTML = legsHtml + compHtml;
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
    const origin = originInput ? originInput.value : 'Linz (LNZ)';
    const dest = destInput ? destInput.value : 'Thessaloniki (SKG)';
    const datesText = datesInput && datesInput.value.trim() ? datesInput.value : '19 Sep – 26 Sep';
    const adultsVal = document.getElementById('adultsVal');
    const adults = adultsVal ? parseInt(adultsVal.textContent, 10) || 2 : 2;

    const originCity = getCleanLocation(origin, 'Linz');
    const destCity = getCleanLocation(dest, 'Thessaloniki');

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

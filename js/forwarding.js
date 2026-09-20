/**
 * TripMura v2 — Verified Direct Booking URL Builders & Forwarding Router
 * Direct Airline Portals (British Airways, Lufthansa, Austrian, Ryanair, Wizz Air, EasyJet)
 * Direct Accommodation & Rail Portals (Booking.com, Airbnb, Trainline, ÖBB)
 * Aviasales Live Proposal Deep-Links (Partner Marker: 779382, Token: 178a7f6702fe3171dcbd333a9527840c)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FORWARDING_ENGINE = factory();
    root.TripMuraForwarding = root.FORWARDING_ENGINE;
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const CONFIG = (typeof window !== 'undefined' && window.TRIPMURA_CONFIG) ? window.TRIPMURA_CONFIG : {
    travelpayouts: {
      token: '178a7f6702fe3171dcbd333a9527840c',
      marker: '779382'
    },
    affiliate: {
      bookingAid: '779382',
      marker: '779382'
    }
  };

  const MARKER = (CONFIG.travelpayouts && CONFIG.travelpayouts.marker) ? CONFIG.travelpayouts.marker : '779382';
  const BOOKING_AID = (CONFIG.affiliate && CONFIG.affiliate.bookingAid) ? CONFIG.affiliate.bookingAid : '779382';

  const FORWARDING_ENGINE = {
    // 1. British Airways Direct Booking
    buildBritishAirwaysUrl(originIata, destIata, departDate, returnDate, adults = 1, cabin = 'economy') {
      const isRound = !!(returnDate && String(returnDate).trim() && String(returnDate) !== 'null' && String(returnDate) !== 'undefined');
      const orig = (originIata || 'LON').toUpperCase();
      const dest = (destIata || 'VIE').toUpperCase();
      let url = `https://www.britishairways.com/nx/b/airselect/en/gbr/book/search/?from=${orig}&to=${dest}&departureDate=${departDate}&adults=${adults}&youngAdults=0&children=0&infants=0&travelClass=${cabin}&trip=${isRound ? 'round' : 'oneway'}&bound=outbound`;
      if (isRound) url += `&arrivalDate=${returnDate}`;
      return url;
    },

    // 2. Lufthansa & Austrian Airlines Direct Booking
    buildLufthansaUrl(originIata, destIata, departDate, returnDate, adults = 1) {
      const orig = (originIata || 'MUC').toUpperCase();
      const dest = (destIata || 'SKG').toUpperCase();
      return `https://www.lufthansa.com/at/de/flugsuche?origin=${orig}&destination=${dest}&outboundDate=${departDate}&inboundDate=${returnDate || ''}&adults=${adults}`;
    },

    buildAustrianUrl(originIata, destIata, departDate, returnDate, adults = 1) {
      const orig = (originIata || 'VIE').toUpperCase();
      const dest = (destIata || 'SKG').toUpperCase();
      return `https://www.austrian.com/at/de/book-and-manage/flights?origin=${orig}&destination=${dest}&departDate=${departDate}&returnDate=${returnDate || ''}&adults=${adults}`;
    },

    // 3. Ryanair Direct Booking
    buildRyanairUrl(originIata, destIata, departDate, returnDate, adults = 1) {
      const orig = (originIata || 'VIE').toUpperCase();
      const dest = (destIata || 'PMI').toUpperCase();
      const isReturn = !!(returnDate && String(returnDate).trim() && String(returnDate) !== 'null' && String(returnDate) !== 'undefined');
      return `https://www.ryanair.com/at/de/trip/flights/select?originIata=${orig}&destinationIata=${dest}&dateOut=${departDate}&dateIn=${returnDate || ''}&adults=${adults}&isReturn=${isReturn}`;
    },

    // 4. Wizz Air & EasyJet Direct Booking
    buildWizzAirUrl(originIata, destIata, departDate, returnDate, adults = 1) {
      const orig = (originIata || 'VIE').toUpperCase();
      const dest = (destIata || 'SKG').toUpperCase();
      return `https://wizzair.com/en-gb/flights/${orig}/${dest}/${departDate}/${returnDate || departDate}/${adults}/0/0`;
    },

    buildEasyJetUrl(originIata, destIata, departDate, returnDate, adults = 1) {
      const orig = (originIata || 'LGW').toUpperCase();
      const dest = (destIata || 'PMI').toUpperCase();
      return `https://www.easyjet.com/en/buy/flights?origin=${orig}&destination=${dest}&departureDate=${departDate}&returnDate=${returnDate || ''}&adults=${adults}`;
    },

    // 5. Official Aviasales Live Deal URL (Marker: 779382)
    buildAviasalesUrl(originIata, destIata, departDate, returnDate, adults = 1) {
      const orig = (originIata || 'LON').toUpperCase();
      const dest = (destIata || 'PMI').toUpperCase();
      const formatDDMM = (dStr) => {
        if (!dStr) return '';
        if (typeof dStr === 'string' && dStr.includes('-')) {
          const parts = dStr.split('-');
          if (parts.length === 3) {
            return `${parts[2].padStart(2, '0')}${parts[1].padStart(2, '0')}`;
          }
        }
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return '';
        return `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}`;
      };
      const dep = formatDDMM(departDate);
      const ret = (returnDate && String(returnDate).trim() && String(returnDate) !== 'null' && String(returnDate) !== 'undefined') ? formatDDMM(returnDate) : '';
      const segment = ret ? `${orig}${dep}${dest}${ret}${adults || 1}` : `${orig}${dep}${dest}${adults || 1}`;
      return `https://www.aviasales.com/search/${segment}?marker=${encodeURIComponent(MARKER)}`;
    },

    // 6. Airbnb Direct Accommodation URL
    buildAirbnbUrl(destCity, checkin, checkout, adults = 1, roomId = null) {
      if (roomId) {
        return `https://www.airbnb.com/rooms/${roomId}?adults=${adults}&check_in=${checkin}&check_out=${checkout}&search_mode=regular_search`;
      }
      return `https://www.airbnb.com/s/${encodeURIComponent(destCity)}/homes?adults=${adults}&check_in=${checkin}&check_out=${checkout}&search_mode=regular_search`;
    },

    // 7. Booking.com Direct Specific Hotel URL
    buildBookingComUrl(destCity, checkin, checkout, adults = 1, hotelSlug = null, countryCode = 'es') {
      const base = hotelSlug 
        ? `https://www.booking.com/hotel/${countryCode}/${hotelSlug}.html`
        : `https://www.booking.com/searchresults.html`;
      const params = new URLSearchParams({
        ss: destCity,
        checkin: checkin,
        checkout: checkout,
        group_adults: String(adults),
        no_rooms: '1',
        order: 'price',
        aid: BOOKING_AID,
        label: `tp${MARKER}`
      });
      return `${base}?${params.toString()}`;
    },

    // 8. Trainline & ÖBB Direct Rail URLs
    buildTrainlineUrl(originCity, destCity, departDate, returnDate, adults = 1) {
      return `https://www.thetrainline.com/book/results?origin=${encodeURIComponent(originCity)}&destination=${encodeURIComponent(destCity)}&outwardDate=${departDate}&returnDate=${returnDate || ''}&passengers=${adults}`;
    },

    buildOebbUrl(originCity, destCity, departDate) {
      return `https://shop.oebbtickets.at/de/ticket?station=${encodeURIComponent(originCity)}&destination=${encodeURIComponent(destCity)}&date=${departDate}`;
    },

    // Master Forwarding Interstitial Router
    triggerForwarding(providerName, targetUrl, priceText, dealDetails = {}) {
      if (!targetUrl) return;

      const overlay = document.getElementById('forwardingOverlay') || document.getElementById('tripMuraForwardingModal');
      const backdrop = document.getElementById('tripMuraForwardingBackdrop');

      const providerEl = document.getElementById('forwardingProviderText') || document.getElementById('forwardingProviderName');
      const dealEl = document.getElementById('forwardingDealText') || document.getElementById('forwardingVerifiedText');
      const routeEl = document.getElementById('forwardingRouteText');
      const datesEl = document.getElementById('forwardingDatesText');
      const paxEl = document.getElementById('forwardingPaxText');
      const manualLink = document.getElementById('forwardingManualLink');
      const progressBar = document.getElementById('forwardingProgressBar');

      const cleanProvider = providerName || 'Official Partner';
      const cleanPrice = priceText ? (String(priceText).startsWith('€') ? priceText : `€${priceText}`) : 'Verified Rate';

      if (providerEl) {
        if (providerEl.id === 'forwardingProviderText') {
          providerEl.textContent = `Taking you to ${cleanProvider}...`;
        } else {
          providerEl.textContent = cleanProvider;
        }
      }

      if (dealEl) {
        dealEl.textContent = `Securing your booking for ${cleanPrice} • TripMura Verified Deal`;
      }

      if (routeEl && dealDetails.route) routeEl.textContent = dealDetails.route;
      if (datesEl && dealDetails.dates) datesEl.textContent = dealDetails.dates;
      if (paxEl && dealDetails.pax) paxEl.textContent = dealDetails.pax;

      if (progressBar) {
        progressBar.style.animation = 'none';
        progressBar.offsetHeight;
        progressBar.style.animation = 'forwardingProgress 1.1s cubic-bezier(0.1, 0.7, 0.1, 1) forwards';
      }

      if (manualLink) {
        manualLink.onclick = () => {
          window.open(targetUrl, '_blank');
          closeOverlay();
        };
      }

      function closeOverlay() {
        if (overlay) {
          overlay.style.display = 'none';
          overlay.classList.remove('open');
          overlay.setAttribute('aria-hidden', 'true');
        }
        if (backdrop) {
          backdrop.classList.remove('open');
        }
        document.body.classList.remove('search-modal-open');
      }

      if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
      }
      if (backdrop) {
        backdrop.classList.add('open');
        backdrop.onclick = closeOverlay;
      }
      document.body.classList.add('search-modal-open');

      // Forward after 1.1s
      setTimeout(() => {
        window.open(targetUrl, '_blank');
        setTimeout(() => {
          closeOverlay();
        }, 400);
      }, 1100);
    }
  };

  // Global window exposure
  if (typeof window !== 'undefined') {
    window.FORWARDING_ENGINE = FORWARDING_ENGINE;
    window.triggerTripMuraForwarding = (name, url, price, details) => {
      FORWARDING_ENGINE.triggerForwarding(name, url, price, details);
    };
  }

  return FORWARDING_ENGINE;
}));

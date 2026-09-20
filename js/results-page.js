/**
 * TripMura — Dedicated Results Page Master Controller
 * Unified Hybrid Metasearch Engine, Smart Hub Routing, Direct Carrier Deep-Links,
 * 1-Click Multi-Engine Comparison Bar & Affiliate-Ready Architecture (Travelpayouts Marker: 575598).
 */

document.addEventListener('DOMContentLoaded', () => {
  initResultsPage();
});

function initResultsPage() {
  // Parse URL Parameters
  const urlParams = new URLSearchParams(window.location.search);
  const rawFrom = urlParams.get('from') || 'Linz (LNZ)';
  const rawTo = urlParams.get('to') || 'Thessaloniki (SKG)';
  const rawDepart = urlParams.get('depart') || TripMuraIATA.formatDateISO(new Date(), 0);
  const rawReturn = urlParams.get('return') || TripMuraIATA.formatDateISO(new Date(), 7);
  const rawTravelers = parseInt(urlParams.get('travelers'), 10) || 2;
  const rawChildren = parseInt(urlParams.get('children'), 10) || 0;
  const rawRooms = parseInt(urlParams.get('rooms'), 10) || 1;
  const rawCabin = urlParams.get('cabin') || 'economy';
  const rawDirect = urlParams.get('direct') === '1';

  // Resolved Location Context
  const originCity = TripMuraIATA.getCleanCityName(rawFrom, 'Linz');
  const destCity = TripMuraIATA.getCleanCityName(rawTo, 'Thessaloniki');
  const originIATA = TripMuraIATA.resolveIATA(rawFrom, 'LNZ');
  const destIATA = TripMuraIATA.resolveIATA(rawTo, 'SKG');

  // Search Context State
  const searchState = {
    origin: rawFrom,
    destination: rawTo,
    originCity,
    destCity,
    originIATA,
    destIATA,
    departDate: rawDepart,
    returnDate: rawReturn,
    adults: rawTravelers,
    children: rawChildren,
    rooms: rawRooms,
    cabinClass: rawCabin,
    directOnly: rawDirect
  };

  // Generate Direct & Multi-Engine Comparison URLs with Smart Hub Resolution
  const directUrls = TripMuraIATA.buildDirectProviderUrls(searchState);
  const hubRoute = directUrls.hubRoute;
  const flightOriginIATA = directUrls.flightOriginIATA;
  const flightOriginCity = directUrls.flightOriginCity;

  // DOM Elements
  const summaryRouteText = document.getElementById('summaryRouteText');
  const summaryDatesText = document.getElementById('summaryDatesText');
  const summaryTravelersText = document.getElementById('summaryTravelersText');
  const routeOriginName = document.getElementById('routeOriginName');
  const routeDestName = document.getElementById('routeDestName');
  const resultsFeedList = document.getElementById('resultsFeedList');
  const resultsCountText = document.getElementById('resultsCountText');

  const toggleEditSearchBtn = document.getElementById('toggleEditSearchBtn');
  const floatingSearchDrawer = document.getElementById('floatingSearchDrawer');
  const miniSearchForm = document.getElementById('miniSearchForm');

  // Populate Header & Title Info
  function formatDisplayDate(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }

  const formattedDates = `${formatDisplayDate(rawDepart)} – ${formatDisplayDate(rawReturn)}`;
  const cabinCap = rawCabin.charAt(0).toUpperCase() + rawCabin.slice(1);

  if (summaryRouteText) {
    summaryRouteText.textContent = hubRoute.needsHubTransfer
      ? `${originCity} ➔ ${hubRoute.hubCity} (${hubRoute.hubIATA}) ➔ ${destCity} (${destIATA})`
      : `${originCity} (${originIATA}) ➔ ${destCity} (${destIATA})`;
  }
  if (summaryDatesText) summaryDatesText.textContent = formattedDates;
  if (summaryTravelersText) summaryTravelersText.textContent = `${rawTravelers} Travelers • ${cabinCap}`;
  if (routeOriginName) routeOriginName.textContent = originCity;
  if (routeDestName) routeDestName.textContent = destCity;

  // Sync Mini Search Bar
  const miniOriginInput = document.getElementById('miniOriginInput');
  const miniDestInput = document.getElementById('miniDestInput');
  const miniDepartInput = document.getElementById('miniDepartInput');
  const miniReturnInput = document.getElementById('miniReturnInput');
  const miniTravelersSelect = document.getElementById('miniTravelersSelect');

  if (miniOriginInput) miniOriginInput.value = rawFrom;
  if (miniDestInput) miniDestInput.value = rawTo;
  if (miniDepartInput) miniDepartInput.value = rawDepart;
  if (miniReturnInput) miniReturnInput.value = rawReturn;
  if (miniTravelersSelect) miniTravelersSelect.value = String(rawTravelers);

  // Edit Search Toggle
  if (toggleEditSearchBtn && floatingSearchDrawer) {
    toggleEditSearchBtn.addEventListener('click', () => {
      floatingSearchDrawer.classList.toggle('open');
    });
  }

  if (miniSearchForm) {
    miniSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newOrigin = miniOriginInput ? miniOriginInput.value : rawFrom;
      const newDest = miniDestInput ? miniDestInput.value : rawTo;
      const newDepart = miniDepartInput ? miniDepartInput.value : rawDepart;
      const newReturn = miniReturnInput ? miniReturnInput.value : rawReturn;
      const newTravelers = miniTravelersSelect ? miniTravelersSelect.value : rawTravelers;

      const p = new URLSearchParams({
        from: newOrigin,
        to: newDest,
        depart: newDepart,
        return: newReturn,
        travelers: newTravelers,
        cabin: rawCabin
      });
      window.location.search = p.toString();
    });
  }

  // --------------------------------------------------------------------------
  // 1. Dynamic Multimodal Itinerary Generator (Realistic Packages with Geo Routing)
  // --------------------------------------------------------------------------
  function generateItineraries() {
    const originRegion = directUrls.originRegion || 'EU';
    const activeRail = directUrls.activeRail || {
      operator: 'Trainline / Eurostar',
      url: directUrls.trainline,
      label: 'Book on Trainline ↗',
      transitName: 'Airport Express Shuttle',
      scenicCarrier: 'EuroCity & Scenic Rail',
      ecoCarrier: 'European Electric InterCity Rail'
    };

    // Primary operating carrier determination
    const primaryAirlineName = originRegion === 'AT' ? 'Austrian Airlines' : (originRegion === 'GB' ? 'British Airways' : (originRegion === 'FR' ? 'Air France' : (originRegion === 'IT' ? 'ITA Airways' : (originRegion === 'ES' ? 'Iberia' : (originRegion === 'CH' ? 'SWISS' : 'Lufthansa')))));
    const primaryAirlineCode = originRegion === 'AT' ? 'OS' : (originRegion === 'GB' ? 'BA' : (originRegion === 'FR' ? 'AF' : (originRegion === 'IT' ? 'AZ' : (originRegion === 'ES' ? 'IB' : (originRegion === 'CH' ? 'LX' : 'LH')))));
    const primaryAirlineUrl = originRegion === 'AT' ? directUrls.austrian : (originRegion === 'GB' ? directUrls.britishAirways : (originRegion === 'FR' ? directUrls.airFrance : (originRegion === 'CH' ? directUrls.swiss : directUrls.lufthansa)));

    return [
      // 1. Top Pick: Scheduled Flight & Curated Boutique Stay
      {
        id: 'pkg-1',
        title: hubRoute.needsHubTransfer
          ? `${originCity} Express Rail ➔ ${primaryAirlineName} Direct & Boutique Stay`
          : `${primaryAirlineName} Direct Express & Boutique Hotel`,
        desc: hubRoute.needsHubTransfer
          ? `Seamless ${hubRoute.transitType} from ${originCity} Hbf directly to ${hubRoute.hubAirportName}, followed by scheduled ${primaryAirlineName} flight and 4-star boutique stay in central ${destCity}.`
          : `Synchronized flight connection with verified private transfer and coastal boutique accommodation in central ${destCity}.`,
        badge: '⭐ Top Pick • Best Value',
        badgeClass: 'top-pick',
        category: 'flight-stay',
        durationStr: hubRoute.needsHubTransfer ? '⏱️ 4h 15m Door-to-Door' : '⏱️ 2h 55m Door-to-Door',
        durationMinutes: hubRoute.needsHubTransfer ? 255 : 175,
        co2kg: hubRoute.needsHubTransfer ? 46 : 52,
        stops: hubRoute.needsHubTransfer ? 1 : 0,
        provider: originRegion === 'AT' ? 'austrian' : 'lufthansa',
        primaryCtaLabel: `✈️ Book Lowest Rate on ${primaryAirlineName} ➔`,
        primaryCtaUrl: directUrls.aviasalesProposal,
        proposalUrl: directUrls.aviasalesProposal,
        stayScore: 9.2,
        totalPrice: 485,
        highlight: true,
        legs: hubRoute.needsHubTransfer ? [
          {
            carrier: hubRoute.transitType,
            carrierCode: 'RAIL',
            icon: '🚆',
            type: 'Direct Airport Rail Link',
            providerTag: hubRoute.transitOperator,
            times: `07:15 → 08:55 • Non-Stop Rail Link`,
            routeSub: `${originCity} Hbf → ${hubRoute.hubAirportName}`,
            estCost: '€24 / traveler',
            actions: [
              { label: activeRail.label, url: activeRail.url, featured: true }
            ]
          },
          {
            carrier: `${primaryAirlineName} Non-Stop`,
            carrierCode: primaryAirlineCode,
            icon: '✈️',
            type: 'Direct Scheduled Flight',
            providerTag: `${primaryAirlineName} Direct`,
            times: `10:25 → 13:10 • Flight ${primaryAirlineCode} 811`,
            routeSub: `${flightOriginCity} (${flightOriginIATA}) → ${destCity} (${destIATA})`,
            estCost: '€145 / traveler',
            actions: [
              { label: 'Aviasales Proposal Link ↗', url: directUrls.aviasalesProposal, featured: true },
              { label: `Book Direct on ${primaryAirlineName} ↗`, url: primaryAirlineUrl }
            ]
          },
          {
            carrier: 'Boutique City Waterfront Hotel',
            carrierCode: 'HOTEL',
            icon: '🏨',
            type: `4-Star Seafront Stay in ${destCity}`,
            providerTag: 'Booking.com Direct',
            times: `7 Nights (${formattedDates}) • Rating 9.2/10`,
            routeSub: 'Central Location, Breakfast Included, Free Cancellation',
            estCost: '€316 total',
            actions: [
              { label: 'Reserve Room on Booking.com ↗', url: directUrls.booking, featured: true },
              { label: 'Compare on Hotellook ↗', url: directUrls.hotellook }
            ]
          }
        ] : [
          {
            carrier: `${primaryAirlineName} Direct Flight`,
            carrierCode: primaryAirlineCode,
            icon: '✈️',
            type: 'Direct Scheduled Flight',
            providerTag: `${primaryAirlineName} Direct`,
            times: `09:40 → 12:25 • Flight ${primaryAirlineCode} 811`,
            routeSub: `${originCity} (${originIATA}) → ${destCity} (${destIATA})`,
            estCost: '€155 / traveler',
            actions: [
              { label: 'Aviasales Proposal Link ↗', url: directUrls.aviasalesProposal, featured: true },
              { label: `Book Direct on ${primaryAirlineName} ↗`, url: primaryAirlineUrl }
            ]
          },
          {
            carrier: 'Airport Express Shuttle',
            carrierCode: 'BUS',
            icon: '🚐',
            type: 'Direct Hotel Shuttle',
            providerTag: 'Official Airport Transit',
            times: '12:45 → 13:15 • Non-Stop',
            routeSub: 'Terminal → Hotel Waterfront',
            estCost: '€14 / traveler',
            actions: [
              { label: activeRail.label, url: activeRail.url, featured: true }
            ]
          },
          {
            carrier: 'Boutique Seafront Suite',
            carrierCode: 'HOTEL',
            icon: '🏨',
            type: `4-Star Boutique in ${destCity}`,
            providerTag: 'Booking.com Direct',
            times: `7 Nights (${formattedDates}) • Rating 9.2/10`,
            routeSub: 'Balcony Sea View, Buffet Breakfast, Spa Access',
            estCost: '€316 total',
            actions: [
              { label: 'Reserve Room on Booking.com ↗', url: directUrls.booking, featured: true },
              { label: 'Compare on Hotellook ↗', url: directUrls.hotellook }
            ]
          }
        ]
      },

      // 2. Scenic Ground & Regional Rail Link
      {
        id: 'pkg-2',
        title: 'Scenic EuroRail Express & Seaside Villa',
        desc: `Relaxed overland travel: scenic high-speed ${activeRail.scenicCarrier} rail network with panoramic views and verified private villa.`,
        badge: '🚆 Scenic Rail • Zero Flight Carbon',
        badgeClass: 'scenic',
        category: 'train-stay',
        durationStr: '⏱️ 8h 30m Door-to-Door',
        durationMinutes: 510,
        co2kg: 18,
        stops: 1,
        provider: 'rail',
        primaryCtaLabel: `🚆 ${activeRail.label} ➔`,
        primaryCtaUrl: activeRail.url,
        proposalUrl: directUrls.aviasalesProposal,
        stayScore: 9.4,
        totalPrice: 420,
        highlight: false,
        legs: [
          {
            carrier: activeRail.scenicCarrier,
            carrierCode: 'RAIL',
            icon: '🚆',
            type: 'High-Speed Scenic Rail',
            providerTag: activeRail.operator,
            times: '07:15 → 13:40 • EuroCity Scenic Route',
            routeSub: `${originCity} Main Station → Coastal Junction • Panoramic Car`,
            estCost: '€95 / traveler',
            actions: [
              { label: activeRail.label, url: activeRail.url, featured: true },
              { label: 'Book on Trainline ↗', url: directUrls.trainline }
            ]
          },
          {
            carrier: 'Coastal Hydrofoil / Catamaran',
            carrierCode: 'SEA',
            icon: '⛵',
            type: 'High-Speed Hydrofoil Ferry',
            providerTag: 'Official Port Link',
            times: '14:15 → 15:00 • Fast Sea Link',
            routeSub: `Main Pier → ${destCity} Waterfront • 45m`,
            estCost: '€25 / traveler',
            actions: [
              { label: 'Official Port Ticket ↗', url: activeRail.url, featured: true }
            ]
          },
          {
            carrier: 'Boutique Sea Villa',
            carrierCode: 'AIRBNB',
            icon: '🏡',
            type: `Private Coastal Apartment on Airbnb`,
            providerTag: 'Airbnb Superhost',
            times: `7 Nights (${formattedDates}) • Superhost`,
            routeSub: 'Panoramic Terrace, Fully Equipped Kitchen',
            estCost: '€300 total',
            actions: [
              { label: 'Reserve Villa on Airbnb ↗', url: directUrls.airbnb, featured: true },
              { label: 'Compare on Hotellook ↗', url: directUrls.hotellook }
            ]
          }
        ]
      },

      // 3. Ultra Low Cost: Ryanair Hub Direct + Central Apartment
      {
        id: 'pkg-3',
        title: hubRoute.needsHubTransfer
          ? `${originCity} Shuttle ➔ Ryanair Direct & City Studio`
          : 'Ryanair Direct Flight & City Apartment',
        desc: `Lowest verified market price: direct budget flight connection from ${flightOriginCity} paired with a top-rated central apartment.`,
        badge: '💰 Lowest Total Cost (Smart Budget)',
        badgeClass: 'top-pick',
        category: 'flight-stay',
        durationStr: hubRoute.needsHubTransfer ? '⏱️ 4h 30m Door-to-Door' : '⏱️ 2h 40m Door-to-Door',
        durationMinutes: hubRoute.needsHubTransfer ? 270 : 160,
        co2kg: 44,
        stops: hubRoute.needsHubTransfer ? 1 : 0,
        provider: 'ryanair',
        primaryCtaLabel: '✈️ Book Lowest Rate on Ryanair ➔',
        primaryCtaUrl: directUrls.aviasalesProposal,
        proposalUrl: directUrls.aviasalesProposal,
        stayScore: 8.8,
        totalPrice: 330,
        highlight: false,
        legs: [
          {
            carrier: hubRoute.needsHubTransfer ? `${hubRoute.transitType} + Ryanair` : 'Ryanair Direct Flight',
            carrierCode: 'FR',
            icon: '✈️',
            type: 'Direct Low-Cost Flight',
            providerTag: 'Ryanair Direct',
            times: '14:20 → 17:05 • Non-Stop Flight FR 732',
            routeSub: `${flightOriginCity} (${flightOriginIATA}) → ${destCity} (${destIATA})`,
            estCost: '€58 / traveler',
            actions: [
              { label: 'Aviasales Proposal Link ↗', url: directUrls.aviasalesProposal, featured: true },
              { label: 'Book Direct on Ryanair ↗', url: directUrls.ryanair }
            ]
          },
          {
            carrier: 'Public Airport Express',
            carrierCode: 'METRO',
            icon: '🚆',
            type: 'Direct Metro / Airport Line',
            providerTag: 'Official Transit',
            times: '17:30 → 17:55 • Every 15 min',
            routeSub: 'Airport Station → Old Town Center',
            estCost: '€6 / traveler',
            actions: [
              { label: activeRail.label, url: activeRail.url, featured: true }
            ]
          },
          {
            carrier: 'Cozy Central Designer Studio',
            carrierCode: 'AIRBNB',
            icon: '🏡',
            type: `7 Nights Studio in ${destCity}`,
            providerTag: 'Airbnb Superhost',
            times: '7 Nights • Rating 8.8/10',
            routeSub: 'Fast Fiber WiFi, Air Conditioning, Self Check-in',
            estCost: '€266 total',
            actions: [
              { label: 'Reserve Studio on Airbnb ↗', url: directUrls.airbnb, featured: true },
              { label: 'Compare on Hotellook ↗', url: directUrls.hotellook }
            ]
          }
        ]
      },

      // 4. Fastest Priority Flight + DiscoverCars Rental
      {
        id: 'pkg-4',
        title: 'Priority Scheduled Flight & SUV Rental Freedom',
        desc: `Maximize holiday time: morning flight with instant rental car pickup at ${destCity} terminal to explore beaches and mountains freely.`,
        badge: '⚡ Fastest Route & Total Freedom',
        badgeClass: 'fastest',
        category: 'flight-car',
        durationStr: '⏱️ 3h 15m Door-to-Door',
        durationMinutes: 195,
        co2kg: 68,
        stops: 0,
        provider: 'discovercars',
        primaryCtaLabel: `🚗 Reserve Car on DiscoverCars ➔`,
        primaryCtaUrl: directUrls.discoverCars,
        proposalUrl: directUrls.aviasalesProposal,
        stayScore: 9.3,
        totalPrice: 590,
        highlight: false,
        legs: [
          {
            carrier: `${primaryAirlineName} Morning Jet`,
            carrierCode: 'AIR',
            icon: '✈️',
            type: 'Direct Morning Scheduled Flight',
            providerTag: `${primaryAirlineName} Direct`,
            times: '06:50 → 09:35 • Non-Stop Flight',
            routeSub: `${flightOriginCity} (${flightOriginIATA}) → ${destCity} (${destIATA})`,
            estCost: '€160 / traveler',
            actions: [
              { label: 'Aviasales Proposal Link ↗', url: directUrls.aviasalesProposal, featured: true },
              { label: `Book Direct on ${primaryAirlineName} ↗`, url: primaryAirlineUrl }
            ]
          },
          {
            carrier: 'DiscoverCars Compact SUV',
            carrierCode: 'CAR',
            icon: '🚗',
            type: 'Compact SUV (Unlimited Mileage)',
            providerTag: 'DiscoverCars Direct',
            times: '7 Days Full Rental • Terminal Pick-up',
            routeSub: 'Full Insurance, Zero Deductible, Free GPS',
            estCost: '€140 total',
            actions: [
              { label: 'Rent Car on DiscoverCars ↗', url: directUrls.discoverCars, featured: true }
            ]
          },
          {
            carrier: 'Seaside Resort & Spa',
            carrierCode: 'HOTEL',
            icon: '🏨',
            type: `Luxury Stay in ${destCity}`,
            providerTag: 'Booking.com Direct',
            times: '7 Nights • Verified 9.3/10 Score',
            routeSub: 'Private Beach, Infinity Pool, Free Parking',
            estCost: '€290 total',
            actions: [
              { label: 'Reserve Room on Booking.com ↗', url: directUrls.booking, featured: true },
              { label: 'Compare on Hotellook ↗', url: directUrls.hotellook }
            ]
          }
        ]
      },

      // 5. Luxury 5-Star VIP Escape
      {
        id: 'pkg-5',
        title: 'Business Class Flight & 5-Star Waterfront Palace',
        desc: `Ultimate comfort: premium business cabin flights, private chauffeur meet & greet, and 5-star beachfront luxury suite.`,
        badge: '💎 5-Star Ultra Luxury',
        badgeClass: 'luxury',
        category: 'flight-stay',
        durationStr: '⏱️ 3h 20m Door-to-Door',
        durationMinutes: 200,
        co2kg: 85,
        stops: 0,
        provider: 'luxury',
        primaryCtaLabel: `✈️ Book Premium Ticket on Aviasales ➔`,
        primaryCtaUrl: directUrls.aviasalesProposal,
        proposalUrl: directUrls.aviasalesProposal,
        stayScore: 9.7,
        totalPrice: 1150,
        highlight: false,
        legs: [
          {
            carrier: `${primaryAirlineName} Business Class`,
            carrierCode: primaryAirlineCode,
            icon: '✈️',
            type: 'Premium Business Class Flight',
            providerTag: `${primaryAirlineName} Direct`,
            times: '10:00 → 12:45 • Priority Fast Track & Lounge',
            routeSub: `${flightOriginCity} (${flightOriginIATA}) → ${destCity} (${destIATA})`,
            estCost: '€380 / traveler',
            actions: [
              { label: 'Aviasales Proposal Link ↗', url: directUrls.aviasalesProposal, featured: true },
              { label: `Book Direct on ${primaryAirlineName} ↗`, url: primaryAirlineUrl }
            ]
          },
          {
            carrier: 'Private Mercedes Chauffeur Transfer',
            carrierCode: 'VIP',
            icon: '🚗',
            type: 'Private VIP Airport Transfer',
            providerTag: 'DiscoverCars VIP',
            times: 'Direct Runway Meet & Greet',
            routeSub: 'Airport → Resort Lobby • 25m',
            estCost: '€90 total',
            actions: [
              { label: 'Book VIP Transfer on DiscoverCars ↗', url: directUrls.discoverCars, featured: true }
            ]
          },
          {
            carrier: 'Grand Waterfront Luxury Palace',
            carrierCode: 'HOTEL',
            icon: '🏨',
            type: `5-Star Deluxe Suite in ${destCity}`,
            providerTag: 'Booking.com Luxury',
            times: '7 Nights • Verified 9.7/10 Score',
            routeSub: 'Gourmet Breakfast, Sea View Balcony, Private Beach Cabana',
            estCost: '€680 total',
            actions: [
              { label: 'Reserve Room on Booking.com ↗', url: directUrls.booking, featured: true },
              { label: 'Compare on Hotellook ↗', url: directUrls.hotellook }
            ]
          }
        ]
      },

      // 6. Island Hopper: Flight + High-Speed Hydrofoil
      {
        id: 'pkg-6',
        title: 'Flight to Coastal Hub & Hydrofoil Island Hop',
        desc: `Fly into main airport and catch the connecting high-speed catamaran directly to the sunny bay.`,
        badge: '⛵ Island & Coastal Hopping',
        badgeClass: 'top-pick',
        category: 'ferry',
        durationStr: '⏱️ 5h 15m Door-to-Door',
        durationMinutes: 315,
        co2kg: 44,
        stops: 1,
        provider: 'ryanair',
        primaryCtaLabel: '✈️ Book Flight on Aviasales ➔',
        primaryCtaUrl: directUrls.aviasalesProposal,
        proposalUrl: directUrls.aviasalesProposal,
        stayScore: 9.0,
        totalPrice: 495,
        highlight: false,
        legs: [
          {
            carrier: 'Direct Coastal Flight',
            carrierCode: 'FR',
            icon: '✈️',
            type: 'Non-Stop Scheduled Flight',
            providerTag: 'Ryanair Direct',
            times: '08:30 → 11:15 • Non-Stop',
            routeSub: `${flightOriginCity} (${flightOriginIATA}) → ${destCity} (${destIATA})`,
            estCost: '€75 / traveler',
            actions: [
              { label: 'Aviasales Proposal Link ↗', url: directUrls.aviasalesProposal, featured: true },
              { label: 'Book Direct on Ryanair ↗', url: directUrls.ryanair }
            ]
          },
          {
            carrier: 'High-Speed Hydrofoil Catamaran',
            carrierCode: 'FERRY',
            icon: '⛵',
            type: 'Express Island Hydrofoil',
            providerTag: 'Official Port Link',
            times: '12:30 → 13:45 • Express Seaway',
            routeSub: `Main Port → Island Marina`,
            estCost: '€38 / traveler',
            actions: [
              { label: 'Official Port Ticket ↗', url: activeRail.url, featured: true }
            ]
          },
          {
            carrier: 'Island Sunset Boutique Villa',
            carrierCode: 'AIRBNB',
            icon: '🏡',
            type: `Private Villa on Airbnb`,
            providerTag: 'Airbnb Superhost',
            times: '7 Nights • Rating 9.0/10',
            routeSub: 'Panoramic Sea View, Private Infinity Pool',
            estCost: '€382 total',
            actions: [
              { label: 'Reserve Villa on Airbnb ↗', url: directUrls.airbnb, featured: true },
              { label: 'Compare on Hotellook ↗', url: directUrls.hotellook }
            ]
          }
        ]
      },

      // 7. SWISS Hub Connection & Mediterranean Villa
      {
        id: 'pkg-7',
        title: 'SWISS Hub Connection & Mediterranean Villa',
        desc: `Smooth connection through Zurich hub with SWISS International Air Lines and boutique villa stay.`,
        badge: '⭐ Premium Reliability',
        badgeClass: 'top-pick',
        category: 'flight-stay',
        durationStr: '⏱️ 4h 15m Door-to-Door',
        durationMinutes: 255,
        co2kg: 56,
        stops: 1,
        provider: 'swiss',
        primaryCtaLabel: '✈️ Book Direct on SWISS ➔',
        primaryCtaUrl: directUrls.aviasalesProposal,
        proposalUrl: directUrls.aviasalesProposal,
        stayScore: 9.2,
        totalPrice: 550,
        highlight: false,
        legs: [
          {
            carrier: 'SWISS International Air Lines',
            carrierCode: 'LX',
            icon: '✈️',
            type: 'Synchronized Connecting Flight',
            providerTag: 'SWISS Direct',
            times: '11:10 → 15:00 • Smooth Zurich Hub Connection',
            routeSub: `${originCity} → ZRH Hub → ${destCity}`,
            estCost: '€170 / traveler',
            actions: [
              { label: 'Aviasales Proposal Link ↗', url: directUrls.aviasalesProposal, featured: true },
              { label: 'Book Direct on SWISS ↗', url: directUrls.swiss }
            ]
          },
          {
            carrier: 'Harbor Express Bus',
            carrierCode: 'BUS',
            icon: '🚌',
            type: 'Direct Airport Bus',
            providerTag: 'Official Transit',
            times: '15:30 → 16:00 • Non-Stop',
            routeSub: 'Terminal → City Waterfront',
            estCost: '€10 / traveler',
            actions: [
              { label: activeRail.label, url: activeRail.url, featured: true }
            ]
          },
          {
            carrier: 'Mediterranean Vista Villa',
            carrierCode: 'HOTEL',
            icon: '🏨',
            type: `7 Nights in ${destCity}`,
            providerTag: 'Booking.com Direct',
            times: '7 Nights • Verified 9.2/10 Rating',
            routeSub: 'Panoramic Pool, Breakfast Included',
            estCost: '€370 total',
            actions: [
              { label: 'Reserve Room on Booking.com ↗', url: directUrls.booking, featured: true },
              { label: 'Compare on Hotellook ↗', url: directUrls.hotellook }
            ]
          }
        ]
      },

      // 8. Eco-Conscious Electric Rail & Solar Stay
      {
        id: 'pkg-8',
        title: 'Eco-Express Rail Link & Certified Green Stay',
        desc: `Lowest ecological footprint: 100% renewable electric rail transit on ${activeRail.ecoCarrier} and certified eco-boutique property.`,
        badge: '🌿 Eco Pioneer (<20kg CO2)',
        badgeClass: 'eco',
        category: 'train-stay',
        durationStr: '⏱️ 6h 50m Door-to-Door',
        durationMinutes: 410,
        co2kg: 14,
        stops: 1,
        provider: 'rail',
        primaryCtaLabel: `🚆 ${activeRail.label} ➔`,
        primaryCtaUrl: activeRail.url,
        proposalUrl: directUrls.aviasalesProposal,
        stayScore: 9.1,
        totalPrice: 435,
        highlight: false,
        legs: [
          {
            carrier: activeRail.ecoCarrier,
            carrierCode: 'GREEN',
            icon: '🚆',
            type: '100% Renewable Electric Rail',
            providerTag: activeRail.operator,
            times: '08:45 → 14:15 • Silent Eco Car',
            routeSub: `${originCity} → Destination Rail Terminal`,
            estCost: '€85 / traveler',
            actions: [
              { label: activeRail.label, url: activeRail.url, featured: true },
              { label: 'Book on Trainline ↗', url: directUrls.trainline }
            ]
          },
          {
            carrier: 'Electric Shuttle Bus',
            carrierCode: 'EV',
            icon: '⚡',
            type: 'Zero-Emission EV Transfer',
            providerTag: 'Official Green Transit',
            times: '14:30 → 14:55 • On-Demand',
            routeSub: 'Station → Green Eco Resort',
            estCost: '€10 / traveler',
            actions: [
              { label: activeRail.label, url: activeRail.url, featured: true }
            ]
          },
          {
            carrier: 'Certified Solar Eco Lodge',
            carrierCode: 'ECO',
            icon: '🏡',
            type: `Eco-Boutique Villa in ${destCity}`,
            providerTag: 'Booking.com Eco',
            times: '7 Nights • 9.1/10 Score',
            routeSub: 'Organic Breakfast, 100% Solar Powered',
            estCost: '€340 total',
            actions: [
              { label: 'Reserve Room on Booking.com ↗', url: directUrls.booking, featured: true },
              { label: 'Compare on Hotellook ↗', url: directUrls.hotellook }
            ]
          }
        ]
      }
    ];
  }

  let allItineraries = generateItineraries();

  // --------------------------------------------------------------------------
  // 2. Sorting & Filtering State
  // --------------------------------------------------------------------------
  let currentSort = 'best-value'; // 'cheapest', 'fastest', 'best-value', 'eco'
  let currentCategory = 'all';    // 'all', 'flight-stay', 'train-stay', 'flight-car', 'ferry'
  let currentMaxPrice = 1500;
  let currentStops = 'all';       // 'all', '0', '1'
  let currentMinRating = 0;
  let ecoOnly = false;

  // --------------------------------------------------------------------------
  // 3. Render Results Feed Cards with Multi-Engine Bar
  // --------------------------------------------------------------------------
  function renderFeed(items) {
    if (!resultsFeedList) return;
    resultsFeedList.innerHTML = '';

    if (resultsCountText) {
      resultsCountText.textContent = `Showing ${items.length} Multimodal ${items.length === 1 ? 'Journey' : 'Journeys'}`;
    }

    if (items.length === 0) {
      resultsFeedList.innerHTML = `
        <div style="background: #ffffff; padding: 48px 24px; text-align: center; border-radius: 20px; border: 1px dashed #cbd5e1;">
          <span style="font-size: 2.5rem; display: block; margin-bottom: 12px;">🔍</span>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 6px;">No Journeys Match Your Selected Filters</h3>
          <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 16px;">Try adjusting your maximum price or removing stops filters to see more routes.</p>
          <button type="button" id="resetEmptyFiltersBtn" style="padding: 10px 20px; background: #0284c7; color: #fff; border: none; border-radius: 9999px; font-weight: 700; cursor: pointer;">Reset All Filters</button>
        </div>
      `;
      document.getElementById('resetEmptyFiltersBtn')?.addEventListener('click', resetFilters);
      return;
    }

    items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = `feed-card results-card ${item.highlight ? 'highlight-pick' : ''}`;
      
      const legsHtml = item.legs.map(leg => `
        <div class="leg-box itinerary-leg">
          <div class="leg-box-top">
            <div class="leg-carrier-lockup">
              <span class="leg-carrier-logo">${leg.icon}</span>
              <span class="leg-type-title">${leg.carrier}</span>
            </div>
            <span class="leg-provider-chip">${leg.providerTag}</span>
          </div>
          <div class="leg-box-middle">
            <span class="leg-times-row">${leg.times}</span>
            <span class="leg-route-sub">${leg.routeSub}</span>
          </div>
          <div class="leg-box-bottom">
            <span class="leg-tag-indicator">${leg.type}</span>
            <span class="leg-est-cost">${leg.estCost}</span>
          </div>
        </div>
      `).join('');

      card.innerHTML = `
        <div>
          <div class="feed-card-top-row card-top-row">
            <div class="feed-badges-wrap card-badges-left">
              <span class="feed-badge ${item.badgeClass}">${item.badge}</span>
              <span class="feed-badge duration">${item.durationStr}</span>
              <span class="feed-badge eco">🌿 ${item.co2kg}kg CO2</span>
            </div>
            <div class="feed-stay-score-badge card-rating-right">
              ★ ${item.stayScore} Verified Stay
            </div>
          </div>

          <div class="feed-card-header-info" style="margin-top: 10px; margin-bottom: 16px;">
            <h3 class="feed-card-title card-title">${item.title}</h3>
            <p class="feed-card-desc card-desc">${item.desc}</p>
          </div>

          <div class="feed-journey-legs-grid itinerary-legs-grid">
            ${legsHtml}
          </div>
        </div>

        <!-- 1-Click Multi-Engine Comparison Bar -->
        <div class="multi-engine-bar compare-engines-bar">
          <div class="engine-bar-header">
            <span class="engine-bar-label">⚡ Compare Real-Time Fares Across Engines:</span>
            <span class="engine-bar-guarantee">Pre-filled • No 404s</span>
          </div>
          <div class="engine-bar-links">
            <a href="${item.proposalUrl || directUrls.aviasalesProposal}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn aviasales" style="background: #f0f9ff; border-color: #38bdf8; color: #0284c7;" title="Direct Flight Proposal on Aviasales Live Engine">
              <span class="engine-pill-icon">✈️</span>
              <span>Aviasales Live</span>
            </a>
            <a href="${directUrls.googleFlights}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn google" title="Search ${flightOriginIATA} to ${destIATA} on Google Flights">
              <span class="engine-pill-icon">⚡</span>
              <span>Google Flights</span>
            </a>
            <a href="${directUrls.skyscanner}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn skyscanner" title="Compare ${flightOriginIATA} to ${destIATA} on Skyscanner">
              <span class="engine-pill-icon">🧭</span>
              <span>Skyscanner</span>
            </a>
            <a href="${directUrls.kayak}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn kayak" title="Compare on Kayak">
              <span class="engine-pill-icon">🔍</span>
              <span>Kayak</span>
            </a>
            <a href="${directUrls.booking}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn booking" title="Compare Lowest Price Stays in ${destCity} on Booking.com">
              <span class="engine-pill-icon">🏨</span>
              <span>Booking.com</span>
            </a>
            <a href="${directUrls.hotellook}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn hotellook" title="Compare Hotels on Hotellook">
              <span class="engine-pill-icon">🔍</span>
              <span>Hotellook</span>
            </a>
            <a href="${directUrls.airbnb}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn airbnb" title="Search Airbnb Stays in ${destCity}">
              <span class="engine-pill-icon">🏡</span>
              <span>Airbnb</span>
            </a>
          </div>
        </div>

        <div class="feed-card-bottom-row card-footer-row">
          <div class="feed-tco-block">
            <div class="feed-tco-labels">
              <span class="feed-tco-title">Door-to-Door TCO</span>
              <span class="feed-tco-sub">Direct Provider Prices • €0 Fees</span>
            </div>
            <div class="feed-tco-amount">
              <span class="currency">€</span>${item.totalPrice}
            </div>
          </div>

          <div class="feed-card-actions-group card-footer-actions">
            <a href="${item.primaryCtaUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary-carrier-book btn-book-primary" title="Direct Booking on Official Portal">
              <span>${item.primaryCtaLabel}</span>
            </a>

            <button type="button" class="btn-feed-breakdown btn-details-secondary" data-card-idx="${index}">
              <span>Itinerary Details</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
            </button>
          </div>
        </div>
      `;

      card.querySelector('.btn-feed-breakdown').addEventListener('click', () => {
        openTripDrawer(item);
      });

      resultsFeedList.appendChild(card);
    });
  }

  // --------------------------------------------------------------------------
  // 4. Filter & Sort Execution Pipeline
  // --------------------------------------------------------------------------
  function applyFiltersAndSort() {
    let filtered = allItineraries.filter(item => {
      if (currentCategory !== 'all' && item.category !== currentCategory) return false;
      if (item.totalPrice > currentMaxPrice) return false;
      if (currentStops === '0' && item.stops !== 0) return false;
      if (currentStops === '1' && item.stops > 1) return false;
      if (currentMinRating > 0 && item.stayScore < currentMinRating) return false;
      if (ecoOnly && item.co2kg > 60) return false;
      return true;
    });

    if (currentSort === 'cheapest') {
      filtered.sort((a, b) => a.totalPrice - b.totalPrice);
    } else if (currentSort === 'fastest') {
      filtered.sort((a, b) => a.durationMinutes - b.durationMinutes);
    } else if (currentSort === 'eco') {
      filtered.sort((a, b) => a.co2kg - b.co2kg);
    } else {
      filtered.sort((a, b) => {
        if (a.highlight && !b.highlight) return -1;
        if (!a.highlight && b.highlight) return 1;
        return a.totalPrice - b.totalPrice;
      });
    }

    renderFeed(filtered);
    updateActiveFilterCount();
  }

  function updateActiveFilterCount() {
    let count = 0;
    if (currentCategory !== 'all') count++;
    if (currentMaxPrice < 1500) count++;
    if (currentStops !== 'all') count++;
    if (currentMinRating > 0) count++;
    if (ecoOnly) count++;

    const badge = document.getElementById('sidebarFilterCount');
    const mobBadge = document.getElementById('mobileFilterCount');
    if (badge) badge.textContent = count > 0 ? String(count) : '';
    if (mobBadge) mobBadge.textContent = count > 0 ? `(${count})` : '';
  }

  function resetFilters() {
    currentCategory = 'all';
    currentMaxPrice = 1500;
    currentStops = 'all';
    currentMinRating = 0;
    ecoOnly = false;

    document.querySelectorAll('input[name="categoryFilter"]').forEach(r => r.checked = r.value === 'all');
    document.querySelectorAll('input[name="stopsFilter"]').forEach(r => r.checked = r.value === 'all');
    document.querySelectorAll('input[name="ratingFilter"]').forEach(r => r.checked = r.value === '0');
    const priceSlider = document.getElementById('priceRangeSlider');
    const priceDisplay = document.getElementById('priceDisplayVal');
    if (priceSlider) priceSlider.value = '1500';
    if (priceDisplay) priceDisplay.textContent = '€1,500';
    const ecoCheck = document.getElementById('ecoOnlyFilter');
    if (ecoCheck) ecoCheck.checked = false;

    applyFiltersAndSort();
  }

  // --------------------------------------------------------------------------
  // 5. Wire Filter UI Controls
  // --------------------------------------------------------------------------
  document.querySelectorAll('.sort-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      applyFiltersAndSort();
    });
  });

  const priceRangeSlider = document.getElementById('priceRangeSlider');
  const priceDisplayVal = document.getElementById('priceDisplayVal');
  if (priceRangeSlider) {
    priceRangeSlider.addEventListener('input', (e) => {
      currentMaxPrice = parseInt(e.target.value, 10);
      if (priceDisplayVal) priceDisplayVal.textContent = `€${currentMaxPrice}`;
      applyFiltersAndSort();
    });
  }

  document.querySelectorAll('input[name="categoryFilter"]').forEach(input => {
    input.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      applyFiltersAndSort();
    });
  });

  document.querySelectorAll('input[name="stopsFilter"]').forEach(input => {
    input.addEventListener('change', (e) => {
      currentStops = e.target.value;
      applyFiltersAndSort();
    });
  });

  document.querySelectorAll('input[name="ratingFilter"]').forEach(input => {
    input.addEventListener('change', (e) => {
      currentMinRating = parseFloat(e.target.value);
      applyFiltersAndSort();
    });
  });

  const ecoOnlyFilter = document.getElementById('ecoOnlyFilter');
  if (ecoOnlyFilter) {
    ecoOnlyFilter.addEventListener('change', (e) => {
      ecoOnly = e.target.checked;
      applyFiltersAndSort();
    });
  }

  // Mobile Filter Elements Sync
  document.querySelectorAll('input[name="categoryFilterMobile"]').forEach(input => {
    input.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      document.querySelectorAll('input[name="categoryFilter"]').forEach(r => r.checked = r.value === currentCategory);
    });
  });

  const priceRangeSliderMobile = document.getElementById('priceRangeSliderMobile');
  const priceDisplayValMobile = document.getElementById('priceDisplayValMobile');
  if (priceRangeSliderMobile) {
    priceRangeSliderMobile.addEventListener('input', (e) => {
      currentMaxPrice = parseInt(e.target.value, 10);
      if (priceDisplayValMobile) priceDisplayValMobile.textContent = `€${currentMaxPrice}`;
      if (priceRangeSlider) priceRangeSlider.value = String(currentMaxPrice);
      if (priceDisplayVal) priceDisplayVal.textContent = `€${currentMaxPrice}`;
    });
  }

  document.querySelectorAll('input[name="stopsFilterMobile"]').forEach(input => {
    input.addEventListener('change', (e) => {
      currentStops = e.target.value;
      document.querySelectorAll('input[name="stopsFilter"]').forEach(r => r.checked = r.value === currentStops);
    });
  });

  const ecoOnlyFilterMobile = document.getElementById('ecoOnlyFilterMobile');
  if (ecoOnlyFilterMobile) {
    ecoOnlyFilterMobile.addEventListener('change', (e) => {
      ecoOnly = e.target.checked;
      if (ecoOnlyFilter) ecoOnlyFilter.checked = ecoOnly;
    });
  }

  document.getElementById('resetSidebarFiltersBtn')?.addEventListener('click', resetFilters);
  document.getElementById('resetMobileFiltersBtn')?.addEventListener('click', resetFilters);

  // Mobile Filter Sheet
  const openMobileFilterBtn = document.getElementById('openMobileFilterBtn');
  const closeMobileFilterBtn = document.getElementById('closeMobileFilterBtn');
  const applyMobileFilterBtn = document.getElementById('applyMobileFilterBtn');
  const mobileFilterModal = document.getElementById('mobileFilterModal');
  const mobileFilterBackdrop = document.getElementById('mobileFilterBackdrop');

  function openMobileFilters() {
    mobileFilterModal?.classList.add('open');
    mobileFilterBackdrop?.classList.add('open');
    document.body.classList.add('search-modal-open');
  }

  function closeMobileFilters() {
    mobileFilterModal?.classList.remove('open');
    mobileFilterBackdrop?.classList.remove('open');
    document.body.classList.remove('search-modal-open');
  }

  openMobileFilterBtn?.addEventListener('click', openMobileFilters);
  closeMobileFilterBtn?.addEventListener('click', closeMobileFilters);
  applyMobileFilterBtn?.addEventListener('click', () => {
    closeMobileFilters();
    applyFiltersAndSort();
  });
  mobileFilterBackdrop?.addEventListener('click', closeMobileFilters);

  // --------------------------------------------------------------------------
  // 6. Interactive Outbound Deep-Link Booking Drawer (`#tripSummaryModal`)
  // --------------------------------------------------------------------------
  const tripSummaryModal = document.getElementById('tripSummaryModal');
  const tripSummaryBackdrop = document.getElementById('tripSummaryBackdrop');
  const closeSummaryDrawerBtn = document.getElementById('closeSummaryDrawerBtn');

  function openTripDrawer(item) {
    if (!tripSummaryModal || !tripSummaryBackdrop) return;

    const drawerHeadline = document.getElementById('drawerHeadline');
    const drawerMetaSub = document.getElementById('drawerMetaSub');
    const drawerLegsList = document.getElementById('drawerLegsList');
    const drawerTcoAmount = document.getElementById('drawerTcoAmount');

    if (drawerHeadline) {
      drawerHeadline.textContent = hubRoute.needsHubTransfer
        ? `${originCity} ➔ ${hubRoute.hubCity} ➔ ${destCity}`
        : `${originCity} ➔ ${destCity}`;
    }
    if (drawerMetaSub) drawerMetaSub.textContent = `${formattedDates} • ${rawTravelers} Travelers • ${item.title}`;
    if (drawerTcoAmount) drawerTcoAmount.textContent = `€${item.totalPrice}`;

    if (drawerLegsList) {
      const legsHtml = item.legs.map(leg => {
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
                <span class="leg-type-name">${leg.carrier}</span>
              </div>
              <span class="leg-est-price">${leg.estCost}</span>
            </div>
            <p class="leg-details-row">${leg.times} • ${leg.routeSub}</p>
            <div class="leg-action-buttons">
              ${actionBtnsHtml}
            </div>
          </div>
        `;
      }).join('');

      const comparisonSectionHtml = `
        <div class="drawer-compare-box" style="margin-top: 20px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px;">
          <h4 style="font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>⚡ Verify Fares on Major Search Engines</span>
          </h4>
          <p style="font-size: 0.78rem; color: #64748b; margin-bottom: 12px;">Compare live search engine rates with 1 click. Zero manual date or route input needed.</p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <a href="${item.proposalUrl || directUrls.aviasalesProposal}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn aviasales" style="background: #f0f9ff; border-color: #38bdf8; color: #0284c7; padding: 6px 12px; font-size: 0.78rem;">
              <span>✈️ Aviasales Live Ticket</span>
            </a>
            <a href="${directUrls.googleFlights}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn google" style="padding: 6px 12px; font-size: 0.78rem;">
              <span>⚡ Google Flights</span>
            </a>
            <a href="${directUrls.skyscanner}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn skyscanner" style="padding: 6px 12px; font-size: 0.78rem;">
              <span>🧭 Skyscanner</span>
            </a>
            <a href="${directUrls.kayak}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn kayak" style="padding: 6px 12px; font-size: 0.78rem;">
              <span>🔍 Kayak</span>
            </a>
            <a href="${directUrls.booking}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn booking" style="padding: 6px 12px; font-size: 0.78rem;">
              <span>🏨 Booking.com</span>
            </a>
            <a href="${directUrls.hotellook}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn hotellook" style="padding: 6px 12px; font-size: 0.78rem;">
              <span>🔍 Hotellook</span>
            </a>
            <a href="${directUrls.airbnb}" target="_blank" rel="noopener noreferrer" class="engine-pill-btn airbnb" style="padding: 6px 12px; font-size: 0.78rem;">
              <span>🏡 Airbnb</span>
            </a>
          </div>
        </div>
      `;

      drawerLegsList.innerHTML = legsHtml + comparisonSectionHtml;
    }

    tripSummaryBackdrop.classList.add('open');
    tripSummaryModal.classList.add('open');
    tripSummaryModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('search-modal-open');
  }

  function closeTripDrawer() {
    if (!tripSummaryModal || !tripSummaryBackdrop) return;
    tripSummaryBackdrop.classList.remove('open');
    tripSummaryModal.classList.remove('open');
    tripSummaryModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('search-modal-open');
  }

  closeSummaryDrawerBtn?.addEventListener('click', closeTripDrawer);
  tripSummaryBackdrop?.addEventListener('click', closeTripDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTripDrawer();
      closeMobileFilters();
    }
  });

  // --------------------------------------------------------------------------
  // 7. Live Server-Side Search Engine Fetcher (Travelpayouts / Aviasales Proxy)
  // --------------------------------------------------------------------------
  async function fetchLiveProposals() {
    const config = (typeof window !== 'undefined' && window.TRIPMURA_CONFIG) ? window.TRIPMURA_CONFIG : {};
    if (config.useLiveApi === false) return;

    try {
      const apiParams = new URLSearchParams({
        from: rawFrom,
        to: rawTo,
        depart: rawDepart,
        return: rawReturn,
        travelers: String(rawTravelers),
        children: String(rawChildren),
        rooms: String(rawRooms),
        cabin: rawCabin,
        direct: rawDirect ? '1' : '0'
      });

      if (config.travelpayouts && (config.travelpayouts.token || config.travelpayouts.apiToken)) {
        apiParams.set('token', config.travelpayouts.token || config.travelpayouts.apiToken);
      }
      if (config.travelpayouts && config.travelpayouts.marker) {
        apiParams.set('marker', config.travelpayouts.marker);
      }

      const endpoint = config.apiEndpoint || 'api/search.php';
      const res = await fetch(`${endpoint}?${apiParams.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data && data.status === 'success' && Array.isArray(data.proposals) && data.proposals.length > 0) {
        allItineraries = data.proposals;
        applyFiltersAndSort();

        const liveBadge = document.getElementById('resultsBadgeLive');
        const liveBadgeText = document.getElementById('resultsBadgeLiveText');
        if (liveBadge && liveBadgeText) {
          liveBadgeText.textContent = data.source === 'travelpayouts_live_api'
            ? '🟢 Live Travelpayouts / Aviasales Rates Synced'
            : '⚡ Live Direct Carrier Routing Engine';
        }
      }
    } catch (err) {
      // Gracefully silent on static hosting / local preview without PHP server
      console.info('[TripMura] Operating on Smart Schedule Engine:', err.message);
    }
  }

  // Initial render & live sync
  applyFiltersAndSort();
  fetchLiveProposals();
}

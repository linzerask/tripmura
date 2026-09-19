/**
 * TripMura — Dedicated Results Page Master Controller
 * Dynamic 8-12 Multimodal Itinerary Generator, Real IATA Deep-Link Engine,
 * Multi-criteria Sort & Filter, Floating Mini-Search Editor & Interactive Drawer.
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

  // Generate Direct URLs
  const directUrls = TripMuraIATA.buildDirectProviderUrls(searchState);

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

  if (summaryRouteText) summaryRouteText.textContent = `${originCity} (${originIATA}) ➔ ${destCity} (${destIATA})`;
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
  // 1. Dynamic Multimodal Itinerary Generator (10 Realistic Packages)
  // --------------------------------------------------------------------------
  function generateItineraries() {
    const isAustriaOrigin = originIATA === 'LNZ' || originIATA === 'VIE' || originIATA === 'SZG';
    const isUKOrigin = originIATA === 'LON' || originIATA === 'LHR' || originIATA === 'STN';
    const isGermanyOrigin = originIATA === 'MUC' || originIATA === 'FRA' || originIATA === 'BER';

    return [
      // 1. Top Pick: Austrian / Premium Direct + Boutique Stay
      {
        id: 'pkg-1',
        title: `${isAustriaOrigin ? 'Austrian Airlines Direct Express' : 'Lufthansa Direct Hub Express'} & Boutique Hotel`,
        desc: `Synchronized flight connection with verified private transfer and coastal boutique accommodation in central ${destCity}.`,
        badge: '⭐ Top Pick • Best Value',
        badgeClass: 'top-pick',
        category: 'flight-stay',
        durationStr: '⏱️ 3h 45m Door-to-Door',
        durationMinutes: 225,
        co2kg: 52,
        stops: 0,
        provider: 'skyscanner',
        stayScore: 9.1,
        totalPrice: 495,
        highlight: true,
        legs: [
          {
            carrier: isAustriaOrigin ? 'Austrian Airlines' : 'Lufthansa',
            carrierCode: isAustriaOrigin ? 'OS' : 'LH',
            icon: '✈️',
            type: 'Direct Scheduled Flight',
            providerTag: 'Skyscanner & Google Flights',
            times: `08:35 → 11:20 • ${isAustriaOrigin ? 'OS 817' : 'LH 1754'} Non-Stop`,
            routeSub: `${originCity} (${originIATA}) → ${destCity} (${destIATA}) • 1h 45m`,
            estCost: '€140 / traveler',
            actions: [
              { label: 'Book Flight on Skyscanner ↗', url: directUrls.skyscanner, featured: true },
              { label: 'Compare on Google Flights ↗', url: directUrls.googleFlights }
            ]
          },
          {
            carrier: 'Regional Express Shuttle',
            carrierCode: 'BUS',
            icon: '🚐',
            type: 'Direct Airport Harbor Shuttle',
            providerTag: 'Omio Transfer',
            times: '12:00 → 12:35 • Dedicated Express',
            routeSub: `${destIATA} Airport Pier → Central Promenade • 35m`,
            estCost: '€15 / traveler',
            actions: [
              { label: 'Book Transfer on Omio ↗', url: directUrls.omio, featured: true }
            ]
          },
          {
            carrier: 'Curated Boutique Stay',
            carrierCode: 'STAY',
            icon: '🏨',
            type: `7 Nights in ${destCity}`,
            providerTag: 'Booking.com & Airbnb',
            times: `Check-in ${formatDisplayDate(rawDepart)} • Verified 9.1/10 Rating`,
            routeSub: 'Sea View Balcony, Breakfast Included, Free Cancellation',
            estCost: '€340 total',
            actions: [
              { label: 'View Stays on Booking.com ↗', url: directUrls.booking, featured: true },
              { label: 'View Rentals on Airbnb ↗', url: directUrls.airbnb }
            ]
          }
        ]
      },

      // 2. Scenic Rail & Coastal Villa (Low Carbon)
      {
        id: 'pkg-2',
        title: 'ÖBB Nightjet & Scenic Coastal Rail with Luxury Villa',
        desc: `Relaxing panoramic train journey through alpine valleys connecting seamlessly into scenic coastal hydrofoil.`,
        badge: '🌿 Scenic Rail • Zero Flight Carbon',
        badgeClass: 'scenic',
        category: 'train-stay',
        durationStr: '⏱️ 8h 30m Door-to-Door',
        durationMinutes: 510,
        co2kg: 18,
        stops: 1,
        provider: 'trainline',
        stayScore: 9.4,
        totalPrice: 420,
        highlight: false,
        legs: [
          {
            carrier: 'ÖBB Railjet & Nightjet',
            carrierCode: 'ÖBB',
            icon: '🚆',
            type: 'High-Speed Railjet & Sleeper Couchette',
            providerTag: 'Trainline',
            times: '07:15 → 13:40 • EuroCity Scenic Route',
            routeSub: `${originCity} Main Station → Coastal Junction • Panoramic Car`,
            estCost: '€95 / traveler',
            actions: [
              { label: 'Book Train on Trainline ↗', url: directUrls.trainline, featured: true },
              { label: 'Compare on Omio ↗', url: directUrls.omio }
            ]
          },
          {
            carrier: 'Coastal Ferry / Hydrofoil',
            carrierCode: 'SEA',
            icon: '⛵',
            type: 'High-Speed Hydrofoil Ferry',
            providerTag: 'Omio Ferry',
            times: '14:15 → 15:00 • Fast Sea Link',
            routeSub: `Main Pier → ${destCity} Waterfront • 45m`,
            estCost: '€25 / traveler',
            actions: [
              { label: 'Book Ferry on Omio ↗', url: directUrls.omio, featured: true }
            ]
          },
          {
            carrier: 'Boutique Sea Villa',
            carrierCode: 'AIRBNB',
            icon: '🏡',
            type: `Private Coastal Apartment on Airbnb`,
            providerTag: 'Airbnb',
            times: `7 Nights (${formattedDates}) • Superhost`,
            routeSub: 'Panoramic Terrace, Fully Equipped Kitchen',
            estCost: '€300 total',
            actions: [
              { label: 'View Rentals on Airbnb ↗', url: directUrls.airbnb, featured: true },
              { label: 'Compare on Booking.com ↗', url: directUrls.booking }
            ]
          }
        ]
      },

      // 3. Fastest Priority Flight + Rental Car Freedom
      {
        id: 'pkg-3',
        title: 'Priority Flight & Compact SUV Rental Freedom',
        desc: `Maximize holiday time: express morning flight with terminal rental car pickup to explore secret coves and beaches.`,
        badge: '⚡ Fastest Route & Total Freedom',
        badgeClass: 'fastest',
        category: 'flight-car',
        durationStr: '⏱️ 2h 55m Door-to-Door',
        durationMinutes: 175,
        co2kg: 68,
        stops: 0,
        provider: 'skyscanner',
        stayScore: 9.3,
        totalPrice: 620,
        highlight: false,
        legs: [
          {
            carrier: 'Priority Express Flight',
            carrierCode: 'AIR',
            icon: '✈️',
            type: 'Direct Morning Scheduled Flight',
            providerTag: 'Skyscanner',
            times: '06:50 → 09:35 • Direct Jet',
            routeSub: `${originCity} (${originIATA}) → ${destCity} (${destIATA})`,
            estCost: '€165 / traveler',
            actions: [
              { label: 'Book Flight on Skyscanner ↗', url: directUrls.skyscanner, featured: true },
              { label: 'Compare on Google Flights ↗', url: directUrls.googleFlights }
            ]
          },
          {
            carrier: 'DiscoverCars Rental',
            carrierCode: 'CAR',
            icon: '🚗',
            type: 'Compact SUV (Unlimited Mileage)',
            providerTag: 'DiscoverCars',
            times: '7 Days Full Rental • Terminal Pick-up',
            routeSub: 'Full Insurance, Zero Deductible, Free GPS',
            estCost: '€150 total',
            actions: [
              { label: 'Compare Cars on DiscoverCars ↗', url: directUrls.discoverCars, featured: true }
            ]
          },
          {
            carrier: '5-Star Seaside Resort',
            carrierCode: 'HOTEL',
            icon: '🏨',
            type: `Luxury Resort in ${destCity}`,
            providerTag: 'Booking.com',
            times: '7 Nights • Verified 9.3/10 Score',
            routeSub: 'Infinity Pool, Private Beach Access',
            estCost: '€305 total',
            actions: [
              { label: 'View Stays on Booking.com ↗', url: directUrls.booking, featured: true }
            ]
          }
        ]
      },

      // 4. Ultra Budget: Ryanair / Wizz Smart Hub
      {
        id: 'pkg-4',
        title: 'Smart Budget Non-Stop & City Apartment',
        desc: `Lowest cost guaranteed with budget carrier direct link paired with top-rated central apartment.`,
        badge: '💰 Lowest Total Cost (Budget Smart)',
        badgeClass: 'top-pick',
        category: 'flight-stay',
        durationStr: '⏱️ 4h 10m Door-to-Door',
        durationMinutes: 250,
        co2kg: 48,
        stops: 0,
        provider: 'skyscanner',
        stayScore: 8.7,
        totalPrice: 340,
        highlight: false,
        legs: [
          {
            carrier: 'Ryanair / Wizz Air Direct',
            carrierCode: 'FR',
            icon: '✈️',
            type: 'Direct Low-Cost Flight',
            providerTag: 'Skyscanner',
            times: '14:20 → 17:05 • Non-Stop Flight',
            routeSub: `${originCity} (${originIATA}) → ${destCity} (${destIATA})`,
            estCost: '€65 / traveler',
            actions: [
              { label: 'Book Flight on Skyscanner ↗', url: directUrls.skyscanner, featured: true }
            ]
          },
          {
            carrier: 'Public Airport Express',
            carrierCode: 'METRO',
            icon: '🚆',
            type: 'Direct Metro / Rail Link',
            providerTag: 'Trainline',
            times: '17:30 → 18:00 • Every 15 min',
            routeSub: 'Airport Station → Old Town Square',
            estCost: '€6 / traveler',
            actions: [
              { label: 'Book Train on Trainline ↗', url: directUrls.trainline, featured: true }
            ]
          },
          {
            carrier: 'Cozy Central Apartment',
            carrierCode: 'AIRBNB',
            icon: '🏡',
            type: `7 Nights Studio in ${destCity}`,
            providerTag: 'Airbnb',
            times: '7 Nights • Rating 8.7/10',
            routeSub: 'Fast WiFi, Central Location, Self Check-in',
            estCost: '€269 total',
            actions: [
              { label: 'View Rentals on Airbnb ↗', url: directUrls.airbnb, featured: true }
            ]
          }
        ]
      },

      // 5. Luxury 5-Star VIP Escape
      {
        id: 'pkg-5',
        title: 'Business Class Flight & 5-Star Waterfront Palace',
        desc: `Ultimate comfort: premium cabin flights, private Mercedes transfer, and 5-star beachfront luxury suite.`,
        badge: '💎 5-Star Ultra Luxury',
        badgeClass: 'luxury',
        category: 'flight-stay',
        durationStr: '⏱️ 3h 20m Door-to-Door',
        durationMinutes: 200,
        co2kg: 85,
        stops: 0,
        provider: 'booking',
        stayScore: 9.7,
        totalPrice: 1180,
        highlight: false,
        legs: [
          {
            carrier: 'Business Class Direct',
            carrierCode: 'BIZ',
            icon: '✈️',
            type: 'Premium Business Class Flight',
            providerTag: 'Google Flights',
            times: '10:00 → 12:45 • Priority Lane & Lounge',
            routeSub: `${originCity} (${originIATA}) → ${destCity} (${destIATA})`,
            estCost: '€390 / traveler',
            actions: [
              { label: 'View on Google Flights ↗', url: directUrls.googleFlights, featured: true },
              { label: 'Book on Skyscanner ↗', url: directUrls.skyscanner }
            ]
          },
          {
            carrier: 'Private Chauffeur',
            carrierCode: 'VIP',
            icon: '🚗',
            type: 'Private Mercedes-Benz Transfer',
            providerTag: 'DiscoverCars',
            times: 'Direct Runway Meet & Greet',
            routeSub: 'Airport → Hotel Lobby • 25m',
            estCost: '€90 total',
            actions: [
              { label: 'Book VIP Transfer on DiscoverCars ↗', url: directUrls.discoverCars, featured: true }
            ]
          },
          {
            carrier: 'Grand Waterfront Palace',
            carrierCode: 'HOTEL',
            icon: '🏨',
            type: `5-Star Suite in ${destCity}`,
            providerTag: 'Booking.com',
            times: '7 Nights • Verified 9.7/10 Score',
            routeSub: 'Gourmet Breakfast, Spa Access, Private Cabana',
            estCost: '€700 total',
            actions: [
              { label: 'View Stays on Booking.com ↗', url: directUrls.booking, featured: true }
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
        provider: 'omio',
        stayScore: 9.0,
        totalPrice: 510,
        highlight: false,
        legs: [
          {
            carrier: 'Scheduled Coastal Flight',
            carrierCode: 'FLY',
            icon: '✈️',
            type: 'Morning Direct Flight',
            providerTag: 'Skyscanner',
            times: '09:15 → 12:00 • Non-Stop',
            routeSub: `${originCity} → Main Harbor Hub`,
            estCost: '€110 / traveler',
            actions: [
              { label: 'Book Flight on Skyscanner ↗', url: directUrls.skyscanner, featured: true }
            ]
          },
          {
            carrier: 'Seajets / High-Speed Ferry',
            carrierCode: 'SEA',
            icon: '⛵',
            type: 'Fast Catamaran Ferry',
            providerTag: 'Omio Ferry',
            times: '13:30 → 14:45 • Scenic Sea Crossing',
            routeSub: `Port Terminal → ${destCity} Marina`,
            estCost: '€35 / traveler',
            actions: [
              { label: 'Book Ferry on Omio ↗', url: directUrls.omio, featured: true }
            ]
          },
          {
            carrier: 'Boutique Harbor Suites',
            carrierCode: 'HOTEL',
            icon: '🏨',
            type: `7 Nights Stay in ${destCity}`,
            providerTag: 'Booking.com',
            times: '7 Nights • 9.0/10 Score',
            routeSub: 'Marina View, Rooftop Lounge',
            estCost: '€365 total',
            actions: [
              { label: 'View Stays on Booking.com ↗', url: directUrls.booking, featured: true }
            ]
          }
        ]
      },

      // 7. Eurostar / Frecciarossa High-Speed Rail Connection
      {
        id: 'pkg-7',
        title: 'Eurostar & Trenitalia High-Speed Panorama',
        desc: `Smooth high-speed rail with 300km/h scenic connections through Europe's most beautiful landscapes.`,
        badge: '🚆 100% High-Speed Rail',
        badgeClass: 'scenic',
        category: 'train-stay',
        durationStr: '⏱️ 7h 45m Door-to-Door',
        durationMinutes: 465,
        co2kg: 22,
        stops: 1,
        provider: 'trainline',
        stayScore: 8.9,
        totalPrice: 470,
        highlight: false,
        legs: [
          {
            carrier: 'Trenitalia Frecciarossa / Eurostar',
            carrierCode: 'TRAIN',
            icon: '🚆',
            type: '300 km/h Executive Rail',
            providerTag: 'Trainline',
            times: '08:00 → 14:30 • Free WiFi & Cafe Car',
            routeSub: `${originCity} → Central Pier Station`,
            estCost: '€115 / traveler',
            actions: [
              { label: 'Book Train on Trainline ↗', url: directUrls.trainline, featured: true }
            ]
          },
          {
            carrier: 'Local Coastal Tram',
            carrierCode: 'TRAM',
            icon: '🚊',
            type: 'Direct Seaside Tramway',
            providerTag: 'Omio',
            times: '14:50 → 15:15 • Every 10 min',
            routeSub: 'Station → Resort Beachfront',
            estCost: '€4 / traveler',
            actions: [
              { label: 'Compare on Omio ↗', url: directUrls.omio, featured: true }
            ]
          },
          {
            carrier: 'Sunlit Coastal Guesthouse',
            carrierCode: 'AIRBNB',
            icon: '🏡',
            type: `7 Nights Stay in ${destCity}`,
            providerTag: 'Airbnb',
            times: '7 Nights • 8.9/10 Score',
            routeSub: 'Private Garden & Sea Breeze',
            estCost: '€351 total',
            actions: [
              { label: 'View Rentals on Airbnb ↗', url: directUrls.airbnb, featured: true }
            ]
          }
        ]
      },

      // 8. Swiss Alps Hub & Mediterranean Express
      {
        id: 'pkg-8',
        title: 'Swiss Hub Connection & Mediterranean Villa',
        desc: `Smooth 45-minute connection through Zurich/Munich with SWISS International and boutique stay.`,
        badge: '⭐ Premium Reliability',
        badgeClass: 'top-pick',
        category: 'flight-stay',
        durationStr: '⏱️ 4h 15m Door-to-Door',
        durationMinutes: 255,
        co2kg: 56,
        stops: 1,
        provider: 'google',
        stayScore: 9.2,
        totalPrice: 560,
        highlight: false,
        legs: [
          {
            carrier: 'SWISS / Lufthansa Hub',
            carrierCode: 'LX',
            icon: '✈️',
            type: 'Synchronized Connecting Flight',
            providerTag: 'Google Flights',
            times: '11:10 → 15:00 • 45m Zurich Connection',
            routeSub: `${originCity} → ZRH Hub → ${destCity}`,
            estCost: '€175 / traveler',
            actions: [
              { label: 'Compare on Google Flights ↗', url: directUrls.googleFlights, featured: true },
              { label: 'Book on Skyscanner ↗', url: directUrls.skyscanner }
            ]
          },
          {
            carrier: 'Harbor Express Bus',
            carrierCode: 'BUS',
            icon: '🚌',
            type: 'Direct Airport Bus',
            providerTag: 'Omio',
            times: '15:30 → 16:00 • Non-Stop',
            routeSub: 'Terminal → City Pier',
            estCost: '€10 / traveler',
            actions: [
              { label: 'Book on Omio ↗', url: directUrls.omio, featured: true }
            ]
          },
          {
            carrier: 'Mediterranean Vista Villa',
            carrierCode: 'HOTEL',
            icon: '🏨',
            type: `7 Nights in ${destCity}`,
            providerTag: 'Booking.com',
            times: '7 Nights • Verified 9.2/10 Rating',
            routeSub: 'Panoramic Pool, Breakfast Included',
            estCost: '€375 total',
            actions: [
              { label: 'View Stays on Booking.com ↗', url: directUrls.booking, featured: true }
            ]
          }
        ]
      },

      // 9. Eco-Conscious Electric Rail & Solar Stay
      {
        id: 'pkg-9',
        title: 'Eco-Express Rail Link & Certified Green Stay',
        desc: `Lowest ecological footprint: 100% renewable electric rail transit and certified eco-boutique property.`,
        badge: '🌿 Eco Pioneer (<25kg CO2)',
        badgeClass: 'eco',
        category: 'train-stay',
        durationStr: '⏱️ 6h 50m Door-to-Door',
        durationMinutes: 410,
        co2kg: 14,
        stops: 1,
        provider: 'trainline',
        stayScore: 9.1,
        totalPrice: 445,
        highlight: false,
        legs: [
          {
            carrier: 'ÖBB / SBB Green Railjet',
            carrierCode: 'GREEN',
            icon: '🚆',
            type: '100% Renewable Electric Rail',
            providerTag: 'Trainline',
            times: '08:45 → 14:15 • Silent Eco Car',
            routeSub: `${originCity} → Destination Rail Terminal`,
            estCost: '€88 / traveler',
            actions: [
              { label: 'Book Train on Trainline ↗', url: directUrls.trainline, featured: true }
            ]
          },
          {
            carrier: 'Electric Shuttle',
            carrierCode: 'EV',
            icon: '⚡',
            type: 'Zero-Emission EV Transfer',
            providerTag: 'Omio',
            times: '14:30 → 14:55 • On-Demand',
            routeSub: 'Station → Green Resort',
            estCost: '€12 / traveler',
            actions: [
              { label: 'Compare on Omio ↗', url: directUrls.omio, featured: true }
            ]
          },
          {
            carrier: 'Certified Eco Lodge',
            carrierCode: 'ECO',
            icon: '🏡',
            type: `Eco-Boutique Villa in ${destCity}`,
            providerTag: 'Booking.com',
            times: '7 Nights • 9.1/10 Score',
            routeSub: 'Organic Breakfast, 100% Solar Powered',
            estCost: '€345 total',
            actions: [
              { label: 'View Stays on Booking.com ↗', url: directUrls.booking, featured: true }
            ]
          }
        ]
      },

      // 10. Direct Sunset Flight & Beachfront Villa
      {
        id: 'pkg-10',
        title: 'Afternoon Non-Stop Flight & Golden Sunset Villa',
        desc: `Convenient afternoon departure timing arriving just in time for sunset drinks overlooking the water.`,
        badge: '⭐ Highly Rated by Travelers',
        badgeClass: 'top-pick',
        category: 'flight-stay',
        durationStr: '⏱️ 3h 30m Door-to-Door',
        durationMinutes: 210,
        co2kg: 50,
        stops: 0,
        provider: 'skyscanner',
        stayScore: 9.5,
        totalPrice: 535,
        highlight: false,
        legs: [
          {
            carrier: 'Direct Scheduled Airline',
            carrierCode: 'AIR',
            icon: '✈️',
            type: 'Afternoon Direct Flight',
            providerTag: 'Skyscanner',
            times: '15:10 → 17:50 • Non-Stop Flight',
            routeSub: `${originCity} (${originIATA}) → ${destCity} (${destIATA})`,
            estCost: '€135 / traveler',
            actions: [
              { label: 'Book Flight on Skyscanner ↗', url: directUrls.skyscanner, featured: true },
              { label: 'Compare on Google Flights ↗', url: directUrls.googleFlights }
            ]
          },
          {
            carrier: 'Harbor Pier Taxi',
            carrierCode: 'TAXI',
            icon: '🚕',
            type: 'Express Harbor Taxi',
            providerTag: 'Omio',
            times: '18:10 → 18:35 • Direct to Villa',
            routeSub: 'Terminal Pier → Beachfront Walk',
            estCost: '€20 total',
            actions: [
              { label: 'Book Taxi on Omio ↗', url: directUrls.omio, featured: true }
            ]
          },
          {
            carrier: 'Sunset Beachfront Villa',
            carrierCode: 'AIRBNB',
            icon: '🏡',
            type: `Private Villa on Airbnb`,
            providerTag: 'Airbnb',
            times: '7 Nights • 9.5/10 Superhost',
            routeSub: 'Direct Beach Access, Sunset Patio',
            estCost: '€380 total',
            actions: [
              { label: 'View Rentals on Airbnb ↗', url: directUrls.airbnb, featured: true },
              { label: 'Compare on Booking.com ↗', url: directUrls.booking }
            ]
          }
        ]
      }
    ];
  }

  const allItineraries = generateItineraries();

  // --------------------------------------------------------------------------
  // 2. Sorting & Filtering State
  // --------------------------------------------------------------------------
  let currentSort = 'best-value'; // 'cheapest', 'fastest', 'best-value', 'eco'
  let currentCategory = 'all';    // 'all', 'flight-stay', 'train-stay', 'flight-car', 'ferry'
  let currentMaxPrice = 1500;
  let currentStops = 'all';       // 'all', '0', '1'
  let currentMinRating = 0;
  let ecoOnly = false;
  let enabledProviders = {
    skyscanner: true,
    google: true,
    booking: true,
    airbnb: true,
    trainline: true,
    omio: true,
    discoverCars: true
  };

  // --------------------------------------------------------------------------
  // 3. Render Results Feed Cards
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
      card.className = `feed-card ${item.highlight ? 'highlight-pick' : ''}`;
      
      const legsHtml = item.legs.map(leg => `
        <div class="leg-box">
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
          <div class="feed-card-top-row">
            <div class="feed-badges-wrap">
              <span class="feed-badge ${item.badgeClass}">${item.badge}</span>
              <span class="feed-badge duration">${item.durationStr}</span>
              <span class="feed-badge eco">🌿 ${item.co2kg}kg CO2</span>
            </div>
            <div style="font-size: 0.8rem; font-weight: 700; color: #0284c7;">
              ★ ${item.stayScore} Verified Stay
            </div>
          </div>

          <div class="feed-card-header-info" style="margin-top: 10px; margin-bottom: 16px;">
            <h3 class="feed-card-title">${item.title}</h3>
            <p class="feed-card-desc">${item.desc}</p>
          </div>

          <div class="feed-journey-legs-grid">
            ${legsHtml}
          </div>
        </div>

        <div class="feed-card-bottom-row">
          <div class="feed-tco-block">
            <div class="feed-tco-labels">
              <span class="feed-tco-title">Door-to-Door TCO</span>
              <span class="feed-tco-sub">Direct Provider Prices • €0 Fees</span>
            </div>
            <div class="feed-tco-amount">
              <span class="currency">€</span>${item.totalPrice}
            </div>
          </div>

          <button type="button" class="btn-feed-breakdown" data-card-idx="${index}">
            <span>View Trip Breakdown & Direct Links</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
          </button>
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
      // 1. Category Filter
      if (currentCategory !== 'all' && item.category !== currentCategory) {
        return false;
      }

      // 2. Max Price Filter
      if (item.totalPrice > currentMaxPrice) {
        return false;
      }

      // 3. Stops Filter
      if (currentStops === '0' && item.stops !== 0) return false;
      if (currentStops === '1' && item.stops > 1) return false;

      // 4. Rating Filter
      if (currentMinRating > 0 && item.stayScore < currentMinRating) return false;

      // 5. Eco Filter
      if (ecoOnly && item.co2kg > 60) return false;

      return true;
    });

    // Sort Pipeline
    if (currentSort === 'cheapest') {
      filtered.sort((a, b) => a.totalPrice - b.totalPrice);
    } else if (currentSort === 'fastest') {
      filtered.sort((a, b) => a.durationMinutes - b.durationMinutes);
    } else if (currentSort === 'eco') {
      filtered.sort((a, b) => a.co2kg - b.co2kg);
    } else {
      // 'best-value' (Smart Balance)
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

    // Reset input states
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
  // Sort Tabs
  document.querySelectorAll('.sort-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      applyFiltersAndSort();
    });
  });

  // Price Slider
  const priceRangeSlider = document.getElementById('priceRangeSlider');
  const priceDisplayVal = document.getElementById('priceDisplayVal');
  if (priceRangeSlider) {
    priceRangeSlider.addEventListener('input', (e) => {
      currentMaxPrice = parseInt(e.target.value, 10);
      if (priceDisplayVal) priceDisplayVal.textContent = `€${currentMaxPrice}`;
      applyFiltersAndSort();
    });
  }

  // Category Radios
  document.querySelectorAll('input[name="categoryFilter"]').forEach(input => {
    input.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      applyFiltersAndSort();
    });
  });

  // Stops Radios
  document.querySelectorAll('input[name="stopsFilter"]').forEach(input => {
    input.addEventListener('change', (e) => {
      currentStops = e.target.value;
      applyFiltersAndSort();
    });
  });

  // Rating Radios
  document.querySelectorAll('input[name="ratingFilter"]').forEach(input => {
    input.addEventListener('change', (e) => {
      currentMinRating = parseFloat(e.target.value);
      applyFiltersAndSort();
    });
  });

  // Eco Checkbox
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

  // Reset Buttons
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

    if (drawerHeadline) drawerHeadline.textContent = `${originCity} → ${destCity}`;
    if (drawerMetaSub) drawerMetaSub.textContent = `${formattedDates} • ${rawTravelers} Travelers • ${item.title}`;
    if (drawerTcoAmount) drawerTcoAmount.textContent = `€${item.totalPrice}`;

    if (drawerLegsList) {
      drawerLegsList.innerHTML = item.legs.map(leg => {
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

  // Initial render
  applyFiltersAndSort();
}

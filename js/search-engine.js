/**
 * TripMura Design System — Search Engine Master Interactive Controller
 * 4 Core Search Modes: Accommodations (Default), Flights, Cars, Packages.
 * Skyscanner / Booking.com-grade Accommodations Engine, Geocoding Autocomplete,
 * Dual-Month Range & One-Way Calendar, Travelers & Rooms Stepper with Homes Toggle,
 * Quick Filter Chips, and Direct Outbound Affiliate Deep-Linking.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSearchEngine();
});

function initSearchEngine() {
  // Master Elements
  const originInput = document.getElementById('originInput');
  const destInput = document.getElementById('destInput');
  const datesInput = document.getElementById('datesInput');
  const guestsInput = document.getElementById('guestsInput');
  const entireHomesCheckbox = document.getElementById('entireHomesOnly');
  const searchForm = document.getElementById('mainSearchForm') || document.querySelector('.search-input-grid');
  const searchCta = document.getElementById('searchSubmitBtn') || document.querySelector('.search-cta-btn');
  const ctaBtnText = document.getElementById('ctaBtnText');
  const ctaLoadingText = document.getElementById('ctaLoadingText');

  // Field Wrappers
  const originFieldWrap = document.getElementById('originFieldWrap');
  const destFieldWrap = document.getElementById('destFieldWrap');
  const datesFieldWrap = document.getElementById('datesFieldWrap');
  const guestsFieldWrap = document.getElementById('guestsFieldWrap');
  const subOptionsBar = document.getElementById('searchSubOptions');
  const quickFiltersBar = document.getElementById('stayQuickFilters');

  // Field Labels
  const originFieldLabel = document.getElementById('originFieldLabel');
  const destFieldLabel = document.getElementById('destFieldLabel');
  const datesFieldLabel = document.getElementById('datesFieldLabel');
  const guestsFieldLabel = document.getElementById('guestsFieldLabel');
  const destPopoverTitle = document.getElementById('destPopoverTitle');
  const destModalBarTitle = document.getElementById('destModalBarTitle');

  // Popover References
  const originPopover = document.getElementById('originPopover');
  const destPopover = document.getElementById('destPopover');
  const datesModal = document.getElementById('datesPickerModal');
  const travelersModal = document.getElementById('travelersModal');
  const backdrop = document.querySelector('.search-modal-backdrop');

  const allPopovers = [originPopover, destPopover, datesModal, travelersModal].filter(Boolean);
  const allFields = document.querySelectorAll('.search-field');

  // Active State
  let activeMode = 'stays'; // 'stays' (Accommodations - default), 'flights', 'cars', 'packages'
  let currentTripType = 'roundtrip'; // 'roundtrip', 'oneway', 'multicity'
  let currentCabinClass = 'economy';
  let isFlexibleDates = false;
  let activeStayFilter = 'all'; // 'all', 'hotels', 'apartments', 'cancellation', 'toprated', 'pool'

  // Travelers State
  let adults = 2;
  let children = 0;
  let rooms = 1;
  let entireHomesOnly = false;

  // --------------------------------------------------------------------------
  // 1. Curated Popular Presets (Accommodations & Travel Hubs)
  // --------------------------------------------------------------------------
  const presetDestinations = [
    { name: 'Mallorca, Balearic Islands, Spain', sub: 'Palma, Alcúdia & Coastal Resorts', icon: '🏖️', tag: 'Top Island Stay' },
    { name: 'Barcelona, Catalonia, Spain', sub: 'Gothic Quarter, Eixample & Beachfront', icon: '🏨', tag: 'City & Beach' },
    { name: 'London, Greater London, UK', sub: 'Central London, Soho & Westminster', icon: '📍', tag: 'Global Capital' },
    { name: 'Rome, Lazio, Italy', sub: 'Historic Center, Trastevere & Colosseum', icon: '📍', tag: 'Historic Stay' },
    { name: 'Vienna, Austria', sub: 'Innere Stadt, MuseumsQuartier & Schönbrunn', icon: '📍', tag: 'Cultural Stay' },
    { name: 'Paris, Île-de-France, France', sub: 'Le Marais, Saint-Germain & Eiffel', icon: '🏨', tag: 'City of Light' },
    { name: 'Dubai, United Arab Emirates', sub: 'Downtown, Palm Jumeirah & Marina', icon: '🏨', tag: '5★ Luxury' },
    { name: 'Bali, Indonesia', sub: 'Seminyak, Ubud Villas & Canggu', icon: '🌴', tag: 'Tropical Resort' },
    { name: 'Amalfi Coast, Campania, Italy', sub: 'Positano, Amalfi & Cliffside Villas', icon: '🏖️', tag: 'Boutique Stay' },
    { name: 'Santorini, Cyclades, Greece', sub: 'Oia, Fira & Caldera View Suites', icon: '🏖️', tag: 'Island Luxury' },
    { name: 'Nice, Côte d’Azur, France', sub: 'Promenade des Anglais & Old Town', icon: '⛵', tag: 'French Riviera' },
    { name: 'London Heathrow (LHR)', sub: 'Terminals 2, 3, 5 Connections, UK', icon: '✈️', tag: 'Major Airport' },
    { name: 'Vienna Schwechat (VIE)', sub: 'Vienna International Airport, Austria', icon: '✈️', tag: 'Direct Flight' },
    { name: 'Palma de Mallorca (PMI)', sub: 'Son Sant Joan Airport, Spain', icon: '✈️', tag: 'Direct Flight' }
  ];

  // --------------------------------------------------------------------------
  // 2. Helper: Popover & Dropdown Visibility Management
  // --------------------------------------------------------------------------
  function closeAllPopovers() {
    allPopovers.forEach(p => {
      p.classList.remove('open');
      p.classList.remove('active');
    });
    allFields.forEach(f => {
      f.classList.remove('active');
    });
    document.querySelectorAll('.micro-dropdown-menu').forEach(m => m.classList.remove('open'));
    document.querySelectorAll('.micro-option-btn').forEach(b => b.classList.remove('active'));
    document.body.classList.remove('search-modal-open');
    const searchCard = document.querySelector('.multimodal-search-card');
    if (searchCard) searchCard.classList.remove('modal-active');
    if (backdrop) {
      backdrop.classList.remove('open');
      backdrop.classList.remove('active');
    }
  }

  function openPopover(popover, fieldWrap) {
    closeAllPopovers();
    if (popover) {
      popover.classList.add('open');
      popover.classList.add('active');
      document.body.classList.add('search-modal-open');
      const searchCard = document.querySelector('.multimodal-search-card');
      if (searchCard) searchCard.classList.add('modal-active');
      if (backdrop && window.innerWidth <= 640) {
        backdrop.classList.add('open');
        backdrop.classList.add('active');
      }

      // Sync mobile search input value if present
      const modalSearch = popover.querySelector('.modal-search-field');
      if (modalSearch && fieldWrap) {
        const mainInput = fieldWrap.querySelector('.field-input');
        if (mainInput) {
          modalSearch.value = mainInput.value;
          setTimeout(() => modalSearch.focus(), 100);
        }
      }
    }
    if (fieldWrap) {
      fieldWrap.classList.add('active');
    }
  }

  // --------------------------------------------------------------------------
  // 3. Real Global Geocoding API Engine (Photon by Komoot / OpenStreetMap)
  // --------------------------------------------------------------------------
  let fetchAbortControllers = {};

  async function fetchGlobalLocations(query, signal) {
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`;
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error('Geocoding request failed');
      const data = await res.json();
      
      if (!data.features || data.features.length === 0) {
        return [];
      }

      return data.features.map(f => {
        const p = f.properties;
        const name = p.name || p.city || p.country || 'Location';
        
        // Build descriptive subtitle
        const subParts = [];
        if (p.city && p.city !== name) subParts.push(p.city);
        if (p.state && p.state !== name && p.state !== p.city) subParts.push(p.state);
        if (p.country) subParts.push(p.country);
        const sub = subParts.join(', ') || p.country || 'Global Location';

        // Categorize icon and badge
        let icon = '📍';
        let tag = 'City / Region';

        const osmVal = (p.osm_value || '').toLowerCase();
        const osmKey = (p.osm_key || '').toLowerCase();
        const lowerName = name.toLowerCase();

        if (osmVal === 'aerodrome' || osmVal === 'airport' || lowerName.includes('airport') || lowerName.includes('flughafen')) {
          icon = '✈️';
          tag = 'Airport';
        } else if (osmVal === 'hotel' || osmVal === 'resort' || osmKey === 'tourism' || lowerName.includes('resort') || lowerName.includes('hotel') || lowerName.includes('villa') || lowerName.includes('suites')) {
          icon = '🏨';
          tag = 'Hotel / Stay';
        } else if (osmVal === 'station' || osmVal === 'train_station' || osmKey === 'railway' || lowerName.includes('station')) {
          icon = '🚆';
          tag = 'Station';
        }

        return { name, sub, icon, tag };
      });
    } catch (err) {
      if (err.name === 'AbortError') return null;
      console.warn('Geocoding API network fallback to curated presets:', err);
      const q = query.toLowerCase();
      return presetDestinations.filter(h => 
        h.name.toLowerCase().includes(q) || 
        h.sub.toLowerCase().includes(q) || 
        h.tag.toLowerCase().includes(q)
      );
    }
  }

  function renderLocationList(container, inputEl, nextOpenFn) {
    if (!container) return;
    const listEl = container.querySelector('.location-list');
    if (!listEl) return;

    const modalSearchInput = container.querySelector('.modal-search-field');
    const modalClearBtn = container.querySelector('.modal-input-clear');

    let debounceTimer = null;
    const inputKey = inputEl.id;

    function renderItems(items, isLoading = false, searchQuery = '') {
      listEl.innerHTML = '';

      if (isLoading) {
        listEl.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 20px; color: var(--text-secondary); font-size: 0.85rem;">
            <span class="btn-spinner" style="border-color: rgba(2, 132, 199, 0.2); border-top-color: var(--primary-azure); width: 18px; height: 18px;"></span>
            <span>Searching destinations &amp; properties...</span>
          </div>
        `;
        return;
      }

      if (!items || items.length === 0) {
        listEl.innerHTML = `
          <div style="padding: 18px 12px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
            <span>No results for "${searchQuery}". Try searching a city, island, or hotel name.</span>
          </div>
        `;
        return;
      }

      items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'location-item';
        row.innerHTML = `
          <div class="location-main">
            <span class="location-icon">${item.icon}</span>
            <div class="location-text">
              <span class="location-name">${escapeHtml(item.name)}</span>
              <span class="location-sub">${escapeHtml(item.sub)}</span>
            </div>
          </div>
          <span class="location-tag">${escapeHtml(item.tag)}</span>
        `;

        row.addEventListener('click', (e) => {
          e.stopPropagation();
          inputEl.value = item.name;
          if (modalSearchInput) modalSearchInput.value = item.name;
          closeAllPopovers();
          if (nextOpenFn && window.innerWidth > 640) nextOpenFn();
        });

        listEl.appendChild(row);
      });
    }

    function escapeHtml(str) {
      return (str || '').replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
      );
    }

    renderItems(presetDestinations);

    function handleQueryInput(q) {
      clearTimeout(debounceTimer);

      if (fetchAbortControllers[inputKey]) {
        fetchAbortControllers[inputKey].abort();
      }

      if (!q) {
        renderItems(presetDestinations);
        return;
      }

      const instantLocal = presetDestinations.filter(h => 
        h.name.toLowerCase().includes(q.toLowerCase()) || 
        h.sub.toLowerCase().includes(q.toLowerCase())
      );
      if (instantLocal.length > 0) {
        renderItems(instantLocal);
      } else {
        renderItems([], true);
      }

      debounceTimer = setTimeout(async () => {
        const controller = new AbortController();
        fetchAbortControllers[inputKey] = controller;

        const results = await fetchGlobalLocations(q, controller.signal);
        if (results !== null) {
          renderItems(results, false, q);
        }
      }, 220);
    }

    inputEl.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (modalSearchInput) modalSearchInput.value = e.target.value;
      openPopover(container, inputEl.closest('.search-field'));
      handleQueryInput(q);
    });

    if (modalSearchInput) {
      modalSearchInput.addEventListener('input', (e) => {
        const q = e.target.value.trim();
        inputEl.value = e.target.value;
        handleQueryInput(q);
      });
    }

    if (modalClearBtn) {
      modalClearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (modalSearchInput) modalSearchInput.value = '';
        inputEl.value = '';
        renderItems(presetDestinations);
        if (modalSearchInput) modalSearchInput.focus();
      });
    }

    inputEl.addEventListener('click', (e) => {
      e.stopPropagation();
      openPopover(container, inputEl.closest('.search-field'));
      if (!inputEl.value.trim()) {
        renderItems(presetDestinations);
      }
    });
  }

  // Initialize Autocomplete on Origin & Destination
  if (originPopover && originInput) {
    renderLocationList(originPopover, originInput, () => {
      if (destInput) {
        destInput.focus();
        openPopover(destPopover, destInput.closest('.search-field'));
      }
    });
  }

  if (destPopover && destInput) {
    renderLocationList(destPopover, destInput, () => {
      if (datesInput) {
        openPopover(datesModal, datesInput.closest('.search-field'));
      }
    });
  }

  // --------------------------------------------------------------------------
  // 4. Dynamic 4 Core Category Switcher (Accommodations, Flights, Cars, Packages)
  // --------------------------------------------------------------------------
  const categoryTabs = document.querySelectorAll('.search-mode-tab');

  function setMode(mode) {
    activeMode = mode;

    categoryTabs.forEach(tab => {
      const isCurrent = tab.dataset.mode === mode;
      tab.classList.toggle('active', isCurrent);
      tab.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });

    if (mode === 'stays') {
      // 🏨 Accommodations (Default Single-Destination Mode)
      if (searchForm) searchForm.classList.add('single-dest');
      if (originFieldWrap) originFieldWrap.classList.add('hidden-mode');
      if (subOptionsBar) subOptionsBar.style.display = 'none';
      if (quickFiltersBar) quickFiltersBar.style.display = 'flex';

      if (destFieldLabel) destFieldLabel.textContent = 'Destination';
      if (destInput) {
        destInput.placeholder = 'City, landmark or specific property';
        if (!destInput.value || destInput.value.includes('Amalfi')) {
          destInput.value = 'Mallorca, Spain';
        }
      }
      if (destPopoverTitle) destPopoverTitle.textContent = 'Popular Stay Destinations';
      if (destModalBarTitle) destModalBarTitle.textContent = 'Choose Destination';

      if (datesFieldLabel) datesFieldLabel.textContent = 'Check-in — Check-out';
      if (guestsFieldLabel) guestsFieldLabel.textContent = 'Guests & Rooms';
      if (ctaBtnText) ctaBtnText.textContent = 'Search Deals';
      if (ctaLoadingText) ctaLoadingText.textContent = 'Finding best deals...';

      updateTravelersSummary();
      updateDatesInputText();
    } else if (mode === 'flights') {
      // ✈️ Flights
      if (searchForm) searchForm.classList.remove('single-dest');
      if (originFieldWrap) originFieldWrap.classList.remove('hidden-mode');
      if (subOptionsBar) subOptionsBar.style.display = 'flex';
      if (quickFiltersBar) quickFiltersBar.style.display = 'none';

      if (originFieldLabel) originFieldLabel.textContent = 'From';
      if (originInput) {
        originInput.placeholder = 'City or Airport (e.g. LHR, VIE)';
        if (!originInput.value) originInput.value = 'London (LON)';
      }

      if (destFieldLabel) destFieldLabel.textContent = 'To';
      if (destInput) {
        destInput.placeholder = 'City or Airport (e.g. PMI, BCN)';
        if (!destInput.value || destInput.value.includes('Mallorca')) {
          destInput.value = 'Palma de Mallorca (PMI)';
        }
      }
      if (destPopoverTitle) destPopoverTitle.textContent = 'Popular Flight Destinations';
      if (destModalBarTitle) destModalBarTitle.textContent = 'Choose Arrival Airport';

      if (datesFieldLabel) datesFieldLabel.textContent = 'Trip Dates';
      if (guestsFieldLabel) guestsFieldLabel.textContent = 'Travelers & Cabin';
      if (ctaBtnText) ctaBtnText.textContent = 'Find Flights';
      if (ctaLoadingText) ctaLoadingText.textContent = 'Scanning 100+ airlines...';

      updateTravelersSummary();
      updateDatesInputText();
    } else if (mode === 'cars') {
      // 🚗 Cars
      if (searchForm) searchForm.classList.remove('single-dest');
      if (originFieldWrap) originFieldWrap.classList.remove('hidden-mode');
      if (subOptionsBar) subOptionsBar.style.display = 'flex';
      if (quickFiltersBar) quickFiltersBar.style.display = 'none';

      if (originFieldLabel) originFieldLabel.textContent = 'Pick-up Location';
      if (originInput) originInput.placeholder = 'Airport, City or Rental Hub';

      if (destFieldLabel) destFieldLabel.textContent = 'Drop-off Location';
      if (destInput) destInput.placeholder = 'Same as pick-up or different city';

      if (datesFieldLabel) datesFieldLabel.textContent = 'Rental Dates';
      if (guestsFieldLabel) guestsFieldLabel.textContent = 'Driver Age';
      if (ctaBtnText) ctaBtnText.textContent = 'Find Cars';
      if (ctaLoadingText) ctaLoadingText.textContent = 'Comparing top car fleets...';

      if (guestsInput) guestsInput.value = 'Driver age 25–70';
      updateDatesInputText();
    } else if (mode === 'packages') {
      // 🌴 Packages (Flight + Hotel)
      if (searchForm) searchForm.classList.remove('single-dest');
      if (originFieldWrap) originFieldWrap.classList.remove('hidden-mode');
      if (subOptionsBar) subOptionsBar.style.display = 'flex';
      if (quickFiltersBar) quickFiltersBar.style.display = 'none';

      if (originFieldLabel) originFieldLabel.textContent = 'Departure Hub';
      if (destFieldLabel) destFieldLabel.textContent = 'Destination Stay';
      if (datesFieldLabel) datesFieldLabel.textContent = 'Travel Dates';
      if (guestsFieldLabel) guestsFieldLabel.textContent = 'Guests & Rooms';
      if (ctaBtnText) ctaBtnText.textContent = 'Find Packages';
      if (ctaLoadingText) ctaLoadingText.textContent = 'Bundling flight + stay deals...';

      updateTravelersSummary();
      updateDatesInputText();
    }
  }

  categoryTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      setMode(tab.dataset.mode);
    });
  });

  // Also bind navigation links with data-nav-mode
  document.querySelectorAll('[data-nav-mode]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetMode = link.dataset.navMode;
      if (targetMode) {
        setMode(targetMode);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 5. Accommodations Quick Filter Chips
  // --------------------------------------------------------------------------
  const filterChips = document.querySelectorAll('.quick-filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeStayFilter = chip.dataset.filter || 'all';

      // Auto-sync entire homes checkbox if apartments is clicked
      if (activeStayFilter === 'apartments') {
        entireHomesOnly = true;
        if (entireHomesCheckbox) entireHomesCheckbox.checked = true;
      } else if (activeStayFilter === 'hotels') {
        entireHomesOnly = false;
        if (entireHomesCheckbox) entireHomesCheckbox.checked = false;
      }
      updateTravelersSummary();
    });
  });

  // --------------------------------------------------------------------------
  // 6. Interactive Dual-Month Range & Weekend Calendar
  // --------------------------------------------------------------------------
  const today = new Date();
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let currentCalYear = today.getFullYear();
  let currentCalMonth = today.getMonth();

  // Dynamic initialization: 7 days in advance
  let selectedStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  let selectedEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14);
  let selectingState = 'idle';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function formatDisplayDate(date) {
    if (!date) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }

  function updateDatesInputText() {
    if (!datesInput) return;

    if (currentTripType === 'oneway' && activeMode !== 'stays') {
      if (selectedStart) {
        datesInput.value = `${formatDisplayDate(selectedStart)} ${selectedStart.getFullYear()} (One-way)`;
      } else {
        datesInput.value = 'Select Departure Date';
      }
      return;
    }

    if (selectedStart && selectedEnd) {
      const diffMs = selectedEnd.getTime() - selectedStart.getTime();
      const nights = Math.max(Math.round(diffMs / (1000 * 60 * 60 * 24)), 1);

      if (activeMode === 'stays') {
        datesInput.value = `${formatDisplayDate(selectedStart)} – ${formatDisplayDate(selectedEnd)} (${nights} night${nights > 1 ? 's' : ''})`;
      } else {
        datesInput.value = `${formatDisplayDate(selectedStart)} – ${formatDisplayDate(selectedEnd)}`;
      }
    } else if (selectedStart) {
      datesInput.value = `${formatDisplayDate(selectedStart)} – Select Check-out`;
    } else {
      datesInput.value = 'Select dates';
    }
  }

  function renderCalendarMonth(year, month, gridEl) {
    if (!gridEl) return;
    gridEl.innerHTML = '';
    
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = (firstDay + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement('div');
      empty.className = 'day-cell disabled';
      gridEl.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const cell = document.createElement('div');
      cell.className = 'day-cell';
      cell.textContent = day;

      const isPast = cellDate < todayNormalized;
      if (isPast) {
        cell.classList.add('disabled');
      }

      const isStart = selectedStart && cellDate.toDateString() === selectedStart.toDateString();
      const isEnd = selectedEnd && cellDate.toDateString() === selectedEnd.toDateString();
      const inRange = selectedStart && selectedEnd && cellDate > selectedStart && cellDate < selectedEnd;

      if (isStart) cell.classList.add('range-start');
      if (isEnd) cell.classList.add('range-end');
      if (inRange) cell.classList.add('in-range');

      if (!isPast) {
        cell.addEventListener('click', (e) => {
          e.stopPropagation();

          if (currentTripType === 'oneway' && activeMode !== 'stays') {
            selectedStart = cellDate;
            selectedEnd = null;
            selectingState = 'idle';
            updateDatesInputText();
            renderAllCalendars();
            return;
          }

          if (selectingState === 'idle' || (selectedStart && selectedEnd)) {
            selectedStart = cellDate;
            selectedEnd = null;
            selectingState = 'picking-end';
          } else if (selectingState === 'picking-end') {
            if (cellDate < selectedStart) {
              selectedStart = cellDate;
              selectedEnd = null;
            } else {
              selectedEnd = cellDate;
              selectingState = 'idle';
            }
          }
          updateDatesInputText();
          renderAllCalendars();
        });
      }

      gridEl.appendChild(cell);
    }
  }

  function renderAllCalendars() {
    const month1Grid = document.getElementById('june2026Grid');
    const month2Grid = document.getElementById('july2026Grid');
    const month1Header = document.getElementById('month1Header');
    const month2Header = document.getElementById('month2Header');

    const year1 = currentCalYear;
    const month1 = currentCalMonth;

    let year2 = currentCalYear;
    let month2 = currentCalMonth + 1;
    if (month2 > 11) {
      month2 = 0;
      year2 = currentCalYear + 1;
    }

    if (month1Header) month1Header.textContent = `${monthNames[month1]} ${year1}`;
    if (month2Header) month2Header.textContent = `${monthNames[month2]} ${year2}`;

    renderCalendarMonth(year1, month1, month1Grid);
    renderCalendarMonth(year2, month2, month2Grid);
  }

  updateDatesInputText();
  renderAllCalendars();

  const calPrevMonth = document.getElementById('calPrevMonth');
  const calNextMonth = document.getElementById('calNextMonth');

  if (calPrevMonth) {
    calPrevMonth.addEventListener('click', (e) => {
      e.stopPropagation();
      currentCalMonth--;
      if (currentCalMonth < 0) {
        currentCalMonth = 11;
        currentCalYear--;
      }
      renderAllCalendars();
    });
  }

  if (calNextMonth) {
    calNextMonth.addEventListener('click', (e) => {
      e.stopPropagation();
      currentCalMonth++;
      if (currentCalMonth > 11) {
        currentCalMonth = 0;
        currentCalYear++;
      }
      renderAllCalendars();
    });
  }

  const applyDatesBtn = document.getElementById('applyDatesBtn');
  if (applyDatesBtn) {
    applyDatesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateDatesInputText();
      closeAllPopovers();
      if (guestsInput) openPopover(travelersModal, guestsInput.closest('.search-field'));
    });
  }

  if (datesInput) {
    datesInput.addEventListener('click', (e) => {
      e.stopPropagation();
      openPopover(datesModal, datesInput.closest('.search-field'));
    });
  }

  // --------------------------------------------------------------------------
  // 7. Guests & Rooms Stepper Popover with Entire Homes Toggle
  // --------------------------------------------------------------------------
  function updateTravelersSummary() {
    if (!guestsInput) return;

    if (activeMode === 'stays' || activeMode === 'packages') {
      let summary = `${adults} Adult${adults > 1 ? 's' : ''} · ${rooms} Room${rooms > 1 ? 's' : ''}`;
      if (children > 0) {
        summary = `${adults} Adults, ${children} Child${children > 1 ? 'ren' : ''} · ${rooms} Room${rooms > 1 ? 's' : ''}`;
      }
      if (entireHomesOnly) {
        summary += ' (Homes)';
      }
      guestsInput.value = summary;
    } else if (activeMode === 'flights') {
      const pax = adults + children;
      const cabinLabel = currentCabinClass.charAt(0).toUpperCase() + currentCabinClass.slice(1);
      guestsInput.value = `${pax} Traveler${pax > 1 ? 's' : ''} · ${cabinLabel}`;
    } else if (activeMode === 'cars') {
      guestsInput.value = 'Driver age 25–70';
    }

    const adultsEl = document.getElementById('adultsVal');
    const childrenEl = document.getElementById('childrenVal');
    const roomsEl = document.getElementById('roomsVal');

    if (adultsEl) adultsEl.textContent = adults;
    if (childrenEl) childrenEl.textContent = children;
    if (roomsEl) roomsEl.textContent = rooms;

    const adultsMinus = document.getElementById('adultsMinus');
    const childrenMinus = document.getElementById('childrenMinus');
    const roomsMinus = document.getElementById('roomsMinus');

    if (adultsMinus) adultsMinus.disabled = adults <= 1;
    if (childrenMinus) childrenMinus.disabled = children <= 0;
    if (roomsMinus) roomsMinus.disabled = rooms <= 1;
  }

  function setupStepper(plusId, minusId, getVal, setVal, min, max) {
    const plusBtn = document.getElementById(plusId);
    const minusBtn = document.getElementById(minusId);

    if (plusBtn) {
      plusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (getVal() < max) {
          setVal(getVal() + 1);
          updateTravelersSummary();
        }
      });
    }

    if (minusBtn) {
      minusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (getVal() > min) {
          setVal(getVal() - 1);
          updateTravelersSummary();
        }
      });
    }
  }

  setupStepper('adultsPlus', 'adultsMinus', () => adults, (v) => { adults = v; }, 1, 10);
  setupStepper('childrenPlus', 'childrenMinus', () => children, (v) => { children = v; }, 0, 8);
  setupStepper('roomsPlus', 'roomsMinus', () => rooms, (v) => { rooms = v; }, 1, 8);

  if (entireHomesCheckbox) {
    entireHomesCheckbox.addEventListener('change', (e) => {
      entireHomesOnly = e.target.checked;
      if (entireHomesOnly && activeStayFilter !== 'apartments') {
        filterChips.forEach(c => c.classList.remove('active'));
        const aptChip = document.querySelector('[data-filter="apartments"]');
        if (aptChip) aptChip.classList.add('active');
        activeStayFilter = 'apartments';
      }
      updateTravelersSummary();
    });
  }

  const applyTravelersBtn = document.getElementById('applyTravelersBtn');
  if (applyTravelersBtn) {
    applyTravelersBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateTravelersSummary();
      closeAllPopovers();
    });
  }

  const applyTravelersDesktopBtn = document.getElementById('applyTravelersDesktopBtn');
  if (applyTravelersDesktopBtn) {
    applyTravelersDesktopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateTravelersSummary();
      closeAllPopovers();
    });
  }

  if (guestsInput) {
    guestsInput.addEventListener('click', (e) => {
      e.stopPropagation();
      openPopover(travelersModal, guestsInput.closest('.search-field'));
    });
  }

  // --------------------------------------------------------------------------
  // 8. Mobile Navigation & Dismissal Handlers
  // --------------------------------------------------------------------------
  document.querySelectorAll('.modal-back-btn, .modal-close-icon-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllPopovers();
    });
  });

  const applyOriginBtn = document.getElementById('applyOriginBtn');
  if (applyOriginBtn) {
    applyOriginBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllPopovers();
    });
  }

  const applyDestBtn = document.getElementById('applyDestBtn');
  if (applyDestBtn) {
    applyDestBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllPopovers();
    });
  }

  const applyDatesModalBtn = document.getElementById('applyDatesModalBtn');
  if (applyDatesModalBtn) {
    applyDatesModalBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateDatesInputText();
      closeAllPopovers();
    });
  }

  document.addEventListener('click', (e) => {
    if (
      !e.target.closest('.search-field-wrap') && 
      !e.target.closest('.search-popover') &&
      !e.target.closest('.micro-dropdown-wrap')
    ) {
      closeAllPopovers();
    }
  });

  if (backdrop) {
    backdrop.addEventListener('click', () => {
      closeAllPopovers();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllPopovers();
    }
  });

  // --------------------------------------------------------------------------
  // 9. Search CTA Submit & Real Outbound Affiliate Forwarding
  // --------------------------------------------------------------------------
  function formatDateISO(d) {
    if (!d) return '';
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${day}`;
  }

  function triggerSearchAction() {
    closeAllPopovers();

    const destination = (destInput ? destInput.value.trim() : '') || 'Mallorca, Spain';
    const origin = (originInput ? originInput.value.trim() : '') || 'London (LON)';
    const checkInISO = formatDateISO(selectedStart);
    const checkOutISO = formatDateISO(selectedEnd);

    if (activeMode === 'stays') {
      // Accommodations Outbound Metasearch Route Generation
      let targetUrl = '';
      let providerName = 'Booking.com';

      if (entireHomesOnly || activeStayFilter === 'apartments') {
        targetUrl = window.FORWARDING_ENGINE 
          ? window.FORWARDING_ENGINE.buildAirbnbUrl(destination, checkInISO, checkOutISO, adults, children, true)
          : `https://www.airbnb.com/s/${encodeURIComponent(destination)}/homes?checkin=${checkInISO}&checkout=${checkOutISO}&adults=${adults}&children=${children}&room_types%5B%5D=Entire%20home%2Fapt`;
        providerName = 'Airbnb & Vacation Rentals';
      } else {
        targetUrl = window.FORWARDING_ENGINE
          ? window.FORWARDING_ENGINE.buildBookingComUrl(destination, checkInISO, checkOutISO, adults, rooms, children, '2369322')
          : `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}&checkin=${checkInISO}&checkout=${checkOutISO}&group_adults=${adults}&no_rooms=${rooms}&group_children=${children}&aid=2369322`;
        providerName = 'Booking.com Official Portal';
      }

      if (window.FORWARDING_ENGINE && window.FORWARDING_ENGINE.triggerForwarding) {
        window.FORWARDING_ENGINE.triggerForwarding(providerName, targetUrl, 'Best Direct Rate', {
          route: destination,
          dates: `${formatDisplayDate(selectedStart)} – ${formatDisplayDate(selectedEnd)}`,
          pax: `${adults} Guests · ${rooms} Room`
        });
      } else {
        window.open(targetUrl, '_blank');
      }
      return;
    }

    if (activeMode === 'cars') {
      const loc = destination || origin || 'Mallorca';
      const targetUrl = window.FORWARDING_ENGINE
        ? window.FORWARDING_ENGINE.buildDiscoverCarsUrl(loc, checkInISO, checkOutISO, '779382')
        : `https://www.discovercars.com/?search=${encodeURIComponent(loc)}&a_aid=779382`;

      if (window.FORWARDING_ENGINE && window.FORWARDING_ENGINE.triggerForwarding) {
        window.FORWARDING_ENGINE.triggerForwarding('DiscoverCars Portal', targetUrl, 'Best Rental Deal', {
          route: loc,
          dates: `${formatDisplayDate(selectedStart)} – ${formatDisplayDate(selectedEnd)}`,
          pax: 'Driver age 25–70'
        });
      } else {
        window.open(targetUrl, '_blank');
      }
      return;
    }

    // Flights or Packages -> Navigate to results engine
    const params = new URLSearchParams({
      from: origin,
      to: destination,
      depart: checkInISO,
      return: checkOutISO,
      travelers: adults,
      children: children,
      rooms: rooms,
      cabin: currentCabinClass || 'economy',
      mode: activeMode
    });
    window.location.href = `results.html?${params.toString()}`;
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      triggerSearchAction();
    });
  }

  if (searchCta) {
    searchCta.addEventListener('click', (e) => {
      e.preventDefault();
      triggerSearchAction();
    });
  }

  // Initialize Default Mode: Accommodations
  setMode('stays');
}

/**
 * TripMura Design System — Search Engine Master Interactive Controller
 * Dynamic Category Switcher, Real Global Geocoding Autocomplete,
 * Dual-Month Range & One-Way Calendar, Travelers Stepper & Micro-Dropdowns.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSearchEngine();
});

function initSearchEngine() {
  // Master Input Elements
  const originInput = document.getElementById('originInput');
  const destInput = document.getElementById('destInput');
  const datesInput = document.getElementById('datesInput');
  const guestsInput = document.getElementById('guestsInput');
  const searchForm = document.querySelector('.search-input-grid');
  const searchCta = document.querySelector('.search-cta-btn');

  // Popover references
  const originPopover = document.getElementById('originPopover');
  const destPopover = document.getElementById('destPopover');
  const datesModal = document.getElementById('datesPickerModal');
  const travelersModal = document.getElementById('travelersModal');
  const backdrop = document.querySelector('.search-modal-backdrop');

  const allPopovers = [originPopover, destPopover, datesModal, travelersModal].filter(Boolean);
  const allFields = document.querySelectorAll('.search-field');

  // Global state
  let currentTripType = 'roundtrip'; // 'roundtrip', 'oneway', 'multicity'
  let currentCabinClass = 'economy';
  let isFlexibleDates = false;

  // --------------------------------------------------------------------------
  // 1. Curated Multimodal Preset Hubs (Shown when input is empty or focused)
  // --------------------------------------------------------------------------
  const presetHubs = [
    { name: 'London St Pancras', sub: 'Eurostar Main Terminal, UK', icon: '🚆', tag: 'High-Speed Rail' },
    { name: 'London Heathrow (LHR)', sub: 'Terminals 2, 3, 5 Connections, UK', icon: '✈️', tag: 'Direct Flight' },
    { name: 'Vienna Schwechat (VIE)', sub: 'Vienna International Airport, Austria', icon: '✈️', tag: 'Direct Flight' },
    { name: 'Vienna Central Station', sub: 'Wien Hauptbahnhof (ÖBB Railjet)', icon: '🚆', tag: 'Fast Rail' },
    { name: 'Amalfi Coast, Italy', sub: 'Positano & Amalfi Coastal Pier', icon: '📍', tag: 'Scenic Destination' },
    { name: 'Naples Central Station', sub: 'Frecciarossa & Italo High-Speed', icon: '🚆', tag: 'Fast Rail' },
    { name: 'Naples Airport (NAP)', sub: 'Capodichino International, Italy', icon: '✈️', tag: 'Airport' },
    { name: 'Capri Island Marina', sub: 'Marina Grande Hydrofoil Port, Italy', icon: '⛵', tag: 'Ferry Link' },
    { name: 'Lake Como, Bellagio Villa', sub: 'Lake Como Ferry & Luxury Villas, Italy', icon: '📍', tag: 'Boutique Stay' },
    { name: 'Zurich Hauptbahnhof', sub: 'SBB Swiss Federal Railways Hub', icon: '🚆', tag: 'Scenic Rail' },
    { name: 'Paris Charles de Gaulle (CDG)', sub: 'Roissy Airport, France', icon: '✈️', tag: 'Airport' },
    { name: 'Tokyo Haneda (HND)', sub: 'Ota City, Tokyo, Japan', icon: '✈️', tag: 'Airport' }
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
        let tag = 'City / Destination';

        const osmVal = (p.osm_value || '').toLowerCase();
        const osmKey = (p.osm_key || '').toLowerCase();
        const lowerName = name.toLowerCase();

        if (osmVal === 'aerodrome' || osmVal === 'airport' || lowerName.includes('airport') || lowerName.includes('flughafen')) {
          icon = '✈️';
          tag = 'Airport';
        } else if (osmVal === 'station' || osmVal === 'train_station' || osmKey === 'railway' || lowerName.includes('station') || lowerName.includes('bahnhof') || lowerName.includes('gare')) {
          icon = '🚆';
          tag = 'Rail Station';
        } else if (osmVal === 'hotel' || osmVal === 'resort' || osmKey === 'tourism' || lowerName.includes('resort') || lowerName.includes('hotel')) {
          icon = '🏨';
          tag = 'Stay / Resort';
        } else if (osmVal === 'ferry_terminal' || lowerName.includes('port') || lowerName.includes('marina')) {
          icon = '⛵';
          tag = 'Ferry Port';
        }

        return { name, sub, icon, tag };
      });
    } catch (err) {
      if (err.name === 'AbortError') return null; // Cancelled
      console.warn('Geocoding API network fallback to curated presets:', err);
      // Fallback: local filter
      const q = query.toLowerCase();
      return presetHubs.filter(h => 
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
            <span>Searching global airports, rail & hubs...</span>
          </div>
        `;
        return;
      }

      if (!items || items.length === 0) {
        listEl.innerHTML = `
          <div style="padding: 18px 12px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
            <span>No destinations found for "${searchQuery}". Try a major city or airport.</span>
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

    // Initial render with curated popular hubs
    renderItems(presetHubs);

    function handleQueryInput(q) {
      clearTimeout(debounceTimer);

      if (fetchAbortControllers[inputKey]) {
        fetchAbortControllers[inputKey].abort();
      }

      if (!q) {
        renderItems(presetHubs);
        return;
      }

      // Instant local matches first
      const instantLocal = presetHubs.filter(h => 
        h.name.toLowerCase().includes(q.toLowerCase()) || 
        h.sub.toLowerCase().includes(q.toLowerCase())
      );
      if (instantLocal.length > 0) {
        renderItems(instantLocal);
      } else {
        renderItems([], true); // Show loading
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

    // Live typing handler on main input
    inputEl.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (modalSearchInput) modalSearchInput.value = e.target.value;
      openPopover(container, inputEl.closest('.search-field'));
      handleQueryInput(q);
    });

    // Mobile search input handler
    if (modalSearchInput) {
      modalSearchInput.addEventListener('input', (e) => {
        const q = e.target.value.trim();
        inputEl.value = e.target.value;
        handleQueryInput(q);
      });
    }

    // Clear button handler
    if (modalClearBtn) {
      modalClearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (modalSearchInput) modalSearchInput.value = '';
        inputEl.value = '';
        renderItems(presetHubs);
        if (modalSearchInput) modalSearchInput.focus();
      });
    }

    // Input focus / click handler
    inputEl.addEventListener('click', (e) => {
      e.stopPropagation();
      openPopover(container, inputEl.closest('.search-field'));
      if (!inputEl.value.trim()) {
        renderItems(presetHubs);
      }
    });
  }

  // Initialize Origin & Destination Dropdowns
  renderLocationList(originPopover, originInput, () => {
    destInput.focus();
    openPopover(destPopover, destInput.closest('.search-field'));
  });

  renderLocationList(destPopover, destInput, () => {
    openPopover(datesModal, datesInput.closest('.search-field'));
  });

  // --------------------------------------------------------------------------
  // 4. Category Mode Tabs & Dynamic Context-Aware Controls
  // --------------------------------------------------------------------------
  const tripTypeBtn = document.getElementById('tripTypeBtn');
  const tripTypeMenu = document.getElementById('tripTypeMenu');
  const tripTypeLabel = document.getElementById('tripTypeLabel');

  const cabinClassBtn = document.getElementById('cabinClassBtn');
  const cabinClassMenu = document.getElementById('cabinClassMenu');
  const cabinClassLabel = document.getElementById('cabinClassLabel');

  const subOptionsConfig = {
    holiday: {
      opt1: {
        label: 'Roundtrip',
        defaultVal: 'roundtrip',
        items: [
          { val: 'roundtrip', label: 'Roundtrip' },
          { val: 'oneway', label: 'One-way' },
          { val: 'multicity', label: 'Multi-city' }
        ],
        isTripType: true
      },
      opt2: {
        label: 'Economy',
        defaultVal: 'economy',
        items: [
          { val: 'economy', label: 'Economy' },
          { val: 'premium', label: 'Premium Economy' },
          { val: 'business', label: 'Business Class' },
          { val: 'first', label: 'First Class' }
        ]
      }
    },
    flights: {
      opt1: {
        label: 'Roundtrip',
        defaultVal: 'roundtrip',
        items: [
          { val: 'roundtrip', label: 'Roundtrip' },
          { val: 'oneway', label: 'One-way' },
          { val: 'multicity', label: 'Multi-city' }
        ],
        isTripType: true
      },
      opt2: {
        label: 'Economy',
        defaultVal: 'economy',
        items: [
          { val: 'economy', label: 'Economy' },
          { val: 'premium', label: 'Premium Economy' },
          { val: 'business', label: 'Business Class' },
          { val: 'first', label: 'First Class' }
        ]
      }
    },
    stays: {
      opt1: {
        label: 'All Stays',
        defaultVal: 'all_stays',
        items: [
          { val: 'all_stays', label: 'All Stays' },
          { val: 'boutique', label: 'Boutique Hotels' },
          { val: 'villas', label: 'Luxury Villas' },
          { val: 'apartments', label: 'Apartments & Chalets' }
        ],
        isTripType: false
      },
      opt2: {
        label: 'Top Rated (8.5+)',
        defaultVal: '8.5',
        items: [
          { val: 'any', label: 'Any Rating' },
          { val: '8.5', label: 'Top Rated (8.5+)' },
          { val: '9.0', label: 'Exceptional (9.0+)' },
          { val: '5star', label: '5-Star Luxury' }
        ]
      }
    },
    rail: {
      opt1: {
        label: 'Roundtrip',
        defaultVal: 'roundtrip',
        items: [
          { val: 'roundtrip', label: 'Roundtrip' },
          { val: 'oneway', label: 'One-way' }
        ],
        isTripType: true
      },
      opt2: {
        label: 'Standard Class',
        defaultVal: 'standard',
        items: [
          { val: 'standard', label: 'Standard Class' },
          { val: 'executive', label: '1st Class / Executive' },
          { val: 'sleeper', label: 'Couchette / Sleeper' }
        ]
      }
    },
    cars: {
      opt1: {
        label: 'Return to same location',
        defaultVal: 'same',
        items: [
          { val: 'same', label: 'Return to same location' },
          { val: 'diff', label: 'Different Drop-off' }
        ],
        isTripType: false
      },
      opt2: {
        label: 'Any Car Type',
        defaultVal: 'any',
        items: [
          { val: 'any', label: 'Any Car Type' },
          { val: 'compact', label: 'Compact' },
          { val: 'suv', label: 'SUV / 4x4' },
          { val: 'luxury', label: 'Luxury' },
          { val: 'electric', label: 'Electric' }
        ]
      }
    },
    packages: {
      opt1: {
        label: 'Roundtrip',
        defaultVal: 'roundtrip',
        items: [
          { val: 'roundtrip', label: 'Roundtrip' },
          { val: 'oneway', label: 'One-way' },
          { val: 'multicity', label: 'Multi-city' }
        ],
        isTripType: true
      },
      opt2: {
        label: 'Economy',
        defaultVal: 'economy',
        items: [
          { val: 'economy', label: 'Economy' },
          { val: 'premium', label: 'Premium Economy' },
          { val: 'business', label: 'Business Class' },
          { val: 'first', label: 'First Class' }
        ]
      }
    }
  };

  let activeMode = 'holiday';

  function renderSubOptions(mode) {
    const cfg = subOptionsConfig[mode] || subOptionsConfig.holiday;
    
    // Update Option 1
    if (tripTypeLabel) tripTypeLabel.textContent = cfg.opt1.label;
    if (tripTypeMenu) {
      tripTypeMenu.innerHTML = cfg.opt1.items.map((item, idx) => `
        <div class="micro-option-item ${item.val === cfg.opt1.defaultVal ? 'active' : ''}" data-val="${item.val}" role="option">
          ${item.label}
        </div>
      `).join('');
      
      tripTypeMenu.querySelectorAll('.micro-option-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          tripTypeMenu.querySelectorAll('.micro-option-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          const val = item.dataset.val;
          const text = item.textContent.trim();
          if (tripTypeLabel) tripTypeLabel.textContent = text;
          tripTypeMenu.classList.remove('open');
          if (tripTypeBtn) tripTypeBtn.classList.remove('active');

          if (cfg.opt1.isTripType) {
            currentTripType = val;
            syncTripTypeToCalendar(val);
          }
        });
      });
    }

    // Update Option 2
    if (cabinClassLabel) cabinClassLabel.textContent = cfg.opt2.label;
    if (cabinClassMenu) {
      cabinClassMenu.innerHTML = cfg.opt2.items.map((item, idx) => `
        <div class="micro-option-item ${item.val === cfg.opt2.defaultVal ? 'active' : ''}" data-val="${item.val}" role="option">
          ${item.label}
        </div>
      `).join('');

      cabinClassMenu.querySelectorAll('.micro-option-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          cabinClassMenu.querySelectorAll('.micro-option-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          const val = item.dataset.val;
          const text = item.textContent.trim();
          if (cabinClassLabel) cabinClassLabel.textContent = text;
          currentCabinClass = val;
          cabinClassMenu.classList.remove('open');
          if (cabinClassBtn) cabinClassBtn.classList.remove('active');
        });
      });
    }
  }

  function setupMicroDropdownToggle(btn, menu) {
    if (!btn || !menu) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');
      closeAllPopovers();
      if (!isOpen) {
        menu.classList.add('open');
        btn.classList.add('active');
      }
    });
  }

  setupMicroDropdownToggle(tripTypeBtn, tripTypeMenu);
  setupMicroDropdownToggle(cabinClassBtn, cabinClassMenu);
  renderSubOptions('holiday');

  const categoryTabs = document.querySelectorAll('.search-mode-tab');
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      categoryTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const mode = tab.dataset.mode;
      activeMode = mode;
      renderSubOptions(mode);

      const originLabel = document.querySelector('#originField .field-label');
      const destLabel = document.querySelector('#destField .field-label');

      if (mode === 'flights') {
        if (originLabel) originLabel.textContent = 'Departure Airport';
        if (destLabel) destLabel.textContent = 'Arrival Airport';
        originInput.placeholder = 'City or Airport (e.g. LHR, VIE)';
        destInput.placeholder = 'City or Airport (e.g. NAP, JFK)';
      } else if (mode === 'stays') {
        if (originLabel) originLabel.textContent = 'Stay Destination';
        if (destLabel) destLabel.textContent = 'Resort or Property';
        originInput.placeholder = 'City, Region or Island';
        destInput.placeholder = 'Villa, Resort, or Hotel Name';
      } else if (mode === 'rail') {
        if (originLabel) originLabel.textContent = 'Departure Station';
        if (destLabel) destLabel.textContent = 'Arrival Station';
        originInput.placeholder = 'Eurostar / Rail Station';
        destInput.placeholder = 'Connecting Station';
      } else if (mode === 'cars') {
        if (originLabel) originLabel.textContent = 'Pick-up Location';
        if (destLabel) destLabel.textContent = 'Drop-off Location';
        originInput.placeholder = 'Airport, City or Rental Hub';
        destInput.placeholder = 'Drop-off Airport or City';
      } else {
        if (originLabel) originLabel.textContent = 'From (Your Door)';
        if (destLabel) destLabel.textContent = 'To (Sun Destination)';
        originInput.placeholder = 'City, Airport or Station';
        destInput.placeholder = 'Where to?';
      }
    });
  });

  function syncTripTypeToCalendar(type) {
    const roundBtn = document.getElementById('calRoundtripBtn');
    const oneBtn = document.getElementById('calOnewayBtn');
    const datesModal = document.getElementById('datesPickerModal');
    const presetsBar = document.querySelector('.calendar-presets-bar');
    
    if (type === 'oneway') {
      if (roundBtn) roundBtn.classList.remove('active');
      if (oneBtn) oneBtn.classList.add('active');
      if (datesModal) datesModal.classList.add('oneway-mode');
      if (presetsBar) presetsBar.classList.add('hidden');
      selectedEnd = null;
      selectingState = 'idle';
      updateDatesInputText();
      renderAllCalendars();
    } else {
      if (roundBtn) roundBtn.classList.add('active');
      if (oneBtn) oneBtn.classList.remove('active');
      if (datesModal) datesModal.classList.remove('oneway-mode');
      if (presetsBar) presetsBar.classList.remove('hidden');
      if (!selectedEnd && selectedStart) {
        selectedEnd = new Date(selectedStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      selectingState = 'idle';
      updateDatesInputText();
      renderAllCalendars();
    }
  }

  // --------------------------------------------------------------------------
  // 6. Interactive Dynamic Real Live-Date Dual-Month Range Calendar
  // --------------------------------------------------------------------------
  const today = new Date();
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let currentCalYear = today.getFullYear();
  let currentCalMonth = today.getMonth();

  let selectedStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let selectedEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  let selectingState = 'idle'; // 'idle', 'picking-end'

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
    if (currentTripType === 'oneway') {
      if (selectedStart) {
        datesInput.value = `${formatDisplayDate(selectedStart)} ${selectedStart.getFullYear()} (One-way)`;
      } else {
        datesInput.value = 'Select Departure Date';
      }
      return;
    }

    if (selectedStart && selectedEnd) {
      datesInput.value = `${formatDisplayDate(selectedStart)} – ${formatDisplayDate(selectedEnd)}`;
    } else if (selectedStart) {
      datesInput.value = `${formatDisplayDate(selectedStart)} – Select Return`;
    } else {
      datesInput.value = 'Select dates';
    }
  }

  function renderCalendarMonth(year, month, gridEl) {
    if (!gridEl) return;
    gridEl.innerHTML = '';
    
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const startOffset = (firstDay + 6) % 7; // Monday 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty lead cells
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
      const inRange = currentTripType !== 'oneway' && selectedStart && selectedEnd && cellDate > selectedStart && cellDate < selectedEnd;

      if (isStart) cell.classList.add('range-start');
      if (isEnd) cell.classList.add('range-end');
      if (inRange) cell.classList.add('in-range');

      if (!isPast) {
        cell.addEventListener('click', (e) => {
          e.stopPropagation();

          if (currentTripType === 'oneway') {
            selectedStart = cellDate;
            selectedEnd = null;
            selectingState = 'idle';
            updateDatesInputText();
            renderAllCalendars();
            return;
          }

          // Roundtrip logic
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

        cell.addEventListener('mouseenter', () => {
          if (currentTripType !== 'oneway' && selectingState === 'picking-end' && selectedStart && !selectedEnd) {
            highlightHoverRange(cellDate);
          }
        });
      }

      gridEl.appendChild(cell);
    }
  }

  function highlightHoverRange(hoverDate) {
    document.querySelectorAll('.days-grid .day-cell').forEach(c => {
      if (!c.classList.contains('disabled') && !c.classList.contains('range-start')) {
        c.classList.remove('in-range');
      }
    });
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

  // Dynamic Navigation Arrow Buttons (< and >) placed at bottom of calendar
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

  // Calendar Header Trip Type Buttons
  const calRoundtripBtn = document.getElementById('calRoundtripBtn');
  const calOnewayBtn = document.getElementById('calOnewayBtn');

  if (calRoundtripBtn) {
    calRoundtripBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentTripType = 'roundtrip';
      if (tripTypeLabel) tripTypeLabel.textContent = 'Roundtrip';
      syncTripTypeToCalendar('roundtrip');
    });
  }

  if (calOnewayBtn) {
    calOnewayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentTripType = 'oneway';
      if (tripTypeLabel) tripTypeLabel.textContent = 'One-way';
      syncTripTypeToCalendar('oneway');
    });
  }

  // Presets Bar Handlers
  const presetBtns = document.querySelectorAll('.preset-pill-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (currentTripType === 'oneway') {
        currentTripType = 'roundtrip';
        syncTripTypeToCalendar('roundtrip');
      }

      const preset = btn.dataset.preset;
      currentCalYear = today.getFullYear();
      currentCalMonth = today.getMonth();

      if (preset === '1week') {
        selectedStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        selectedEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
      } else if (preset === 'weekend') {
        selectedStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        selectedEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);
      } else if (preset === '2weeks') {
        selectedStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        selectedEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14);
      }
      selectingState = 'idle';
      updateDatesInputText();
      renderAllCalendars();
    });
  });

  // Flexible Dates Checkbox
  const flexCheck = document.getElementById('flexibleDatesCheck');
  if (flexCheck) {
    flexCheck.addEventListener('change', (e) => {
      isFlexibleDates = e.target.checked;
    });
  }

  // Calendar Footer Buttons
  const clearDatesBtn = document.getElementById('clearDatesBtn');
  const applyDatesBtn = document.getElementById('applyDatesBtn');

  if (clearDatesBtn) {
    clearDatesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedStart = null;
      selectedEnd = null;
      datesInput.value = '';
      selectingState = 'idle';
      renderAllCalendars();
    });
  }

  if (applyDatesBtn) {
    applyDatesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateDatesInputText();
      closeAllPopovers();
      openPopover(travelersModal, guestsInput.closest('.search-field'));
    });
  }

  datesInput.addEventListener('click', (e) => {
    e.stopPropagation();
    openPopover(datesModal, datesInput.closest('.search-field'));
  });

  // --------------------------------------------------------------------------
  // 7. Travelers & Rooms Counter Steppers
  // --------------------------------------------------------------------------
  let adults = 2;
  let children = 0;
  let rooms = 1;

  function updateTravelersSummary() {
    let summary = `${adults} Adult${adults > 1 ? 's' : ''}`;
    if (children > 0) {
      summary += `, ${children} Child${children > 1 ? 'ren' : ''}`;
    }
    summary += `, ${rooms} Room${rooms > 1 ? 's' : ''}`;
    guestsInput.value = summary;

    // Update Counter Displays
    const adultsEl = document.getElementById('adultsVal');
    const childrenEl = document.getElementById('childrenVal');
    const roomsEl = document.getElementById('roomsVal');

    if (adultsEl) adultsEl.textContent = adults;
    if (childrenEl) childrenEl.textContent = children;
    if (roomsEl) roomsEl.textContent = rooms;

    // Update Minus Button Disabled States
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
  setupStepper('roomsPlus', 'roomsMinus', () => rooms, (v) => { rooms = v; }, 1, 5);

  const applyTravelersBtn = document.getElementById('applyTravelersBtn');
  if (applyTravelersBtn) {
    applyTravelersBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllPopovers();
    });
  }

  guestsInput.addEventListener('click', (e) => {
    e.stopPropagation();
    openPopover(travelersModal, guestsInput.closest('.search-field'));
  });

  // --------------------------------------------------------------------------
  // 8. Mobile Modal Close, Back & Apply Handlers
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
      closeAllPopovers();
    });
  }

  // --------------------------------------------------------------------------
  // 9. Global Outside-Click & Escape Key Dismissal
  // --------------------------------------------------------------------------
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
  // 10. Search CTA Submit & Luxury Loading Transition Controller
  // --------------------------------------------------------------------------
  function triggerSearchTransition() {
    closeAllPopovers();

    const origin = originInput ? originInput.value.trim() : 'Linz (LNZ)';
    const dest = destInput ? destInput.value.trim() : 'Thessaloniki (SKG)';
    
    // Format dates ISO
    const departISO = selectedStart ? TripMuraIATA.formatDateISO(selectedStart) : TripMuraIATA.formatDateISO(new Date(), 0);
    const returnISO = selectedEnd ? TripMuraIATA.formatDateISO(selectedEnd) : (currentTripType === 'oneway' ? '' : TripMuraIATA.formatDateISO(new Date(), 7));

    const adultsVal = document.getElementById('adultsVal');
    const childrenVal = document.getElementById('childrenVal');
    const roomsVal = document.getElementById('roomsVal');
    const directCheck = document.getElementById('directRoutesOnly');

    const adults = adultsVal ? parseInt(adultsVal.textContent, 10) || 2 : 2;
    const children = childrenVal ? parseInt(childrenVal.textContent, 10) || 0 : 0;
    const rooms = roomsVal ? parseInt(roomsVal.textContent, 10) || 1 : 1;
    const direct = directCheck && directCheck.checked ? 1 : 0;

    const overlay = document.getElementById('searchTransitionOverlay');

    function navigateToResults() {
      const params = new URLSearchParams({
        from: origin,
        to: dest,
        depart: departISO,
        return: returnISO,
        travelers: adults,
        children: children,
        rooms: rooms,
        cabin: currentCabinClass || 'economy',
        direct: direct
      });
      window.location.href = `results.html?${params.toString()}`;
    }

    if (!overlay) {
      navigateToResults();
      return;
    }

    const counterVal = document.getElementById('searchCounterVal');
    const progressFill = document.getElementById('searchProgressFill');
    const statusMsg = document.getElementById('searchStatusMsg');
    const arcActive = overlay.querySelector('.search-arc-active');
    const jetGroup = overlay.querySelector('.search-jet-group');
    const providerPills = overlay.querySelectorAll('.search-provider-pill');

    overlay.classList.add('active');
    document.body.classList.add('search-modal-open');

    // Dynamic rotating status messages every ~400ms
    const messages = [
      { text: "Scanning direct routes on Austrian Airlines & Lufthansa...", provider: "austrian" },
      { text: "Finding lowest direct room rates on Booking.com & Airbnb...", provider: "booking" },
      { text: "Checking real-time tickets on ÖBB Ticket Shop & Deutsche Bahn...", provider: "oebb" },
      { text: "Comparing low-cost direct flights on Ryanair & easyJet...", provider: "ryanair" },
      { text: "Synthesizing door-to-door direct carrier itineraries...", provider: "lufthansa" }
    ];

    let totalArcLength = 280;
    if (arcActive && arcActive.getTotalLength) {
      try {
        totalArcLength = arcActive.getTotalLength();
        arcActive.style.strokeDasharray = `${totalArcLength} ${totalArcLength}`;
        arcActive.style.strokeDashoffset = `${totalArcLength}`;
      } catch (e) {
        totalArcLength = 280;
      }
    }

    const SEARCH_DURATION = 2000; // 2.0s calibrated authentic live search feel
    let startTimestamp = null;
    let lastMsgIndex = -1;

    function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function step(timestamp) {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const linearProgress = Math.min(elapsed / SEARCH_DURATION, 1);
      const eased = easeInOut(linearProgress);

      const pct = Math.min(Math.round(eased * 100), 100);
      if (counterVal) counterVal.textContent = `${pct}%`;
      if (progressFill) progressFill.style.width = `${pct}%`;

      if (arcActive) {
        arcActive.style.strokeDashoffset = totalArcLength * (1 - eased);
      }

      if (jetGroup && arcActive && arcActive.getPointAtLength) {
        try {
          const currentDistance = totalArcLength * eased;
          const point = arcActive.getPointAtLength(currentDistance);
          const p1 = arcActive.getPointAtLength(Math.max(currentDistance - 2, 0));
          const p2 = arcActive.getPointAtLength(Math.min(currentDistance + 2, totalArcLength));
          const angleDeg = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
          jetGroup.style.transform = `translate(${point.x - 12}px, ${point.y - 12}px) rotate(${angleDeg}deg)`;
        } catch (e) {}
      }

      // Rotate status message every ~400ms
      const currentMsgIndex = Math.min(Math.floor((elapsed / SEARCH_DURATION) * messages.length), messages.length - 1);
      if (currentMsgIndex !== lastMsgIndex) {
        lastMsgIndex = currentMsgIndex;
        if (statusMsg) {
          statusMsg.classList.add('fading');
          setTimeout(() => {
            statusMsg.textContent = messages[currentMsgIndex].text;
            statusMsg.classList.remove('fading');
          }, 120);
        }

        // Highlight corresponding provider pill
        const activeProv = messages[currentMsgIndex].provider;
        providerPills.forEach(p => {
          if (p.dataset.provider === activeProv || (activeProv === 'booking' && p.dataset.provider === 'airbnb')) {
            p.classList.add('active-pulse');
          } else {
            p.classList.remove('active-pulse');
          }
        });
      }

      if (linearProgress < 1) {
        requestAnimationFrame(step);
      } else {
        setTimeout(navigateToResults, 200);
      }
    }

    requestAnimationFrame(step);
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      triggerSearchTransition();
    });
  }

  if (searchCta) {
    searchCta.addEventListener('click', (e) => {
      e.preventDefault();
      triggerSearchTransition();
    });
  }

  // Expose search trigger globally
  window.tripmuraTriggerSearch = triggerSearchTransition;
}

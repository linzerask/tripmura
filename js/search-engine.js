/**
 * TripMura Design System — Search Engine Interactive Controller
 * Locations Autosuggest, 2-Month Calendar Range Picker, Travelers Stepper & Mobile Sheet Modals
 */

document.addEventListener('DOMContentLoaded', () => {
  initSearchEngine();
});

function initSearchEngine() {
  // Elements
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

  // 1. Data Source for Multimodal Locations
  const locationHubs = [
    { name: 'London St Pancras', sub: 'Eurostar Main Terminal', icon: '🚆', tag: 'High-Speed Rail' },
    { name: 'London Heathrow (LHR)', sub: 'Terminals 2, 3, 5 Connections', icon: '✈️', tag: 'Direct Flight' },
    { name: 'Amalfi Coast, Italy', sub: 'Positano & Amalfi Pier', icon: '📍', tag: 'Scenic Destination' },
    { name: 'Naples Central Station', sub: 'Frecciarossa & Italo Hub', icon: '🚆', tag: 'Fast Rail' },
    { name: 'Naples Airport (NAP)', sub: 'Capodichino International', icon: '✈️', tag: 'Airport' },
    { name: 'Capri Island Marina', sub: 'Marina Grande Hydrofoil Port', icon: '⛵', tag: 'Ferry Link' },
    { name: 'Lake Como, Bellagio Villa', sub: 'Lake Como Ferry & Luxury Villas', icon: '📍', tag: 'Boutique Stay' },
    { name: 'Zurich Hauptbahnhof', sub: 'SBB Swiss Rail Hub', icon: '🚆', tag: 'Scenic Rail' }
  ];

  // Helper: Close all popovers
  function closeAllPopovers() {
    allPopovers.forEach(p => p.classList.remove('open'));
    allFields.forEach(f => f.classList.remove('active'));
    if (backdrop) backdrop.classList.remove('open');
  }

  // Helper: Open specific popover
  function openPopover(popover, fieldWrap) {
    closeAllPopovers();
    if (popover) {
      popover.classList.add('open');
      if (backdrop && window.innerWidth <= 640) {
        backdrop.classList.add('open');
      }
    }
    if (fieldWrap) {
      fieldWrap.classList.add('active');
    }
  }

  // 2. Populate Location Lists
  function renderLocationList(container, inputEl, nextOpenFn) {
    if (!container) return;
    const listEl = container.querySelector('.location-list');
    if (!listEl) return;

    function render(items) {
      listEl.innerHTML = '';
      if (items.length === 0) {
        listEl.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No multimodal hubs found</div>';
        return;
      }
      items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'location-item';
        row.innerHTML = `
          <div class="location-main">
            <span class="location-icon">${item.icon}</span>
            <div class="location-text">
              <span class="location-name">${item.name}</span>
              <span class="location-sub">${item.sub}</span>
            </div>
          </div>
          <span class="location-tag">${item.tag}</span>
        `;
        row.addEventListener('click', (e) => {
          e.stopPropagation();
          inputEl.value = item.name;
          closeAllPopovers();
          if (nextOpenFn) nextOpenFn();
        });
        listEl.appendChild(row);
      });
    }

    render(locationHubs);

    // Live filter on typing
    inputEl.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        render(locationHubs);
        return;
      }
      const filtered = locationHubs.filter(h => 
        h.name.toLowerCase().includes(q) || 
        h.sub.toLowerCase().includes(q) || 
        h.tag.toLowerCase().includes(q)
      );
      render(filtered);
      openPopover(container, inputEl.closest('.search-field'));
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

  // Attach field click events
  originInput.addEventListener('click', (e) => {
    e.stopPropagation();
    openPopover(originPopover, originInput.closest('.search-field'));
  });

  destInput.addEventListener('click', (e) => {
    e.stopPropagation();
    openPopover(destPopover, destInput.closest('.search-field'));
  });

  datesInput.addEventListener('click', (e) => {
    e.stopPropagation();
    openPopover(datesModal, datesInput.closest('.search-field'));
  });

  guestsInput.addEventListener('click', (e) => {
    e.stopPropagation();
    openPopover(travelersModal, guestsInput.closest('.search-field'));
  });

  // 3. Calendar Range Picker (June & July 2026)
  let selectedStart = new Date(2026, 5, 12); // Jun 12, 2026
  let selectedEnd = new Date(2026, 5, 19);   // Jun 19, 2026
  let selectingState = 'idle'; // 'idle', 'picking-end'

  function formatDisplayDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }

  function updateDatesInputText() {
    if (selectedStart && selectedEnd) {
      datesInput.value = `${formatDisplayDate(selectedStart)} – ${formatDisplayDate(selectedEnd)}`;
    } else if (selectedStart) {
      datesInput.value = `${formatDisplayDate(selectedStart)} – Select Return`;
    }
  }

  function renderCalendarMonth(year, month, gridEl) {
    if (!gridEl) return;
    gridEl.innerHTML = '';
    
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Adjust so 0 is Monday
    const startOffset = (firstDay + 6) % 7;
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

      const isStart = selectedStart && cellDate.getTime() === selectedStart.getTime();
      const isEnd = selectedEnd && cellDate.getTime() === selectedEnd.getTime();
      const inRange = selectedStart && selectedEnd && cellDate > selectedStart && cellDate < selectedEnd;

      if (isStart) cell.classList.add('range-start');
      if (isEnd) cell.classList.add('range-end');
      if (inRange) cell.classList.add('in-range');

      cell.addEventListener('click', (e) => {
        e.stopPropagation();
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
        if (selectingState === 'picking-end' && selectedStart && !selectedEnd) {
          highlightHoverRange(cellDate);
        }
      });

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
    const juneGrid = document.getElementById('june2026Grid');
    const julyGrid = document.getElementById('july2026Grid');
    renderCalendarMonth(2026, 5, juneGrid); // June is 5
    renderCalendarMonth(2026, 6, julyGrid); // July is 6
  }

  renderAllCalendars();

  // Presets Bar Handlers
  const presetBtns = document.querySelectorAll('.preset-pill-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const preset = btn.dataset.preset;
      if (preset === '1week') {
        selectedStart = new Date(2026, 5, 12);
        selectedEnd = new Date(2026, 5, 19);
      } else if (preset === 'weekend') {
        selectedStart = new Date(2026, 5, 18);
        selectedEnd = new Date(2026, 5, 21);
      } else if (preset === '2weeks') {
        selectedStart = new Date(2026, 5, 12);
        selectedEnd = new Date(2026, 5, 26);
      }
      selectingState = 'idle';
      updateDatesInputText();
      renderAllCalendars();
    });
  });

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

  // 4. Travelers & Rooms Counter Steppers
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

  // 5. Global Dismiss Listeners
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-field-wrap') && !e.target.closest('.search-popover')) {
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

  // 6. Search Submit Button Loading Micro-Animation
  if (searchForm && searchCta) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      closeAllPopovers();

      searchCta.classList.add('loading');
      setTimeout(() => {
        searchCta.classList.remove('loading');
      }, 1600);
    });
  }
}

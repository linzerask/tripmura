/**
 * TripMura Design System — 60FPS Flight Preloader Controller
 * Calibrated 2200ms (2.2s) cinematic requestAnimationFrame flight trajectory with ease-in-out curve
 */

(function initTripMuraPreloader() {
  const DURATION = 2200; // 2.2 seconds cinematic pacing
  const COMPLETION_HOLD_MS = 250; // 250ms hold at 100% so users enjoy completed takeoff

  // Smooth Ease-In-Out Curve (Quadratic) for natural cinematic pacing
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  let currentAnimFrame = null;
  let holdTimer = null;
  let exitTimer = null;

  function runPreloader() {
    const preloader = document.getElementById('sitePreloader');
    if (!preloader) return;

    if (currentAnimFrame) {
      cancelAnimationFrame(currentAnimFrame);
      currentAnimFrame = null;
    }
    if (holdTimer) clearTimeout(holdTimer);
    if (exitTimer) clearTimeout(exitTimer);

    const counterEl = preloader.querySelector('.preloader-counter');
    const activePath = preloader.querySelector('.flight-path-active');
    const jetGroup = preloader.querySelector('.flight-jet-group');
    const bgPath = preloader.querySelector('.flight-path-bg');

    // Check if path is available
    let totalPathLength = 280;
    if (activePath && activePath.getTotalLength) {
      try {
        totalPathLength = activePath.getTotalLength();
        activePath.style.strokeDasharray = `${totalPathLength} ${totalPathLength}`;
        activePath.style.strokeDashoffset = `${totalPathLength}`;
      } catch (e) {
        totalPathLength = 280;
      }
    }

    // Check session storage (allow forced run with ?preloader=true or ?fresh=1)
    const urlParams = new URLSearchParams(window.location.search);
    const forceRun = urlParams.has('preloader') || urlParams.has('fresh') || urlParams.has('reload');
    const alreadyVisited = sessionStorage.getItem('tripmura_visited');

    if (alreadyVisited && !forceRun) {
      // Instant skip for fast subsequent internal page navigations
      document.body.classList.add('preloader-done');
      preloader.classList.add('loaded');
      setTimeout(() => {
        if (preloader.parentNode) preloader.style.display = 'none';
      }, 300);
      return;
    }

    let startTime = null;
    let isCompleted = false;

    function animate(currentTime) {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const linearProgress = Math.min(elapsed / DURATION, 1);
      const easedProgress = easeInOut(linearProgress);

      // 1. Update Percentage Number (0% -> 100%)
      const currentPct = Math.min(Math.round(easedProgress * 100), 100);
      if (counterEl) {
        counterEl.textContent = `${currentPct}%`;
      }

      // 2. Update Vector Flight Trail
      if (activePath) {
        const offset = totalPathLength * (1 - easedProgress);
        activePath.style.strokeDashoffset = offset;
      }

      // 3. Update 2D Airplane Along Arc with tangent pitch angle
      if (jetGroup && activePath && activePath.getPointAtLength) {
        try {
          const currentDistance = totalPathLength * easedProgress;
          const point = activePath.getPointAtLength(currentDistance);
          
          const lookAhead = Math.min(currentDistance + 2, totalPathLength);
          const lookBehind = Math.max(currentDistance - 2, 0);
          const p1 = activePath.getPointAtLength(lookBehind);
          const p2 = activePath.getPointAtLength(lookAhead);
          
          const angleRad = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          const angleDeg = (angleRad * 180) / Math.PI;

          jetGroup.style.transform = `translate(${point.x - 12}px, ${point.y - 12}px) rotate(${angleDeg}deg)`;
        } catch (err) {
          // Fallback static position if SVG throws
        }
      }

      // 4. Check completion
      if (linearProgress < 1) {
        currentAnimFrame = requestAnimationFrame(animate);
      } else if (!isCompleted) {
        isCompleted = true;
        // Lock to 100%
        if (counterEl) counterEl.textContent = '100%';
        if (activePath) activePath.style.strokeDashoffset = '0';
        
        // Hold for 250ms at 100% so users see completed takeoff before dissolving
        holdTimer = setTimeout(() => {
          finishPreloader(preloader);
        }, COMPLETION_HOLD_MS);
      }
    }

    function finishPreloader(loader) {
      sessionStorage.setItem('tripmura_visited', 'true');
      document.body.classList.add('preloader-done');
      loader.classList.add('loaded');

      // Clean up after exit transition completes
      exitTimer = setTimeout(() => {
        loader.style.display = 'none';
      }, 700);
    }

    // Start 60FPS animation loop
    currentAnimFrame = requestAnimationFrame(animate);
  }

  // Expose restart helper for automated testing and QA
  window.restartPreloader = function() {
    const preloader = document.getElementById('sitePreloader');
    if (!preloader) return;
    preloader.style.display = 'flex';
    preloader.classList.remove('loaded');
    document.body.classList.remove('preloader-done');
    sessionStorage.removeItem('tripmura_visited');
    runPreloader();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runPreloader);
  } else {
    runPreloader();
  }
})();

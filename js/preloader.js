/**
 * TripMura Design System — 60FPS Flight Preloader Controller
 * High-performance 1400ms requestAnimationFrame engine with 2D vector arc tracing
 */

(function initTripMuraPreloader() {
  const PRELOADER_DURATION = 1400; // 1.4 seconds

  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  function runPreloader() {
    const preloader = document.getElementById('sitePreloader');
    if (!preloader) return;

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
        // Fallback default length
        totalPathLength = 280;
      }
    }

    // Check session storage (allow forced run with ?preloader=true or ?fresh=1)
    const urlParams = new URLSearchParams(window.location.search);
    const forceRun = urlParams.has('preloader') || urlParams.has('fresh') || urlParams.has('reload');
    const alreadyVisited = sessionStorage.getItem('tripmura_visited');

    if (alreadyVisited && !forceRun) {
      // Instant skip for fast return navigations
      document.body.classList.add('preloader-done');
      preloader.classList.add('loaded');
      setTimeout(() => {
        if (preloader.parentNode) preloader.style.display = 'none';
      }, 300);
      return;
    }

    let startTime = null;

    function animate(currentTime) {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const linearProgress = Math.min(elapsed / PRELOADER_DURATION, 1);
      const easedProgress = easeOutCubic(linearProgress);

      // 1. Update Percentage Number
      const currentPct = Math.round(easedProgress * 100);
      if (counterEl) {
        counterEl.textContent = `${currentPct}%`;
      }

      // 2. Update Vector Flight Trail
      if (activePath) {
        const offset = totalPathLength * (1 - easedProgress);
        activePath.style.strokeDashoffset = offset;
      }

      // 3. Update 2D Airplane Along Arc
      if (jetGroup && activePath && activePath.getPointAtLength) {
        try {
          const currentDistance = totalPathLength * easedProgress;
          const point = activePath.getPointAtLength(currentDistance);
          
          // Calculate heading angle
          const lookAhead = Math.min(currentDistance + 2, totalPathLength);
          const lookBehind = Math.max(currentDistance - 2, 0);
          const p1 = activePath.getPointAtLength(lookBehind);
          const p2 = activePath.getPointAtLength(lookAhead);
          
          const angleRad = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          const angleDeg = (angleRad * 180) / Math.PI;

          // Offset jet center (width 24, height 24)
          jetGroup.style.transform = `translate(${point.x - 12}px, ${point.y - 12}px) rotate(${angleDeg}deg)`;
        } catch (err) {
          // Fallback static position if SVG calculation throws
        }
      }

      // 4. Check completion
      if (linearProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        finishPreloader(preloader);
      }
    }

    function finishPreloader(loader) {
      // Complete state
      sessionStorage.setItem('tripmura_visited', 'true');
      document.body.classList.add('preloader-done');
      loader.classList.add('loaded');

      // Clean up after exit transition completes
      setTimeout(() => {
        loader.style.display = 'none';
      }, 700);
    }

    // Start 60FPS animation loop
    requestAnimationFrame(animate);
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

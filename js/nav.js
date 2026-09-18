/**
 * TripMura — Global Navigation & Mobile Drawer Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const backdrop = document.querySelector('.mobile-drawer-backdrop');
  const closeBtn = document.querySelector('.drawer-close-btn');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  // 1. Navbar Scroll Elevation
  const handleScroll = () => {
    if (window.scrollY > 20) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // 2. Mobile Drawer Controls
  const openDrawer = () => {
    if (!drawer || !backdrop) return;
    drawer.classList.add('active');
    backdrop.classList.add('active');
    toggleBtn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  };

  const closeDrawer = () => {
    if (!drawer || !backdrop) return;
    drawer.classList.remove('active');
    backdrop.classList.remove('active');
    toggleBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  toggleBtn?.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  closeBtn?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);

  // Close drawer on link click
  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // ESC key listener for accessibility
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer?.classList.contains('active')) {
      closeDrawer();
      toggleBtn?.focus();
    }
  });
});

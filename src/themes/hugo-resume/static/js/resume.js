(function () {
  'use strict';

  function init() {
    // Smooth scroll to in-page anchors
    document.querySelectorAll('a.js-scroll-trigger[href*="#"]:not([href="#"])').forEach((link) => {
      link.addEventListener('click', function (e) {
        if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') &&
            location.hostname === this.hostname) {
          const target = document.querySelector(this.hash) ||
                          document.querySelector('[name="' + this.hash.slice(1) + '"]');
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    // Close the responsive navbar after a link is clicked
    document.querySelectorAll('.js-scroll-trigger').forEach((link) => {
      link.addEventListener('click', () => {
        const openNav = document.querySelector('.navbar-collapse.show');
        if (openNav) {
          bootstrap.Collapse.getOrCreateInstance(openNav).hide();
        }
      });
    });

    // Highlight nav items while scrolling
    if (document.querySelector('#sideNav')) {
      new bootstrap.ScrollSpy(document.body, { target: '#sideNav' });
    }

    // Enable Bootstrap tooltips
    document.querySelectorAll('[data-toggle="tooltip"]').forEach((el) => {
      new bootstrap.Tooltip(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/*!
 * Start Bootstrap - Resume v6.0.1 (https://startbootstrap.com/template-overviews/resume)
 * Copyright 2013-2020 Start Bootstrap
 * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-resume/blob/master/LICENSE)
 */

// Smooth scrolling using native JavaScript
document
  .querySelectorAll('a.js-scroll-trigger[href*="#"]:not([href="#"])')
  .forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.hash;
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        const headerOffset = 50; // Adjust this value as needed
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });

        // Close responsive menu after click
        const navbarCollapse = document.querySelector(".navbar-collapse");
        if (navbarCollapse && navbarCollapse.classList.contains("show")) {
          const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
            toggle: false,
          });
          bsCollapse.hide();
        }
      }
    });
  });

// Function to copy bibtex to clipboard
(function () {
  window.copyToClipboard = function (elementId) {
    const textToCopy = document.querySelector(elementId).textContent;
    navigator.clipboard.writeText(textToCopy).then(
      function () {
        console.log("Bibtex copied to clipboard");
      },
      function (err) {
        console.error("Could not copy text: ", err);
      },
    );
  };
})();

// Activate scrollspy to add active class to navbar items on scroll
const scrollSpy = new bootstrap.ScrollSpy(document.body, {
  target: "#mainNav",
  offset: 74,
});

// Collapse Navbar
(function () {
  const navbarCollapse = function () {
    const navbar = document.body.querySelector("#mainNav");
    if (!navbar) {
      return;
    }
    if (window.scrollY === 0) {
      navbar.classList.remove("navbar-shrink");
    } else {
      navbar.classList.add("navbar-shrink");
    }
  };

  // Collapse now if page is not at top
  navbarCollapse();
  // Collapse the navbar when page is scrolled
  document.addEventListener("scroll", navbarCollapse);
})();

// Google Analytics event tracking for publication links
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".publication-link").forEach((link) => {
    link.addEventListener("click", function () {
      if (typeof gtag === "function") {
        gtag("event", "publication_click", {
          event_category: "Publications",
          event_label: this.href,
        });
      }
    });
  });
});


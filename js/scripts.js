// Smooth scrolling for navigation links
document
  .querySelectorAll('a.js-scroll-trigger[href*="#"]:not([href="#"])')
  .forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.hash;
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        // Adjust header offset for smooth scrolling
        const headerOffset = 50;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        // Scroll to the target element with smooth behavior
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });

        // Collapse responsive navbar after clicking a link
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

// Function to copy bibtex content to clipboard
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

// Activate scrollspy for navigation highlighting
const scrollSpy = new bootstrap.ScrollSpy(document.body, {
  target: "#mainNav",
  offset: 74,
});

// Collapse navbar on scroll
(function () {
  const navbarCollapse = function () {
    const navbar = document.body.querySelector("#mainNav");
    if (!navbar) {
      return;
    }
    // Add or remove 'navbar-shrink' class based on scroll position
    if (window.scrollY === 0) {
      navbar.classList.remove("navbar-shrink");
    } else {
      navbar.classList.add("navbar-shrink");
    }
  };

  // Collapse the navbar immediately if not at the top of the page
  navbarCollapse();
  // Add event listener for collapsing navbar on scroll
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
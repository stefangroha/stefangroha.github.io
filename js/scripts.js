document
  .querySelectorAll('a.js-scroll-trigger[href*="#"]:not([href="#"])')
  .forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.hash;
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        const headerOffset = 50;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });

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

const scrollSpy = new bootstrap.ScrollSpy(document.body, {
  target: "#mainNav",
  offset: 74,
});

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

  navbarCollapse();
  document.addEventListener("scroll", navbarCollapse);
})();

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


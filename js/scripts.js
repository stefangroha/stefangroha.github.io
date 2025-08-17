/*!
    * Start Bootstrap - Resume v6.0.1 (https://startbootstrap.com/template-overviews/resume)
    * Copyright 2013-2020 Start Bootstrap
    * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-resume/blob/master/LICENSE)
    */

// Smooth scrolling using native JavaScript
document.querySelectorAll('a.js-scroll-trigger[href*="#"]:not([href="#"])').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.hash;
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });

            // Close responsive menu after click
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });
                bsCollapse.hide();
            }
        }
    });
});

// Function to copy bibtex to clipboard
function copyToClipboard(elementId) {
    const textToCopy = document.querySelector(elementId).textContent;
    navigator.clipboard.writeText(textToCopy).then(function() {
        console.log('Bibtex copied to clipboard');
    }, function(err) {
        console.error('Could not copy text: ', err);
    });
}

// Activate scrollspy to add active class to navbar items on scroll
const scrollSpy = new bootstrap.ScrollSpy(document.body, {
    target: '#mainNav',
    offset: 74
});

// Collapse Navbar
const navbarCollapse = function () {
    const navbar = document.body.querySelector('#mainNav');
    if (!navbar) {
        return;
    }
    if (window.scrollY === 0) {
        navbar.classList.remove('navbar-shrink')
    } else {
        navbar.classList.add('navbar-shrink')
    }

};

// Collapse now if page is not at top
navbarCollapse();
// Collapse the navbar when page is scrolled
document.addEventListener('scroll', navbarCollapse);

// Google Analytics event tracking for publication links
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.publication-link').forEach(link => {
        link.addEventListener('click', function() {
            gtag('event', 'publication_click', {
                'event_category': 'Publications',
                'event_label': this.href
            });
        });
    });
});



// Back to top button functionality (if you decide to add one)
// window.addEventListener('scroll', function() {
//     const backToTopButton = document.getElementById('back-to-top');
//     if (backToTopButton) {
//         if (window.pageYOffset > 100) { // Show button after scrolling down 100px
//             backToTopButton.classList.add('show');
//         } else {
//             backToTopButton.classList.remove('show');
//         }d
//     }
// });

// document.getElementById('back-to-top').addEventListener('click', function(e) {
//     e.preventDefault();
//     window.scrollTo({ top: 0, behavior: 'smooth' });
// });
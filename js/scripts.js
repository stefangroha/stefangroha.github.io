// Modern ES6+ JavaScript for Stefan Groha's Website

// Smooth scrolling with modern navigation
document.addEventListener('DOMContentLoaded', () => {
  const smoothScrollLinks = document.querySelectorAll('a.js-scroll-trigger[href*="#"]:not([href="#"])');
  
  smoothScrollLinks.forEach(anchor => {
    anchor.addEventListener('click', handleSmoothScroll);
  });

  // Initialize all features
  initializeScrollSpy();
  initializeNavbarBehavior();
  initializeAnalytics();
  initializeKeyboardAccessibility();
});

// Smooth scroll handler
const handleSmoothScroll = (e) => {
  e.preventDefault();
  
  const targetId = e.currentTarget.hash;
  const targetElement = document.querySelector(targetId);
  
  if (!targetElement) return;
  
  const navbar = document.querySelector('.navbar');
  const headerOffset = navbar?.offsetHeight + 20 || 70;
  const elementPosition = targetElement.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
  // Modern smooth scroll with fallback
  try {
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  } catch {
    window.scrollTo(0, offsetPosition);
  }
  
  // Collapse navbar on mobile
  const navbarCollapse = document.querySelector('.navbar-collapse');
  if (navbarCollapse?.classList.contains('show')) {
    try {
      new bootstrap.Collapse(navbarCollapse, { toggle: false }).hide();
    } catch {
      navbarCollapse.classList.remove('show');
    }
  }
  
  // Update URL
  history.pushState?.(null, null, targetId);
};

// Enhanced clipboard functionality
const copyToClipboard = async (elementId) => {
  const element = document.querySelector(elementId);
  if (!element) {
    console.error('Element not found:', elementId);
    return;
  }
  
  const text = element.textContent;
  
  try {
    await navigator.clipboard.writeText(text);
    showToast('BibTeX copied to clipboard!', 'success');
  } catch {
    fallbackCopy(text);
  }
};

// Fallback copy for older browsers
const fallbackCopy = (text) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
  document.body.appendChild(textArea);
  textArea.select();
  
  try {
    const success = document.execCommand('copy');
    showToast(
      success ? 'BibTeX copied to clipboard!' : 'Copy failed. Please select manually.',
      success ? 'success' : 'error'
    );
  } catch {
    showToast('Copy failed. Please select manually.', 'error');
  } finally {
    document.body.removeChild(textArea);
  }
};

// Toast notification system
const showToast = (message, type = 'success') => {
  document.querySelector('.copy-toast')?.remove();
  
  const toast = document.createElement('div');
  toast.className = `copy-toast alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed`;
  toast.style.cssText = `
    top: 20px;
    right: 20px;
    z-index: 9999;
    min-width: 200px;
    animation: slideInRight 0.3s ease;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
};

// Initialize ScrollSpy
const initializeScrollSpy = () => {
  try {
    if (typeof bootstrap !== 'undefined' && bootstrap.ScrollSpy) {
      new bootstrap.ScrollSpy(document.body, {
        target: '#mainNav',
        offset: 74,
        smoothScroll: true
      });
    }
  } catch (error) {
    console.warn('ScrollSpy initialization failed:', error);
  }
};

// Enhanced navbar behavior with performance optimization
const initializeNavbarBehavior = () => {
  let ticking = false;
  
  const updateNavbar = () => {
    const navbar = document.querySelector('#mainNav');
    if (!navbar) return;
    
    const scrolled = window.scrollY > 50;
    navbar.classList.toggle('navbar-shrink', scrolled);
    navbar.style.boxShadow = scrolled 
      ? '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)' 
      : 'none';
  };
  
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateNavbar();
        ticking = false;
      });
      ticking = true;
    }
  };
  
  updateNavbar();
  document.addEventListener('scroll', onScroll, { passive: true });
};

// Analytics and performance tracking
const initializeAnalytics = () => {
  // Track publication clicks
  document.querySelectorAll('button[onclick*="window.location"], a[href*="pdf"], a[href*="doi"], a[href*="arxiv"]')
    .forEach(link => {
      link.addEventListener('click', function() {
        const href = this.getAttribute('onclick') || this.href;
        const linkType = ['pdf', 'doi', 'arxiv'].find(type => href.includes(type)) || 'publication';
        
        if (typeof gtag === 'function') {
          gtag('event', 'publication_click', {
            event_category: 'Publications',
            event_label: href,
            link_type: linkType
          });
        }
      });
    });
  
  // Track content interactions
  document.querySelectorAll('[data-bs-toggle="collapse"]').forEach(button => {
    button.addEventListener('click', function() {
      const actionType = this.textContent.toLowerCase().includes('abstract') ? 'Abstract' : 'BibTeX';
      
      if (typeof gtag === 'function') {
        gtag('event', 'content_interaction', {
          event_category: 'Publications',
          event_label: actionType,
          target_id: this.getAttribute('data-bs-target')
        });
      }
    });
  });
  
  // Performance monitoring
  if ('performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        const loadTime = perfData?.loadEventEnd - perfData?.loadEventStart;
        
        if (typeof gtag === 'function' && loadTime > 0) {
          gtag('event', 'page_load_time', {
            event_category: 'Performance',
            value: Math.round(loadTime)
          });
        }
      }, 100);
    });
  }
};

// Removed scroll animations for better performance and user preference

// Keyboard accessibility
const initializeKeyboardAccessibility = () => {
  document.addEventListener('keydown', (e) => {
    // Alt+M to skip to main content
    if (e.altKey && e.key === 'm') {
      e.preventDefault();
      const mainContent = document.querySelector('#main-content');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
};

// Expose copyToClipboard globally for inline onclick handlers
window.copyToClipboard = copyToClipboard;
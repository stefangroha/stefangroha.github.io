/**
 * Post Wrapper for Org-mode HTML Posts
 * Automatically wraps org-exported HTML with blog header/footer
 */

console.log('PostWrapper: Script loaded successfully');

class PostWrapper {
  constructor() {
    this.headerTemplate = '';
    this.footerTemplate = '';
  }

  /**
   * Initialize the post wrapper
   */
  async init() {
    console.log('PostWrapper: Starting initialization');
    try {
      console.log('PostWrapper: Loading templates...');
      await this.loadTemplates();
      console.log('PostWrapper: Templates loaded. Header:', !!this.headerTemplate, 'Footer:', !!this.footerTemplate);
      
      console.log('PostWrapper: Wrapping post...');
      await this.wrapPost();
      console.log('PostWrapper: Post wrapping completed');
    } catch (error) {
      console.error('PostWrapper: Error during initialization:', error);
    }
  }

  /**
   * Load header and footer templates
   */
  async loadTemplates() {
    try {
      console.log('PostWrapper: Fetching header template from ../blog-header.html');
      // Load header template
      const headerResponse = await fetch('../blog-header.html');
      console.log('PostWrapper: Header response status:', headerResponse.status);
      if (headerResponse.ok) {
        this.headerTemplate = await headerResponse.text();
        console.log('PostWrapper: Header template loaded, length:', this.headerTemplate.length);
      } else {
        console.warn('PostWrapper: Could not load header template, using fallback');
        this.headerTemplate = this.getDefaultHeader();
      }

      console.log('PostWrapper: Fetching footer template from ../blog-footer.html');
      // Load footer template
      const footerResponse = await fetch('../blog-footer.html');
      console.log('PostWrapper: Footer response status:', footerResponse.status);
      if (footerResponse.ok) {
        this.footerTemplate = await footerResponse.text();
        console.log('PostWrapper: Footer template loaded, length:', this.footerTemplate.length);
      } else {
        console.warn('PostWrapper: Could not load footer template, using fallback');
        this.footerTemplate = this.getDefaultFooter();
      }
    } catch (error) {
      console.error('PostWrapper: Error loading templates, using fallbacks:', error);
      this.headerTemplate = this.getDefaultHeader();
      this.footerTemplate = this.getDefaultFooter();
    }
  }

  /**
   * Wrap the current page with header and footer
   */
  async wrapPost() {
    console.log('PostWrapper: Starting wrapPost method');
    
    // Only proceed if we have templates and we're in a post
    if (!this.headerTemplate || !this.footerTemplate) {
      console.warn('PostWrapper: Header or footer template not found');
      return;
    }
    console.log('PostWrapper: Templates available');

    // Check if already wrapped
    if (document.querySelector('.navbar') || document.querySelector('nav')) {
      console.log('PostWrapper: Page already appears to be wrapped');
      return;
    }
    console.log('PostWrapper: Page not yet wrapped, proceeding');

    // Get current page info
    const postInfo = this.extractPostInfo();
    console.log('PostWrapper: Post info extracted:', postInfo);
    
    // Replace placeholders in header
    const processedHeader = this.processTemplate(this.headerTemplate, postInfo);
    const processedFooter = this.processTemplate(this.footerTemplate, postInfo);
    console.log('PostWrapper: Templates processed');
    console.log('PostWrapper: Raw footer template length:', this.footerTemplate.length);
    console.log('PostWrapper: Processed footer length:', processedFooter.length);

    // Get current content (just the #content div, not the whole body)
    const contentDiv = document.querySelector('#content, .content');
    const originalContent = contentDiv ? contentDiv.outerHTML : document.body.innerHTML;
    console.log('PostWrapper: Original content extracted, length:', originalContent.length);

    // Add head content without replacing everything
    console.log('PostWrapper: Adding head content');
    this.addHeadContent(this.extractHeadFromTemplate(processedHeader));

    // Create wrapper elements instead of replacing entire body
    console.log('PostWrapper: Creating wrapper elements');
    
    // Hide original content temporarily
    const originalBody = document.body;
    originalBody.style.display = 'none';
    
    // Create new body
    const newBody = document.createElement('body');
    newBody.id = 'page-top';
    
    // Add header navigation
    const headerNav = this.extractBodyFromTemplate(processedHeader);
    console.log('PostWrapper: Header nav content length:', headerNav.length);
    console.log('PostWrapper: Header nav preview:', headerNav.substring(0, 200));
    newBody.innerHTML = headerNav;
    
    // Add main content
    const mainElement = document.createElement('main');
    mainElement.className = 'post-content';
    mainElement.id = 'main-content';
    mainElement.innerHTML = `
      <div class="container py-5">
        <div class="row">
          <div class="col-lg-8 mx-auto">
            <article class="blog-post">
              ${originalContent}
            </article>
          </div>
        </div>
      </div>
    `;
    newBody.appendChild(mainElement);
    
    // Add footer (footer template is just the footer content, not a full HTML page)
    const footerDiv = document.createElement('div');
    console.log('PostWrapper: Footer content length:', processedFooter.length);
    console.log('PostWrapper: Footer preview:', processedFooter.substring(0, 200));
    footerDiv.innerHTML = processedFooter;
    newBody.appendChild(footerDiv);
    
    // Replace the body
    document.documentElement.removeChild(originalBody);
    document.documentElement.appendChild(newBody);
    
    console.log('PostWrapper: Body structure created and replaced');

    // Initialize any required scripts after a small delay to ensure DOM is ready
    console.log('PostWrapper: Scheduling script initialization');
    setTimeout(() => {
      console.log('PostWrapper: Initializing scripts');
      this.initializeScripts();
      console.log('PostWrapper: Scripts initialized');
    }, 100);
  }

  /**
   * Extract post information from current page
   */
  extractPostInfo() {
    const title = document.querySelector('h1, .title')?.textContent || document.title;
    const date = this.extractDateFromContent() || new Date().toISOString().split('T')[0];
    const description = this.extractDescription();

    return {
      title: title,
      date: date,
      description: description,
      url: window.location.href
    };
  }

  /**
   * Extract date from org-mode content
   */
  extractDateFromContent() {
    const dateElement = document.querySelector('.date, .timestamp, [class*="date"]');
    if (dateElement) {
      const dateText = dateElement.textContent.trim();
      const date = new Date(dateText);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    return null;
  }

  /**
   * Extract description from content
   */
  extractDescription() {
    const firstParagraph = document.querySelector('p');
    if (firstParagraph) {
      let text = firstParagraph.textContent.trim();
      return text.length > 160 ? text.substring(0, 160) + '...' : text;
    }
    return '';
  }

  /**
   * Process template with placeholders
   */
  processTemplate(template, postInfo) {
    return template
      .replace(/{{title}}/g, postInfo.title)
      .replace(/{{date}}/g, postInfo.date)
      .replace(/{{description}}/g, postInfo.description)
      .replace(/{{url}}/g, postInfo.url);
  }

  /**
   * Add head content without replacing existing head
   */
  addHeadContent(headContent) {
    // Create a temporary div to parse the head content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = headContent;
    
    // Add each element to the head
    Array.from(tempDiv.children).forEach(element => {
      // Skip if already exists (avoid duplicates)
      const tagName = element.tagName.toLowerCase();
      if (tagName === 'title') {
        document.title = element.textContent;
      } else if (tagName === 'meta') {
        const name = element.getAttribute('name') || element.getAttribute('property');
        if (name && !document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)) {
          document.head.appendChild(element.cloneNode(true));
        }
      } else if (tagName === 'link') {
        const href = element.getAttribute('href');
        if (href && !document.querySelector(`link[href="${href}"]`)) {
          document.head.appendChild(element.cloneNode(true));
        }
      } else if (tagName === 'style') {
        document.head.appendChild(element.cloneNode(true));
      }
    });
  }

  /**
   * Extract head content from template
   */
  extractHeadFromTemplate(template) {
    const headMatch = template.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    return headMatch ? headMatch[1] : '';
  }

  /**
   * Extract body content from template (up to main content area)
   */
  extractBodyFromTemplate(template) {
    // Look for content between <body> and the end of </nav> or up to </body>
    const bodyMatch = template.match(/<body[^>]*>([\s\S]*?)<\/nav>/i);
    if (bodyMatch) {
      return bodyMatch[1] + '</nav>';
    }
    
    // Fallback: everything in body
    const fallbackMatch = template.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return fallbackMatch ? fallbackMatch[1] : '';
  }

  /**
   * Initialize any required scripts after wrapping
   */
  initializeScripts() {
    console.log('PostWrapper: Starting script initialization');
    
    // Simple navbar toggle functionality
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
      console.log('PostWrapper: Setting up navbar toggle');
      navbarToggler.addEventListener('click', () => {
        console.log('PostWrapper: Navbar toggle clicked');
        navbarCollapse.classList.toggle('show');
      });
    }

    // Try to reinitialize Bootstrap if available
    if (window.bootstrap) {
      console.log('PostWrapper: Bootstrap available, initializing components');
      try {
        // Initialize all collapse components (for navbar toggle)
        document.querySelectorAll('[data-bs-toggle="collapse"]').forEach(element => {
          const targetSelector = element.getAttribute('data-bs-target');
          if (targetSelector) {
            new bootstrap.Collapse(targetSelector, { toggle: false });
          }
        });
      } catch (error) {
        console.error('PostWrapper: Error initializing Bootstrap:', error);
      }
    } else {
      console.log('PostWrapper: Bootstrap not available');
    }

    // Add syntax highlighting for code blocks
    this.highlightCode();

    // Setup smooth scrolling
    this.setupSmoothScrolling();
  }

  /**
   * Add syntax highlighting to code blocks
   */
  highlightCode() {
    const codeBlocks = document.querySelectorAll('pre code, .src');
    codeBlocks.forEach(block => {
      if (!block.classList.contains('highlighted')) {
        block.classList.add('language-auto');
        block.classList.add('highlighted');
      }
    });

    // Load Prism.js for syntax highlighting if not already loaded
    if (typeof Prism === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js';
      document.head.appendChild(script);
    }
  }

  /**
   * Setup smooth scrolling for anchor links
   */
  setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth'
          });
        }
      });
    });
  }

  /**
   * Get default header template as fallback
   */
  getDefaultHeader() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <meta name="description" content="{{description}}" />
    <meta name="author" content="Stefan Groha" />
    <title>{{title}} - Stefan Groha</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Custom CSS -->
    <link href="../../css/custom.css" rel="stylesheet" />
    
    <style>
        body { margin: 0; padding: 0; }
        .post-content { padding-top: 100px; }
        .blog-post { line-height: 1.7; }
        .navbar { backdrop-filter: blur(10px); background-color: rgba(255, 255, 255, 0.95) !important; }
        .text-primary { color: #bd5d38 !important; }
    </style>
</head>
<body id="page-top">
    <nav class="navbar navbar-expand-lg navbar-light bg-white fixed-top shadow-sm">
        <div class="container">
            <a class="navbar-brand fw-bold" href="../index.html">Stefan Groha</a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="../index.html#about">About</a>
                <a class="nav-link" href="../index.html#publications">Publications</a>
                <a class="nav-link" href="../index.html#talks">Presentations</a>
                <a class="nav-link" href="../blog.html">Blog</a>
            </div>
        </div>
    </nav>`;
  }

  /**
   * Get default footer template as fallback
   */
  getDefaultFooter() {
    return `
    <footer class="bg-dark py-5">
        <div class="container px-4 px-lg-5">
            <div class="small text-center text-muted">Copyright &copy; 2025 Stefan Groha</div>
        </div>
    </footer>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
  }
}

// Auto-initialize if we're in a post page
document.addEventListener('DOMContentLoaded', () => {
  console.log('PostWrapper: DOM loaded');
  console.log('PostWrapper: Current pathname:', window.location.pathname);
  
  // Check if we're in a post (not the main blog page)
  const isInPosts = window.location.pathname.includes('/posts/');
  const isHtmlFile = window.location.pathname.endsWith('.html');
  const isBlogPage = window.location.pathname.endsWith('blog.html');
  const isIndexPage = window.location.pathname.endsWith('index.html');
  
  console.log('PostWrapper: isInPosts:', isInPosts);
  console.log('PostWrapper: isHtmlFile:', isHtmlFile);
  console.log('PostWrapper: isBlogPage:', isBlogPage);
  console.log('PostWrapper: isIndexPage:', isIndexPage);
  
  if (isInPosts || (isHtmlFile && !isBlogPage && !isIndexPage)) {
    console.log('PostWrapper: Path check passed');
    
    // Only initialize if this is an org-mode post (has #content)
    const contentDiv = document.querySelector('#content, .content');
    console.log('PostWrapper: Content div found:', !!contentDiv);
    
    if (contentDiv) {
      console.log('PostWrapper: Initializing post wrapper for org-mode post');
      const postWrapper = new PostWrapper();
      postWrapper.init().catch(error => {
        console.error('PostWrapper: Error initializing post wrapper:', error);
      });
    } else {
      console.log('PostWrapper: No content div found, not an org-mode post');
    }
  } else {
    console.log('PostWrapper: Not a post page, skipping initialization');
  }
});

// Export for use in other scripts
window.PostWrapper = PostWrapper;
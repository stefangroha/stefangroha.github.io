/**
 * Post Loader for Org-mode HTML Posts
 * Loads org-exported HTML content into the post.html template
 */

class PostLoader {
  constructor() {
    this.postsIndex = [];
  }

  /**
   * Initialize the post loader
   */
  async init() {
    try {
      await this.loadPostsIndex();
      await this.loadPostContent();
      this.initializeScripts();
    } catch (error) {
      console.error('PostLoader: Error during initialization:', error);
      this.displayMessage('Failed to load post. Please try again later.', 'error');
    }
  }

  /**
   * Load the posts-index.json file
   */
  async loadPostsIndex() {
    try {
      const response = await fetch('/blog/posts/posts-index.json');
      if (!response.ok) {
        this.displayMessage('Failed to load blog posts index. Please ensure posts-index.json is generated.', 'error');
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.postsIndex = await response.json();
    } catch (error) {
      this.displayMessage('An error occurred while loading the blog posts index. Please try again later.', 'error');
      console.error('PostLoader: Could not load posts-index.json:', error);
      throw error; // Re-throw to stop initialization if index fails to load
    }
  }

  /**
   * Load and display the specific blog post content
   */
  async loadPostContent() {
    const urlParams = new URLSearchParams(window.location.search);
    const postFilename = urlParams.get('post');
    const postContainer = document.getElementById('post-container');

    if (!postFilename) {
      postContainer.innerHTML = '<p class="text-danger">No post specified.</p>';
      return;
    }

    const postMetadata = this.postsIndex.find(post => post.filename === postFilename);

    if (!postMetadata) {
      postContainer.innerHTML = '<p class="text-danger">Post not found.</p>';
      return;
    }

    try {
      const response = await fetch(`/blog/posts/${postFilename}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const htmlContent = await response.text();
      
      // Extract content from the Org-mode exported HTML. 
      // Org-mode typically wraps the main content in a div with id 'content' or similar.
      // We'll look for the body content or a specific div.
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      let contentToInject = '';
      const contentDiv = doc.querySelector('#content, .content'); // Common Org-mode export div
      if (contentDiv) {
        contentToInject = contentDiv.innerHTML;
      } else {
        // Fallback: take everything from the body if no specific content div is found
        contentToInject = doc.body.innerHTML;
      }

      if (contentToInject) {
        postContainer.innerHTML = contentToInject;
        this.updatePageMetadata(postMetadata);
      } else {
        postContainer.innerHTML = '<p class="text-danger">Could not extract content from the post file.</p>';
      }

    } catch (error) {
      this.displayMessage('Failed to load post content. Please check the filename and try again.', 'error');
      console.error(`PostLoader: Error loading post ${postFilename}:`, error);
    }
  }

  /**
   * Update page title and meta tags based on post metadata
   */
  updatePageMetadata(postMetadata) {
    document.title = `${postMetadata.title} - Stefan Groha`;

    const description = postMetadata.description || 'A blog post by Stefan Groha.';
    const url = window.location.href;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      metaDescription.content = description;
      document.head.appendChild(metaDescription);
    }

    // Update Open Graph and Twitter meta tags
    const ogTags = {
      'og:title': postMetadata.title,
      'og:description': description,
      'og:url': url,
      'twitter:title': postMetadata.title,
      'twitter:description': description,
      'twitter:url': url
    };

    for (const property in ogTags) {
      let metaTag = document.querySelector(`meta[property="${property}"]`);
      if (metaTag) {
        metaTag.setAttribute('content', ogTags[property]);
      } else {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('property', property);
        metaTag.content = ogTags[property];
        document.head.appendChild(metaTag);
      }
    }
  }

  /**
   * Initialize any required scripts after content is loaded
   */
  initializeScripts() {
    // Re-initialize Bootstrap components if needed (e.g., navbar toggler)
    if (window.bootstrap) {
      try {
        document.querySelectorAll('[data-bs-toggle="collapse"]').forEach(element => {
          const targetSelector = element.getAttribute('data-bs-target');
          if (targetSelector) {
            new bootstrap.Collapse(targetSelector, { toggle: false });
          }
        });
      } catch (error) {
        console.error('PostLoader: Error initializing Bootstrap:', error);
      }
    }

    // Syntax highlighting
    this.highlightCode();

    // Smooth scrolling for anchor links
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
    // This check is important to prevent multiple loads
    if (typeof Prism !== 'undefined') {
      Prism.highlightAll();
      console.log('PostLoader: Prism.highlightAll() called.');
    } else {
      console.warn('PostLoader: Prism.js not found. Syntax highlighting may not work.');
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
   * Display a message in the post container
   */
  displayMessage(message, type = 'info') {
    const postContainer = document.getElementById('post-container');
    if (postContainer) {
      postContainer.innerHTML = `<p class="text-${type === 'error' ? 'danger' : 'info'} text-center">${message}</p>`;
    }
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const postLoader = new PostLoader();
  postLoader.init().catch(error => {
    console.error('PostLoader: Unhandled error during initialization:', error);
  });
});

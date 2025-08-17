import { POSTS_DIR, INDEX_FILE } from './config.js';

/**
 * Blog Manager for Org-mode HTML Integration
 * Automatically loads and displays blog posts exported from org-mode
 */

class BlogManager {
  constructor() {
    this.posts = [];
    this.postsDirectory = POSTS_DIR;
    this.postsList = [];
    this.filteredPosts = [];
  }

  /**
   * Initialize the blog manager
   */
  async init() {
    try {
      console.log('BlogManager: Initializing...');
      await this.loadPostsList();
      console.log('BlogManager: Posts list loaded:', this.postsList.length, 'posts');
      await this.loadPosts();
      console.log('BlogManager: Posts loaded:', this.posts.length, 'posts');
      this.generateDropdownOptions();
      this.renderPosts();
      console.log('BlogManager: Posts rendered');
      this.setupEventListeners();
      console.log('BlogManager: Event listeners set up');
    } catch (error) {
      console.error('Error initializing blog manager:', error);
    }
  }

  /**
   * Load the list of available posts from posts-index.json
   */
  async loadPostsList() {
    try {
      const response = await fetch(INDEX_FILE);
      if (response.ok) {
        this.postsList = await response.json();
      } else {
        this.displayMessage('Failed to load blog posts. The posts index (posts-index.json) was not found. Please ensure it is generated.', 'error');
        this.postsList = [];
      }
    } catch (error) {
      this.displayMessage('An error occurred while loading blog posts. Please try again later.', 'error');
      console.error('Could not load posts index:', error); // Keep detailed error in console
      this.postsList = [];
    }
  }

  /**
   * Load and parse all blog posts
   */
  async loadPosts() {
    const loadPromises = this.postsList.map(postInfo => this.loadPost(postInfo));
    const results = await Promise.allSettled(loadPromises);
    
    this.posts = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(post => post !== null)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    this.filteredPosts = [...this.posts];
  }

  /**
   * Load and parse a single blog post
   */
  async loadPost(postInfo) {
    try {
      const response = await fetch(`${this.postsDirectory}${postInfo.filename}`);
      if (!response.ok) {
        console.warn(`Could not load post: ${postInfo.filename}`);
        return null;
      }
      
      const htmlContent = await response.text();
      return this.parseOrgPost(htmlContent, postInfo);
    } catch (error) {
      console.error(`Error loading post ${postInfo.filename}:`, error);
      return null;
    }
  }

  /**
   * Parse org-mode exported HTML to extract metadata and content
   */
  parseOrgPost(htmlContent, postInfo) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Extract title - try multiple selectors
    let title = '';
    const titleElement = doc.querySelector('h1.title') || 
                        doc.querySelector('title') || 
                        doc.querySelector('h1');
    if (titleElement) {
      title = titleElement.textContent.trim();
    }
    
    // Extract org-mode tags from special spans or meta tags
    const tags = this.extractTags(doc, postInfo);
    
    // Extract date from org-mode export or filename
    const date = this.extractDate(doc, postInfo);
    
    // Extract excerpt from first paragraph or description
    const excerpt = this.extractExcerpt(doc);
    
    // Extract main content (skip title)
    const content = this.extractContent(doc);
    
    return {
      title: title || postInfo.title || 'Untitled Post',
      slug: postInfo.slug || this.generateSlug(title),
      date: date,
      tags: tags,
      excerpt: excerpt || postInfo.description || 'Click to read this post...',
      content: content,
      filename: postInfo.filename
    };
  }

  /**
   * Extract tags from org-mode export
   */
  extractTags(doc, postInfo) {
    let tags = [];
    
    // Try to find org-mode tags in various formats
    const tagElements = doc.querySelectorAll('.tag, .tags, [class*="tag-"]');
    tagElements.forEach(el => {
      tags.push(...el.textContent.split(/[,\s]+/).filter(tag => tag.trim()));
    });
    
    // Check for tags in meta elements
    const metaTags = doc.querySelector('meta[name="keywords"]');
    if (metaTags) {
      tags.push(...metaTags.content.split(',').map(tag => tag.trim()));
    }
    
    // Use tags from posts-index.json if available
    if (postInfo.tags) {
      tags.push(...postInfo.tags);
    }
    
    // Clean and deduplicate tags
    return [...new Set(tags.filter(tag => tag && tag.length > 0))];
  }

  /**
   * Extract date from org-mode export
   */
  extractDate(doc, postInfo) {
    // Try to find date in org-mode format
    const dateElement = doc.querySelector('.date, .timestamp, [class*="date"]');
    if (dateElement) {
      const dateText = dateElement.textContent.trim();
      const date = new Date(dateText);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    // Use date from posts-index.json
    if (postInfo.date) {
      return postInfo.date;
    }
    
    // Extract from filename if it contains a date pattern
    const dateMatch = postInfo.filename.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return dateMatch[1];
    }
    
    // Default to today
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Extract excerpt from content
   */
  extractExcerpt(doc) {
    const firstParagraph = doc.querySelector('p');
    if (firstParagraph) {
      let text = firstParagraph.textContent.trim();
      return text.length > 200 ? text.substring(0, 200) + '...' : text;
    }
    return 'Click to read this post...';
  }

  /**
   * Extract main content, excluding title
   */
  extractContent(doc) {
    // Prioritize specific Org-mode content containers
    const contentElement = doc.querySelector('#content, .content');
    if (contentElement) {
      // Clone the element to avoid modifying the original document object
      const clonedContent = contentElement.cloneNode(true);
      // Remove title elements from the cloned content
      const titleElements = clonedContent.querySelectorAll('h1.title, title');
      titleElements.forEach(el => el.remove());
      return clonedContent.innerHTML;
    }
    // Fallback to body content if specific containers are not found
    const bodyContent = doc.querySelector('body');
    if (bodyContent) {
      const clonedBody = bodyContent.cloneNode(true);
      const titleElements = clonedBody.querySelectorAll('h1.title, title');
      titleElements.forEach(el => el.remove());
      return clonedBody.innerHTML;
    }
    return '';
  }

  /**
   * Generate URL-friendly slug from title
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
      .replace(/\s+/g, '-')         // Replace spaces with single hyphens
      .replace(/-+/g, '-')         // Replace multiple hyphens with single hyphen
      .replace(/^-+/, '')           // Remove leading hyphens
      .replace(/-+$/, '');          // Remove trailing hyphens
  }

  /**
   * Render posts in the blog container
   */
  renderPosts() {
    console.log('BlogManager: Rendering posts...');
    const container = document.getElementById('postsContainer');
    if (!container) {
      console.error('Posts container not found');
      return;
    }

    console.log('BlogManager: Container found, filtered posts:', this.filteredPosts.length);

    // Clear existing posts (keep the "coming soon" message)
    const existingPosts = container.querySelectorAll('.post-item');
    console.log('BlogManager: Removing', existingPosts.length, 'existing posts');
    existingPosts.forEach(post => post.remove());

    if (this.filteredPosts.length === 0) {
      console.log('BlogManager: No posts to display');
      this.showNoResults(true);
      return;
    }

    this.showNoResults(false);

    this.filteredPosts.forEach((post, index) => {
      console.log(`BlogManager: Creating post element ${index + 1}:`, post.title);
      const postElement = this.createPostElement(post);
      container.insertBefore(postElement, container.lastElementChild);
    });
    
    console.log('BlogManager: All posts rendered');
  }

  /**
   * Create HTML element for a blog post
   */
  createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'col-lg-12 mb-4 post-item';
    postDiv.setAttribute('data-category', post.tags.join(' ').toLowerCase());

    const tagElements = post.tags.map(tag => 
      `<span class="tag ${this.getTagClass(tag)}">${tag}</span>`
    ).join('');

    const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    postDiv.innerHTML = `
      <div class="card post-card h-100">
        <div class="card-body">
          <div class="mb-3">
            ${tagElements}
          </div>
          <h5 class="card-title mb-3">${post.title}</h5>
          <p class="card-text text-muted mb-3">${post.excerpt}</p>
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">${formattedDate}</small>
            <a href="post.html?post=${post.filename}" class="btn btn-outline-primary btn-sm">Read More</a>
          </div>
        </div>
      </div>
    `;

    return postDiv;
  }

  /**
   * Get CSS class for tag based on content
   */
  getTagClass(tag) {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('python')) return 'python';
    if (tagLower.includes('r') || tagLower === 'r') return 'r';
    if (tagLower.includes('ml') || tagLower.includes('machine')) return 'ml';
    if (tagLower.includes('bio') || tagLower.includes('biology')) return 'biology';
    if (tagLower.includes('stat') || tagLower.includes('statistics')) return 'statistics';
    return '';
  }

  /**
   * Show/hide no results message
   */
  showNoResults(show) {
    const noResults = document.getElementById('noResults');
    if (noResults) {
      noResults.style.display = show ? 'block' : 'none';
    }
  }

  /**
   * Display a message in the posts container
   */
  displayMessage(message, type = 'info') {
    const container = document.getElementById('postsContainer');
    if (container) {
      // Clear existing content, but keep the "coming soon" message if it exists
      const existingComingSoon = container.querySelector('.col-12.mb-4');
      container.innerHTML = ''; // Clear everything else

      const messageDiv = document.createElement('div');
      messageDiv.className = `alert alert-${type === 'error' ? 'danger' : 'info'} text-center`;
      messageDiv.setAttribute('role', 'alert');
      messageDiv.textContent = message;
      container.appendChild(messageDiv);

      // Re-add the "coming soon" message if it was there
      if (existingComingSoon) {
        container.appendChild(existingComingSoon);
      }
    }
  }

  /**
   * Filter posts based on search and category
   */
  filterPosts() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryDropdown')?.getAttribute('data-value') || 'all';

    this.filteredPosts = this.posts.filter(post => {
      const matchesSearch = 
        post.title.toLowerCase().includes(searchTerm) ||
        post.excerpt.toLowerCase().includes(searchTerm) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      
      const matchesCategory = 
        categoryFilter === 'all' || 
        post.tags.some(tag => tag.toLowerCase().includes(categoryFilter));

      return matchesSearch && matchesCategory;
    });

    this.renderPosts();
  }

  /**
   * Generate dropdown options from available tags
   */
  generateDropdownOptions() {
    // Collect all unique tags from posts
    const allTags = new Set();
    this.posts.forEach(post => {
      post.tags.forEach(tag => allTags.add(tag.toLowerCase()));
    });

    // Sort tags alphabetically
    const sortedTags = Array.from(allTags).sort();

    // Find dropdown menu
    const dropdownMenu = document.querySelector('#categoryDropdown + .dropdown-menu');
    if (!dropdownMenu) {
      console.warn('Dropdown menu not found');
      return;
    }

    // Clear existing options (except "All Categories")
    dropdownMenu.innerHTML = '';

    // Add "All Categories" option
    const allOption = document.createElement('li');
    allOption.innerHTML = '<a class="dropdown-item" href="#" data-value="all">All Categories</a>';
    dropdownMenu.appendChild(allOption);

    // Add tag options
    sortedTags.forEach(tag => {
      const li = document.createElement('li');
      const displayName = this.capitalizeTag(tag);
      li.innerHTML = `<a class="dropdown-item" href="#" data-value="${tag}">${displayName}</a>`;
      dropdownMenu.appendChild(li);
    });

    
  }

  /**
   * Capitalize tag for display
   */
  capitalizeTag(tag) {
    // Handle special cases
    const specialCases = {
      'r': 'R',
      'ml': 'Machine Learning',
      'org-mode': 'Org-mode',
      'data-science': 'Data Science',
      'bio': 'Biology',
      'stats': 'Statistics'
    };

    if (specialCases[tag]) {
      return specialCases[tag];
    }

    // Default: capitalize first letter
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  }

  /**
   * Set up event listeners for search and filtering
   */
  setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterPosts());
    }

    // Set up dropdown event listeners (will be called after dropdown is generated)
    this.setupDropdownListeners();
  }

  /**
   * Set up dropdown event listeners
   */
  setupDropdownListeners() {
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const value = item.getAttribute('data-value');
        const text = item.textContent;
        const dropdownButton = document.getElementById('categoryDropdown');
        if (dropdownButton) {
          dropdownButton.textContent = text;
          dropdownButton.setAttribute('data-value', value);
          this.filterPosts();
        }
      });
    });
  }
}

// Initialize blog manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const blogManager = new BlogManager();
  blogManager.init();
});

// Export for use in other scripts
window.BlogManager = BlogManager;
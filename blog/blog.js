// Simplified Blog System - Combines blog management and post loading
const POSTS_DIR = './posts/';
const INDEX_FILE = './posts/posts-index.json';

class Blog {
  constructor() {
    this.posts = [];
    this.filteredPosts = [];
    this.currentPage = 1;
    this.postsPerPage = 10;
    this.elements = {};
    this.cacheElements();
  }

  cacheElements() {
    this.elements = {
      postsContainer: document.getElementById('postsContainer'),
      searchInput: document.getElementById('searchInput'),
      categorySelect: document.getElementById('categorySelect'),
      noResults: document.getElementById('noResults'),
      postContainer: document.getElementById('post-container'),
      paginationContainer: document.getElementById('paginationContainer'),
      paginationList: document.getElementById('paginationList')
    };
  }

  async init() {
    if (this.isPostPage()) {
      await this.loadPost();
    } else {
      await this.loadBlog();
    }
  }

  isPostPage() {
    return window.location.pathname.includes('post.html');
  }


  // Blog Index Page
  async loadBlog() {
    try {
      const response = await fetch(INDEX_FILE);
      if (!response.ok) throw new Error('Posts index not found');
      
      const postsIndex = await response.json();
      
      // Reading time is now pre-calculated in posts-index.json
      this.posts = postsIndex.sort((a, b) => new Date(b.date) - new Date(a.date));
      this.filteredPosts = [...this.posts];
      
      this.populateCategories();
      this.renderPosts();
      this.setupEventListeners();
    } catch (error) {
      this.showError('Failed to load blog posts');
    }
  }

  populateCategories() {
    if (!this.elements.categorySelect) return;
    
    const tags = [...new Set(this.posts.flatMap(post => post.tags))].sort();
    
    this.elements.categorySelect.innerHTML = '<option value="">All Categories</option>' +
      tags.map(tag => `<option value="${tag}">${tag}</option>`).join('');
  }

  renderPosts() {
    if (!this.elements.postsContainer) return;

    // Clear existing posts
    this.elements.postsContainer.querySelectorAll('.post-item').forEach(el => el.remove());

    if (this.filteredPosts.length === 0) {
      this.showNoResults(true);
      this.showPagination(false);
      return;
    }

    this.showNoResults(false);
    
    // Calculate pagination
    const totalPages = Math.ceil(this.filteredPosts.length / this.postsPerPage);
    const startIndex = (this.currentPage - 1) * this.postsPerPage;
    const endIndex = startIndex + this.postsPerPage;
    const postsToShow = this.filteredPosts.slice(startIndex, endIndex);
    
    // Render posts for current page
    postsToShow.forEach(post => {
      const postElement = this.createPostCard(post);
      this.elements.postsContainer.insertBefore(postElement, this.elements.postsContainer.lastElementChild);
    });
    
    // Update pagination
    this.renderPagination(totalPages);
  }

  createPostCard(post) {
    const div = document.createElement('div');
    div.className = 'col-lg-12 mb-4 post-item';
    
    const tags = post.tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('');
    const date = new Date(post.date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    div.innerHTML = `
      <div class="card h-100">
        <div class="card-body">
          <div class="mb-2">${tags}</div>
          <h5 class="card-title">${post.title}</h5>
          <p class="card-text text-muted">${post.description}</p>
          <div class="d-flex justify-content-between align-items-center">
            <div class="text-muted">
              <small>${date}</small>
              <span class="mx-1">•</span>
              <small>${post.readingTime || '~ min read'}</small>
            </div>
            <a href="post.html?post=${post.filename}" class="btn btn-outline-primary btn-sm">Read More</a>
          </div>
        </div>
      </div>
    `;

    return div;
  }

  filterPosts() {
    const searchTerm = this.elements.searchInput?.value.toLowerCase() || '';
    const category = this.elements.categorySelect?.value || '';

    this.filteredPosts = this.posts.filter(post => {
      const matchesSearch = !searchTerm || 
        post.title.toLowerCase().includes(searchTerm) ||
        post.description.toLowerCase().includes(searchTerm) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm));

      const matchesCategory = !category || post.tags.includes(category);

      return matchesSearch && matchesCategory;
    });

    // Reset to first page when filtering
    this.currentPage = 1;
    this.renderPosts();
  }

  setupEventListeners() {
    this.elements.searchInput?.addEventListener('input', () => this.filterPosts());
    this.elements.categorySelect?.addEventListener('change', () => this.filterPosts());
  }

  showNoResults(show) {
    if (this.elements.noResults) {
      this.elements.noResults.style.display = show ? 'block' : 'none';
    }
  }

  showPagination(show) {
    if (this.elements.paginationContainer) {
      this.elements.paginationContainer.style.display = show ? 'flex' : 'none';
    }
  }

  renderPagination(totalPages) {
    if (!this.elements.paginationList || totalPages <= 1) {
      this.showPagination(false);
      return;
    }

    this.showPagination(true);
    this.elements.paginationList.innerHTML = '';

    // Previous button
    const prevItem = document.createElement('li');
    prevItem.className = `page-item ${this.currentPage === 1 ? 'disabled' : ''}`;
    prevItem.innerHTML = `
      <a class="page-link" href="#" aria-label="Previous">
        <span aria-hidden="true">&laquo;</span>
      </a>
    `;
    if (this.currentPage > 1) {
      prevItem.addEventListener('click', (e) => {
        e.preventDefault();
        this.goToPage(this.currentPage - 1);
      });
    }
    this.elements.paginationList.appendChild(prevItem);

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      this.addPageButton(1);
      if (startPage > 2) {
        this.addEllipsis();
      }
    }

    // Add visible page numbers
    for (let page = startPage; page <= endPage; page++) {
      this.addPageButton(page);
    }

    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        this.addEllipsis();
      }
      this.addPageButton(totalPages);
    }

    // Next button
    const nextItem = document.createElement('li');
    nextItem.className = `page-item ${this.currentPage === totalPages ? 'disabled' : ''}`;
    nextItem.innerHTML = `
      <a class="page-link" href="#" aria-label="Next">
        <span aria-hidden="true">&raquo;</span>
      </a>
    `;
    if (this.currentPage < totalPages) {
      nextItem.addEventListener('click', (e) => {
        e.preventDefault();
        this.goToPage(this.currentPage + 1);
      });
    }
    this.elements.paginationList.appendChild(nextItem);
  }

  addPageButton(page) {
    const pageItem = document.createElement('li');
    pageItem.className = `page-item ${page === this.currentPage ? 'active' : ''}`;
    pageItem.innerHTML = `<a class="page-link" href="#">${page}</a>`;
    
    if (page !== this.currentPage) {
      pageItem.addEventListener('click', (e) => {
        e.preventDefault();
        this.goToPage(page);
      });
    }
    
    this.elements.paginationList.appendChild(pageItem);
  }

  addEllipsis() {
    const ellipsisItem = document.createElement('li');
    ellipsisItem.className = 'page-item disabled';
    ellipsisItem.innerHTML = '<span class="page-link">...</span>';
    this.elements.paginationList.appendChild(ellipsisItem);
  }

  goToPage(page) {
    this.currentPage = page;
    this.renderPosts();
    
    // Scroll to top of posts section
    if (this.elements.postsContainer) {
      this.elements.postsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Individual Post Page
  async loadPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const postFilename = urlParams.get('post');

    if (!postFilename) {
      this.showError('No post specified');
      return;
    }

    try {
      // Load post metadata
      const indexResponse = await fetch(INDEX_FILE);
      if (!indexResponse.ok) throw new Error('Posts index not found');
      
      const postsIndex = await indexResponse.json();
      const postMeta = postsIndex.find(post => post.filename === postFilename);
      
      if (!postMeta) throw new Error('Post not found in index');

      // Load post content
      const contentResponse = await fetch(`${POSTS_DIR}${postFilename}`);
      if (!contentResponse.ok) throw new Error('Post content not found');
      
      const htmlContent = await contentResponse.text();
      this.displayPost(htmlContent, postMeta);
      
    } catch (error) {
      this.showError('Failed to load post');
    }
  }

  displayPost(htmlContent, postMeta) {
    if (!this.elements.postContainer) return;

    // Extract content from org-mode HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const content = doc.querySelector('#content, .content')?.innerHTML || doc.body.innerHTML;

    // Use pre-calculated reading time from metadata
    const readingTime = postMeta.readingTime || '~ min read';

    // Create post header with metadata
    const date = new Date(postMeta.date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const tags = postMeta.tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('');

    const postHeader = `
      <div class="mb-4 pb-3 border-bottom">
        <div class="mb-2">${tags}</div>
        <div class="text-muted">
          <small>${date}</small>
          <span class="mx-1">•</span>
          <small>${readingTime}</small>
        </div>
      </div>
    `;

    this.elements.postContainer.innerHTML = postHeader + content;
    this.updatePageMeta(postMeta);
    this.highlightCode();
    
    // Re-render math if MathJax is available
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([this.elements.postContainer]).catch((err) => {
        console.warn('MathJax error:', err);
      });
    }
  }

  updatePageMeta(postMeta) {
    document.title = `${postMeta.title} - Stefan Groha`;
    
    const description = postMeta.description || 'A blog post by Stefan Groha';
    
    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = description;
    }

    // Update Open Graph
    ['og:title', 'twitter:title'].forEach(prop => {
      const meta = document.querySelector(`meta[property="${prop}"]`);
      if (meta) meta.content = postMeta.title;
    });

    ['og:description', 'twitter:description'].forEach(prop => {
      const meta = document.querySelector(`meta[property="${prop}"]`);
      if (meta) meta.content = description;
    });
  }

  highlightCode() {
    if (typeof Prism !== 'undefined') {
      document.querySelectorAll('pre.src').forEach(pre => {
        const code = pre.querySelector('code') || document.createElement('code');
        if (!pre.querySelector('code')) {
          code.innerHTML = pre.innerHTML;
          pre.innerHTML = '';
          pre.appendChild(code);
        }
        
        const srcClass = Array.from(pre.classList).find(cls => cls.startsWith('src-'));
        if (srcClass) {
          let lang = srcClass.substring(4);
          // Map org-mode language names to Prism language names
          const langMap = {
            'sh': 'bash',
            'shell': 'bash',
            'emacs-lisp': 'lisp',
            'js': 'javascript'
          };
          lang = langMap[lang] || lang;
          code.className = `language-${lang}`;
        }
      });
      
      // Configure Prism plugins
      if (Prism.plugins && Prism.plugins.NormalizeWhitespace) {
        Prism.plugins.NormalizeWhitespace.setDefaults({
          'remove-trailing': true,
          'remove-indent': true,
          'left-trim': true,
          'right-trim': true
        });
      }
      
      Prism.highlightAll();
    }
  }



  showError(message) {
    const container = this.elements.postContainer || this.elements.postsContainer;
    if (container) {
      container.innerHTML = `<div class="alert alert-danger text-center">${message}</div>`;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Blog().init();
});
// Simplified Blog System - Combines blog management and post loading
const POSTS_DIR = './posts/';
const INDEX_FILE = './posts/posts-index.json';

class Blog {
  constructor() {
    this.posts = [];
    this.filteredPosts = [];
    this.elements = {};
    this.cacheElements();
  }

  cacheElements() {
    this.elements = {
      postsContainer: document.getElementById('postsContainer'),
      searchInput: document.getElementById('searchInput'),
      categorySelect: document.getElementById('categorySelect'),
      noResults: document.getElementById('noResults'),
      postContainer: document.getElementById('post-container')
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
      return;
    }

    this.showNoResults(false);
    
    this.filteredPosts.forEach(post => {
      const postElement = this.createPostCard(post);
      this.elements.postsContainer.insertBefore(postElement, this.elements.postsContainer.lastElementChild);
    });
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
            <small class="text-muted">${date}</small>
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

    this.elements.postContainer.innerHTML = content;
    this.updatePageMeta(postMeta);
    this.highlightCode();
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
          const lang = srcClass.substring(4);
          code.className = `language-${lang}`;
        }
      });
      
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
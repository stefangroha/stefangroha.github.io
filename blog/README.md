# Org-mode Blog Integration

This system allows you to write blog posts in org-mode and automatically integrate them with your website, maintaining consistent styling and navigation. The system automatically wraps your raw org-mode exports with blog header/footer and generates the blog index.

## Quick Start

1. **Write your post in org-mode** with tags and metadata
2. **Export to HTML**: `C-c C-e h h` in Emacs
3. **Add post-wrapper script** to the exported HTML (see below)
4. **Copy the HTML file** to `blog/posts/`
5. **Update the index**: Run `node generate-posts-index.js`
6. **Commit and push** to GitHub Pages

## Directory Structure

```
blog/
├── blog.html              # Main blog index page
├── blog-manager.js         # Handles dynamic post loading
├── post-wrapper.js         # Wraps posts with header/footer
├── blog-header.html        # Template for post headers
├── blog-footer.html        # Template for post footers
├── generate-posts-index.js # Script to generate post index
└── posts/
    ├── posts-index.json    # Auto-generated index of posts
    └── *.html              # Your org-exported HTML posts
```

## Writing Posts

### Org-mode Template

Start your org files with proper metadata:

```org
#+TITLE: Your Post Title
#+DATE: 2025-01-15
#+TAGS: python ml data-science
#+DESCRIPTION: A brief description of your post

Your post content here...
```

### Tags

Tags are automatically extracted from:
- `#+TAGS:` in your org file
- `<span class="tag">` elements in exported HTML
- `meta name="keywords"` in HTML head

Supported tag styles for automatic styling:
- `python` → Blue styling
- `r` → Purple styling  
- `ml`, `machine-learning` → Green styling
- `biology`, `bio` → Orange styling
- `statistics`, `stats` → Pink styling

### Export Process

1. In Emacs: `C-c C-e h h` to export to HTML
2. **Add the post-wrapper script** to the end of your exported HTML file:
   ```html
   <!-- Post wrapper script to add blog styling -->
   <script src="../post-wrapper.js"></script>
   ```
3. Place the HTML file in the `blog/posts/` directory
4. The post-wrapper script will automatically add header, footer, and styling when the page loads

### Post Structure

Your exported org-mode HTML will look like this:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Your Post Title</title>
    <!-- org-mode's default CSS -->
</head>
<body>
<div id="content" class="content">
    <h1 class="title">Your Post Title</h1>
    <div class="date">2025-01-15</div>
    
    <!-- Your org content here -->
    
</div>

<!-- Add this script at the end -->
<script src="../post-wrapper.js"></script>
</body>
</html>
```

The `post-wrapper.js` script will:
- Load your blog header and footer templates
- Extract metadata from the org content
- Wrap your content with navigation and styling
- Initialize syntax highlighting and other features

## Automation

### Local Development

Run the index generator after adding new posts:

```bash
cd blog
node generate-posts-index.js
```

This scans all HTML files in `posts/` and updates `posts-index.json` with:
- Post titles (extracted from `<h1 class="title">` or `<title>`)
- Publication dates (from `.date` elements or file modification time)
- Tags (from `<span class="tag">` elements)
- Descriptions (auto-generated from first paragraph)
- URL slugs (auto-generated from titles)

**Note**: The script only reads HTML files to extract metadata - it does not modify your org-exported HTML files.

### GitHub Pages Integration

The system works entirely with client-side JavaScript, making it compatible with GitHub Pages:

1. **Static Generation**: The `generate-posts-index.js` script runs locally
2. **Dynamic Loading**: Posts are loaded dynamically via `blog-manager.js`
3. **Template Wrapping**: `post-wrapper.js` adds navigation and styling

## Features

### Automatic Integration
- **Header/Footer**: Posts automatically get site navigation and styling via `post-wrapper.js`
- **Responsive Design**: All content works on mobile and desktop
- **Syntax Highlighting**: Code blocks are automatically highlighted
- **Search & Filter**: Posts can be searched and filtered by tags
- **Template Loading**: Automatically loads `blog-header.html` and `blog-footer.html` templates

### SEO Optimization
- **Meta Tags**: Automatic Open Graph and Twitter meta tags
- **Structured URLs**: Clean, SEO-friendly URLs
- **Performance**: Lazy loading and optimized assets

### Styling
- **Consistent Theme**: Posts match your site's design
- **Typography**: Optimized reading experience
- **Code Blocks**: Syntax highlighting for Python, R, and more
- **Tables & Images**: Responsive formatting

## Customization

### Styling Posts

Edit `blog-header.html` to customize post styling. Key CSS classes:

- `.blog-post` - Main post container
- `.blog-post h1, h2, h3` - Headers
- `.blog-post pre code` - Code blocks
- `.tag` - Tag styling

### Adding New Tag Styles

In `blog-manager.js`, update the `getTagClass()` method:

```javascript
getTagClass(tag) {
  const tagLower = tag.toLowerCase();
  if (tagLower.includes('python')) return 'python';
  if (tagLower.includes('your-tag')) return 'your-style';
  // ...
}
```

Then add corresponding CSS in `blog-header.html`.

## Troubleshooting

### Posts Not Appearing

1. Check that HTML files are in `blog/posts/`
2. Verify `posts-index.json` was generated correctly
3. Check browser console for JavaScript errors
4. Ensure posts have the post-wrapper script included

### Styling Issues

1. Check that `blog-header.html` and `blog-footer.html` exist
2. Verify the post-wrapper script is loading correctly
3. Test that Bootstrap and other dependencies load
4. Check browser console for template loading errors

### Post-Wrapper Not Working

1. Ensure the script tag is added: `<script src="../post-wrapper.js"></script>`
2. Check that you're viewing the post via HTTP (not file://)
3. Verify template files exist and are accessible
4. Check browser console for CORS or loading errors

### Tags Not Working

1. Ensure tags are in the exported HTML
2. Check the `extractTags()` method in `blog-manager.js`
3. Verify tag extraction patterns match your org export format

## Advanced Usage

### Custom Metadata

Add custom fields to `posts-index.json`:

```json
{
  "filename": "my-post.html",
  "title": "My Post",
  "author": "Stefan Groha",
  "category": "tutorial",
  "featured": true
}
```

### Multiple Authors

Support multiple authors by adding author metadata to posts and updating the templates.

### Categories

Implement categories alongside tags by modifying the filtering system in `blog-manager.js`.

## Deployment

1. **Local**: Run `generate-posts-index.js` after adding posts
2. **Commit**: Add all files including `posts-index.json`
3. **Push**: Deploy to GitHub Pages
4. **Verify**: Check that posts load correctly on the live site

The system is designed to work entirely on GitHub Pages without server-side processing.
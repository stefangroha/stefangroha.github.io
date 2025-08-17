#!/usr/bin/env node

/**
 * Generate posts index for org-mode blog
 * This script scans the posts directory and creates/updates posts-index.json
 * It does NOT modify HTML files - only reads them to extract metadata
 * Run this locally after adding new posts
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = './posts';
const INDEX_FILE = './posts/posts-index.json';

/**
 * Extract metadata from org-mode HTML file
 */
function extractMetadata(htmlContent, filename) {
  // Extract title
  const titleMatch = htmlContent.match(/<h1[^>]*class="title"[^>]*>(.*?)<\/h1>|<title>(.*?)<\/title>/i);
  const title = titleMatch ? (titleMatch[1] || titleMatch[2]).replace(/<[^>]*>/g, '').trim() : 
                path.basename(filename, '.html');

  // Extract date
  const dateMatch = htmlContent.match(/<div[^>]*class="date"[^>]*>(.*?)<\/div>|<meta[^>]*name="date"[^>]*content="([^"]*)">/i);
  let date = dateMatch ? (dateMatch[1] || dateMatch[2]).trim() : null;
  
  // Try to extract date from filename
  if (!date) {
    const filenameDateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
    if (filenameDateMatch) {
      date = filenameDateMatch[1];
    } else {
      // Use file modification time as fallback, with error handling
      try {
        const stats = fs.statSync(path.join(POSTS_DIR, filename));
        date = stats.mtime.toISOString().split('T')[0];
      } catch (statError) {
        console.warn(`Could not get file stats for ${filename}:`, statError.message);
        date = new Date().toISOString().split('T')[0]; // Fallback to current date
      }
    }
  }

  // Extract tags
  const tags = [];
  
  // Look for tags in various formats
  const tagMatches = htmlContent.match(/<span[^>]*class="tag"[^>]*>(.*?)<\/span>/gi);
  if (tagMatches) {
    tagMatches.forEach(match => {
      const tagContent = match.replace(/<[^>]*>/g, '').trim();
      if (tagContent) tags.push(tagContent);
    });
  }

  // Look for keywords in meta tags
  const keywordsMatch = htmlContent.match(/<meta[^>]*name="keywords"[^>]*content="([^"]*)">/i);
  if (keywordsMatch) {
    const keywords = keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k);
    tags.push(...keywords);
  }

  // Extract description/excerpt
  const descriptionMatch = htmlContent.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  let description = '';
  if (descriptionMatch) {
    description = descriptionMatch[1]
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (description.length > 160) {
      description = description.substring(0, 160) + '...';
    }
  }

  // Generate slug
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
    .replace(/\s+/g, '-')         // Replace spaces with single hyphens
    .replace(/-+/g, '-')         // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')           // Remove leading hyphens
    .replace(/-+$/, '');          // Remove trailing hyphens

  return {
    filename,
    title,
    slug,
    date,
    tags: [...new Set(tags)], // Remove duplicates
    description
  };
}

/**
 * Scan posts directory and generate index
 */
function generateIndex() {
  try {
    // Check if posts directory exists
    if (!fs.existsSync(POSTS_DIR)) {
      console.log('Posts directory does not exist. Creating it...');
      fs.mkdirSync(POSTS_DIR, { recursive: true });
      return [];
    }

    // Read all HTML files in posts directory
    const files = fs.readdirSync(POSTS_DIR)
      .filter(file => file.endsWith('.html') && file !== 'index.html');

    if (files.length === 0) {
      console.log('No HTML posts found in posts directory.');
      return [];
    }

    console.log(`Found ${files.length} post(s). Processing...`);

    const posts = [];

    files.forEach(filename => {
      try {
        const filepath = path.join(POSTS_DIR, filename);
        const htmlContent = fs.readFileSync(filepath, 'utf8');
        
        // Extract metadata for index
        const metadata = extractMetadata(htmlContent, filename);
        posts.push(metadata);
        console.log(`📝 Indexed: ${filename} -> ${metadata.title}`);
        
      } catch (error) {
        console.error(`Error processing ${filename}:`, error.message);
      }
    });

    // Sort posts by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    return posts;

  } catch (error) {
    console.error('Error scanning posts directory:', error);
    return [];
  }
}

/**
 * Write index to file
 */
function writeIndex(posts) {
  try {
    const indexContent = JSON.stringify(posts, null, 2);
    fs.writeFileSync(INDEX_FILE, indexContent, 'utf8');
    console.log(`\nGenerated posts index with ${posts.length} post(s).`);
    console.log(`Written to: ${INDEX_FILE}`);
  } catch (error) {
    console.error('Error writing index file:', error);
  }
}

/**
 * Main function
 */
function main() {
  console.log('Starting blog post index generation...\n');
  
  const posts = generateIndex();
  writeIndex(posts);
  
  if (posts.length > 0) {
    console.log('\nSuccessfully indexed the following posts:');
    posts.forEach(post => {
      console.log(`- ${post.date}: ${post.title} (Tags: ${post.tags.join(', ')})`);
    });
  } else {
    console.log('\nNo blog posts found to index.');
  }
  
  console.log('\nFinished updating posts-index.json.');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateIndex, extractMetadata };
# Blog Post Workflow

This guide outlines the steps to create and publish a new blog post for your website. The system is designed to allow you to write posts in Org-mode, export them to HTML, and then automatically integrate them into your blog.

## 1. Write Your Post in Org-mode

Create your blog post in an Org-mode file (`.org`). Ensure you include the following metadata at the top of your file:

```org
#+TITLE: Your Post Title
#+DATE: YYYY-MM-DD
#+TAGS: tag1 tag2 tag3
#+DESCRIPTION: A brief description of your post (for SEO and excerpts)
```

*   **`#+TITLE:`**: The main title of your blog post.
*   **`#+DATE:`**: The publication date of your post in `YYYY-MM-DD` format.
*   **`#+TAGS:`**: Space-separated keywords or categories for your post. These will be used for filtering and styling on the blog index page.
*   **`#+DESCRIPTION:`**: A short summary or excerpt of your post. This will be used in the blog index and for SEO purposes.

**Example Org-mode Content:**

```org
#+TITLE: My First Blog Post
#+DATE: 2025-08-17
#+TAGS: python data-science tutorial
#+DESCRIPTION: A step-by-step guide to setting up your first Python data science project.

* Introduction
This is the introduction to my first blog post.

* Setting up the Environment
Here are some code examples:

#+begin_src python
import pandas as pd
print("Hello, world!")
#+end_src

* Conclusion
Thanks for reading!
```

## Tag Styling

The blog system automatically applies specific styling to certain tags. When you use these tags in your Org-mode posts, they will be displayed with a distinct visual style on the blog index page (`blog.html`).

Currently recognized tags and their associated styles are:

*   `python`: Blue styling
*   `r`: Purple styling
*   `ml` or `machine-learning`: Green styling
*   `biology` or `bio`: Orange styling
*   `statistics` or `stats`: Pink styling

If you use other tags, they will be displayed with the default tag styling.

## 2. Export to HTML

Export your Org-mode file to HTML. In Emacs, you can typically do this by pressing `C-c C-e h h`. This will generate an HTML file with the same name as your Org-mode file (e.g., `my-first-blog-post.html`).

## 3. Place the Exported HTML File

Copy the generated HTML file into the `blog/posts/` directory:

```bash
cp /path/to/your/exported-post.html /Users/stefan/My\ Drive/Org/Website/blog/posts/
```

## 4. Update the Blog Index

After adding new posts (or modifying existing ones), you need to update the `posts-index.json` file. This file is used by the blog to list and display your posts.

Navigate to the `blog` directory in your terminal and run the following command:

```bash
cd /Users/stefan/My\ Drive/Org/Website/blog
node generate-posts-index.js
```

This script will scan all HTML files in `blog/posts/`, extract their metadata (title, date, tags, description), and update `posts-index.json`. You will see a summary of the indexed posts in your terminal.

## 5. View Your Post

Your new post should now be visible on your blog index page (`blog.html`). You can also directly access individual posts via `post.html?post=your-post-filename.html`.

---
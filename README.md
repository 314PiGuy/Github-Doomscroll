# GitScroll - GitHub Doomscroll

A "reels-style" GitHub repository explorer. Scroll through random repositories, view their READMEs and code, and discover new projects based on your interests.

## Features

- **Infinite Scroll**: Swipe through repositories like a social media feed.
- **Dual View**: Toggle between README and Code view for each repo.
- **Recommendation Engine**: The app learns from your likes/dislikes to show more relevant content.
- **GitHub Token Integration**: Add your Personal Access Token for higher rate limits and private repo access (stored locally).
- **Mobile Friendly**: Designed for both desktop and mobile.

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Run locally:
    ```bash
    npm run dev
    ```

## Deployment to GitHub Pages

1.  Make sure your project is pushed to a GitHub repository.
2.  Run the deploy script:
    ```bash
    npm run deploy
    ```
3.  Your site will be live at `https://<username>.github.io/<repo-name>/`.

## Tech Stack

- React
- Vite
- Tailwind-like CSS
- Framer Motion
- React Markdown
- React Syntax Highlighter

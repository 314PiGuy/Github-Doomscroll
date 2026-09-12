# GitScroll

GitScroll is a quiet, swipeable feed for discovering GitHub projects. Search results appear immediately from their lightweight metadata; README and code requests happen only when the user pauses or asks for them.

## How it works

- **Cheap feed cards:** one search batch supplies names, descriptions, languages, and counts. Opening every repository page is unnecessary.
- **Dwell-based README loading:** a README is requested after the active card remains on screen for 850 ms. Fast scrolling makes no detail requests.
- **One-request file index:** opening Files gets the repository's recursive tree once. The browser then filters and searches it locally; file content loads only after selection.
- **Folder and content search:** files are arranged in collapsible folders. Search filters the complete path index, and an opened file has its own highlighted text search.
- **Request reuse:** identical in-flight requests are shared, while search results, READMEs, trees, and files are cached for the browser session.
- **Rate-limit-aware batching:** search queries run sequentially in two-query batches to avoid bursts that can trigger GitHub's secondary limiter.

## Recommendations

There are no embeddings or semantic-similarity weights. Feedback is kept locally as topic-presence sets and turned directly into GitHub queries:

1. Compute liked and disliked document frequency for every topic.
2. Score each topic with `liked DF - 1.75 × disliked DF`.
3. Discount a small set of generic development terms.
4. Group positive topics only when they co-occur in liked repositories.
5. Add strong dislike-only topics as `NOT` filters.
6. Mix personalized queries with an exploration query about 70/30.

Stars are bounded loosely for basic quality control, but never used to order the feed. This keeps popular projects from crowding out relevant or unusual ones.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

The optional GitHub token in Settings is stored only in local browser storage. Keyboard shortcuts are `J` or ↓ for next, `L` for more like this, and `D` for less like this.

Enable **Debug controls** in Settings to tune README dwell time, batch size, result count, refill thresholds, cache behavior, sequential search execution, exploration balance, Rocchio weights, co-occurrence bundle size, negative filters, and star bounds. These values are local and apply to future requests; disabling debug controls restores the standard runtime defaults.

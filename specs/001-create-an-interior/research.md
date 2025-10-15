# Research: Interior Style Discovery App

**Date**: 2025-10-14
**Feature**: Interior Style Discovery App
**Plan**: [plan.md](./plan.md)

## Research Questions Resolved

### 1. Static Site Framework Selection

**Decision**: Vite + Vanilla JavaScript (with optional Preact for components)

**Rationale**:
- **Vite**: Modern, fast dev server with instant HMR; zero-config for vanilla JS; produces optimized bundles
- **Vanilla JS**: Zero learning curve for beginners; no framework lock-in; full control over DOM; ~0KB overhead
- **Optional Preact**: If component state gets complex, Preact adds only 3KB and provides React-like DX without bloat

**Alternatives Considered**:
- **Next.js/React**: Rejected - too heavy (>100KB), requires Node.js server for SSR, overkill for static site
- **Vue/Nuxt**: Rejected - similar complexity to React, larger bundle size than needed
- **Plain HTML/CSS/JS**: Considered - but Vite's dev experience (HMR, module imports, build optimization) worth the minimal setup cost
- **Svelte**: Considered - excellent DX and small bundles, but adds build complexity and is less familiar for beginners

**Best Practices**:
- Use ES modules for clean separation of concerns
- Leverage CSS custom properties for theming
- Implement progressive enhancement (works without JS for initial load)
- Use semantic HTML for accessibility

---

### 2. Client-Side Recommendation Algorithm Approach

**Decision**: Weighted scoring system with style attribute frequency analysis

**Rationale**:
- Simple to implement and test (no ML libraries needed)
- Transparent and debuggable (users can understand why they got recommendations)
- Fast execution (runs in <100ms for 10-15 rounds)
- Easily adjustable weights based on testing feedback

**Algorithm Overview**:
```
For each round:
  1. Track chosen image's style tags (e.g., "modern", "minimalist", "warm-colors")
  2. Parse explanation text for design keywords (color, texture, furniture, lighting)
  3. Update style confidence scores: score[style] += weight * frequency

After minimum rounds (6):
  4. Calculate confidence threshold: max_score > (2nd_max_score * 1.5)
  5. If threshold met, return top style + 2nd best style
  6. Else, continue up to max rounds (15)

Style matching:
  - Select 10 images with highest overlap with top style tags
  - Ensure visual diversity (no duplicate room layouts)
```

**Alternatives Considered**:
- **Collaborative Filtering**: Rejected - requires user database, overkill for single-user anonymous sessions
- **ML/Neural Networks**: Rejected - requires TensorFlow.js (adds 500KB+), training data, complex implementation
- **Simple Plurality Vote**: Rejected - too simplistic, doesn't handle nuanced preferences or keyword analysis
- **Decision Tree**: Considered - good for interpretability but less flexible than weighted scoring for adjustments

**Best Practices**:
- Store image metadata with rich style tags upfront
- Use lowercase, normalized keywords for comparison
- Implement confidence thresholds to avoid premature recommendations
- Log recommendation data for future refinement (in memory only, not persisted)

---

### 3. Image Loading & Retry Strategy

**Decision**: Progressive image loading with exponential backoff retry

**Rationale**:
- Handles network failures gracefully without blocking user flow
- Respects user bandwidth with lazy loading
- Provides clear feedback on loading state

**Implementation Strategy**:
```javascript
// Image loading service with retry logic
async function loadImage(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await preloadImage(url);
      return { success: true, url };
    } catch (error) {
      if (attempt === maxRetries) {
        return { success: false, error };
      }
      await delay(Math.pow(2, attempt) * 500); // 1s, 2s, 4s backoff
    }
  }
}
```

**Alternatives Considered**:
- **No Retry**: Rejected - poor UX, fails spec requirement FR-015
- **Fixed Delay Retry**: Considered - but exponential backoff better for transient network issues
- **Service Worker Caching**: Considered - but adds complexity for minimal benefit given ephemeral sessions
- **CDN Only**: Partial solution - still need retry logic for CDN failures

**Best Practices**:
- Show loading skeleton/placeholder immediately
- Display retry progress to user ("Retrying 2/3...")
- Preload next pair of images while user types explanation
- Use `loading="lazy"` attribute for images not immediately visible

---

### 4. Keyboard Navigation Implementation

**Decision**: Custom keyboard handler with focus trap and clear visual indicators

**Rationale**:
- Full WCAG 2.1 AA compliance for keyboard accessibility
- Typeform-style flow: Tab (next field), Shift+Tab (previous), Enter (submit), Escape (cancel/back)
- Clear focus indicators show current element at all times

**Implementation Patterns**:
```javascript
// Keyboard navigation service
const KeyboardNav = {
  keys: {
    TAB: 9,
    ENTER: 13,
    ESCAPE: 27,
    ARROW_LEFT: 37,
    ARROW_RIGHT: 39
  },

  // Focus trap for modal dialogs (recommendations screen)
  trapFocus(container) {
    const focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    // Cycle focus between first and last
  },

  // Image selection with keyboard
  handleImageSelection(event) {
    if (event.key === 'a' || event.key === 'A') selectImageA();
    if (event.key === 'b' || event.key === 'B') selectImageB();
    if (event.key === 'Enter') confirmSelection();
  }
};
```

**CSS Focus Indicators**:
```css
/* High-contrast focus outline */
:focus-visible {
  outline: 3px solid #0066FF;
  outline-offset: 4px;
  border-radius: 4px;
}

/* Skip to content link (keyboard-only) */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #0066FF;
  color: white;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

**Alternatives Considered**:
- **Browser Default Focus**: Rejected - insufficient contrast, poor UX
- **JavaScript Focus Management Library**: Rejected - adds dependency, easy to implement custom
- **Arrow Key Navigation**: Included for image selection but not primary (Tab/Enter is standard)

**Best Practices**:
- Always show focus indicator (never `outline: none` without replacement)
- Provide skip links for keyboard-only users
- Test with actual keyboard users (Playwright E2E tests simulate this)
- Ensure logical tab order matches visual layout
- Announce dynamic content changes to screen readers (aria-live regions)

---

### 5. Session Management & Browser Storage

**Decision**: localStorage with JSON serialization and timestamp-based expiry

**Rationale**:
- Available in all modern browsers (no polyfill needed)
- Synchronous API (simpler than IndexedDB)
- Sufficient storage for session data (~5-10KB for 15 rounds)
- Automatically cleared when user closes browser (sessionStorage) or after 24hr (localStorage)

**Storage Schema**:
```javascript
{
  "session": {
    "id": "uuid-v4",
    "startTime": 1697234567890,
    "currentRound": 5,
    "choices": [
      {
        "round": 1,
        "selectedImage": "img-modern-001",
        "rejectedImage": "img-traditional-005",
        "explanation": "I prefer the clean lines and neutral colors",
        "timestamp": 1697234580000
      }
      // ... more rounds
    ],
    "styleScores": {
      "modern": 0.85,
      "minimalist": 0.72,
      "scandinavian": 0.45
    },
    "recommendedStyle": null,
    "secondBestStyle": null
  }
}
```

**Session Cleanup**:
```javascript
// Check session age on app load
function isSessionValid(session) {
  const age = Date.now() - session.startTime;
  const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
  return age < MAX_AGE;
}

// Clear expired sessions
if (!isSessionValid(loadedSession)) {
  localStorage.removeItem('interiorDesignSession');
  startNewSession();
}
```

**Alternatives Considered**:
- **sessionStorage**: Considered - but clears on browser close; 24hr timeout in spec allows page refresh
- **IndexedDB**: Rejected - overkill for simple key-value storage, async API adds complexity
- **Cookies**: Rejected - 4KB limit insufficient, unnecessary server involvement
- **In-Memory Only**: Rejected - loses progress on page refresh (poor UX)

**Best Practices**:
- Always validate localStorage availability (handle QuotaExceededError)
- Gracefully degrade if storage disabled (warn user about refresh losing progress)
- Never store PII or sensitive data (we don't, but good principle)
- Compress data if approaching storage limits (not needed for our case)

---

### 6. Image Asset Organization & Sourcing Strategy

**Decision**: Organize images by style categories with JSON metadata manifest

**Rationale**:
- Enables efficient filtering for recommendations
- Supports rich metadata (tags, colors, furniture types) without polluting filenames
- Easy to add/remove images without code changes
- Enables future features (filtering, search) without refactoring

**Directory Structure**:
```
public/images/living-rooms/
├── modern/
│   ├── modern-001.jpg
│   ├── modern-002.jpg
│   └── modern-003.jpg
├── traditional/
│   ├── trad-001.jpg
│   └── trad-002.jpg
├── minimalist/
├── bohemian/
├── industrial/
└── scandinavian/
```

**Metadata Manifest** (`src/data/images.json`):
```json
{
  "images": [
    {
      "id": "modern-001",
      "url": "/images/living-rooms/modern/modern-001.jpg",
      "thumbnail": "/images/living-rooms/modern/modern-001-thumb.jpg",
      "styles": ["modern", "minimalist"],
      "colors": ["neutral", "gray", "white"],
      "furniture": ["sectional-sofa", "glass-coffee-table"],
      "lighting": ["natural", "recessed"],
      "attributes": ["open-space", "clean-lines", "sparse-decor"],
      "alt": "Modern living room with gray sectional sofa and minimalist decor"
    }
  ]
}
```

**Image Sourcing Options**:
1. **Free Stock Photo Sources**:
   - Unsplash API (free, high quality, requires attribution)
   - Pexels API (free, curated collections)
   - Pixabay (CC0, no attribution required)

2. **AI-Generated Images** (for diversity/consistency):
   - Midjourney or Stable Diffusion
   - Pros: Full control over style attributes, consistent aesthetic
   - Cons: Requires prompt engineering, may need subscription

3. **Manual Curation** (recommended for MVP):
   - Download 50-100 images covering 8-10 styles
   - Manually tag with metadata
   - Store locally in `/public/images/`
   - Faster than API integration, no rate limits

**Alternatives Considered**:
- **Remote API (Unsplash/Pexels)**: Rejected for MVP - adds network dependency, rate limits, inconsistent availability
- **Flat Directory**: Rejected - doesn't scale, hard to manage metadata
- **Database Storage**: Rejected - no backend, overkill for static image paths

**Best Practices**:
- Use WebP format with JPEG fallback (better compression)
- Create thumbnails (e.g., 400px wide) for faster loading in pairs
- Optimize images: max 1920px width, 80% JPEG quality
- Include descriptive alt text for accessibility
- Use responsive images (`srcset`) for different screen sizes

---

### 7. Deployment Strategy (No Docker)

**Decision**: Static hosting on Netlify (recommended) or Vercel

**Rationale**:
- Zero infrastructure management (no Docker, no servers)
- Free tier sufficient for personal use
- Automatic HTTPS, global CDN
- Git-based deployment (push to GitHub → auto-deploy)
- Simple rollback (one click)

**Deployment Process**:
```bash
# 1. Build production assets
npm run build  # Creates /dist folder with optimized bundle

# 2. Deploy to Netlify (one-time setup)
# - Connect GitHub repo in Netlify dashboard
# - Set build command: npm run build
# - Set publish directory: dist
# - Every git push auto-deploys

# OR manual deploy (no git integration)
npx netlify-cli deploy --prod --dir=dist
```

**Alternatives Considered**:
- **GitHub Pages**: Good option, but requires repository to be public (Netlify supports private repos)
- **Vercel**: Equally good, similar features to Netlify, slightly more complex pricing tiers
- **AWS S3 + CloudFront**: Rejected - requires AWS account setup, more complex configuration
- **Self-hosted Apache/Nginx**: Rejected - violates "no Docker, no complexity" requirement
- **Firebase Hosting**: Good option, but requires Google account and SDK setup

**Best Practices**:
- Use environment variables for any configuration (loaded at build time via Vite)
- Enable automatic minification and compression in build
- Set cache headers for static assets (images cached 1 year, HTML no-cache)
- Monitor usage via hosting platform analytics (no need for Google Analytics)
- Test build locally before deploying: `npm run preview`

---

## Summary of Technical Stack

| Component | Choice | Why |
|-----------|--------|-----|
| **Framework** | Vite + Vanilla JS | Fast dev, zero config, minimal bundle |
| **UI Components** | Vanilla JS (or Preact if needed) | No framework overhead, full control |
| **Styling** | CSS3 + Custom Properties | Modern, no preprocessor needed |
| **Storage** | localStorage | Simple API, sufficient capacity |
| **Images** | Static files + JSON manifest | Easy management, no API dependencies |
| **Testing** | Vitest + Playwright | Native Vite integration, E2E coverage |
| **Keyboard Nav** | Custom event handlers | Full control, WCAG 2.1 AA compliant |
| **Deployment** | Netlify | Free, no Docker, auto-deploy |
| **Recommendation** | Weighted scoring algorithm | Simple, fast, transparent |
| **Bundle Size** | < 100KB gzipped | Fast load, meets performance goals |

---

## Next Steps

All technical unknowns resolved. Proceed to:
- **Phase 1**: Generate data-model.md, contracts/, quickstart.md
- **Phase 2**: Generate tasks.md (via `/speckit.tasks` command)

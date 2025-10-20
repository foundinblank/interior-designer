# Interior Style Discovery App

A Typeform-style interactive web application that helps users discover their interior design style through binary choices. Users compare pairs of living room images, explain their preferences, and receive personalized style recommendations powered by an intelligent recommendation engine with optional LLM analysis.

## Features

- 🎨 **Binary Choice Discovery**: Compare pairs of living room images to discover your style
- 💬 **Explanation-Based Learning**: Explain your preferences to refine recommendations
- 🤖 **LLM-Powered Analysis**: Optional Claude API integration for enhanced preference understanding
- ⌨️ **Full Keyboard Navigation**: Complete keyboard accessibility (Tab, Enter, A/B keys, Shift+Enter)
- 📊 **Progress Tracking**: Visual progress bar with estimated rounds remaining
- 🎯 **Smart Recommendations**: Confidence-based algorithm shows results when ready (6-15 rounds)
- ♿ **Accessibility First**: WCAG 2.1 AA compliant with ARIA labels, focus indicators, and reduced motion support
- 🚀 **Zero Dependencies**: Vanilla JavaScript, no frameworks, <100KB bundle

## Quick Start

### Prerequisites

- Node.js 18+ (for development tooling only)
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd interior-designer

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run unit/integration tests
npm run test:e2e     # Run E2E tests (requires dev server)
npm run lint         # Lint code
```

## Project Structure

```
src/
├── components/          # UI components (modals, settings)
├── services/            # Core services (session, recommendations, LLM)
├── lib/                 # Utilities (validators, UUID, storage)
├── data/                # Static data (styles, images)
├── styles/              # CSS (global, typography, keyboard, typeform)
└── main.js              # Application entry point

tests/
├── unit/                # Unit tests (Vitest)
├── integration/         # Integration tests
└── e2e/                 # End-to-end tests (Playwright)
```

## Configuration

### Optional: LLM Analysis

To enable enhanced preference analysis with Claude AI:

1. Click the settings icon (⚙️) in the top-left corner
2. Enter your Anthropic API key
3. The app will use Claude Haiku for analysis, falling back to keyword extraction if unavailable

**Note**: The app works perfectly fine without an API key using keyword extraction.

### Image Assets

Images are stored in `public/images/living-rooms/` organized by style:
- modern/
- traditional/
- minimalist/
- bohemian/
- industrial/
- scandinavian/

See `src/data/images.json` for image metadata and alt text.

## Testing

### Unit Tests (Vitest)

```bash
npm test                                    # Run all tests
npm test tests/unit/validators.test.js     # Run specific test
npm test -- --watch                         # Watch mode
```

### E2E Tests (Playwright)

```bash
npm run test:e2e                            # Run all E2E tests
npm run test:e2e -- --headed               # Run with browser visible
```

## Deployment

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory. Deploy to any static hosting service:

- **Netlify**: Drag and drop `dist/` folder
- **Vercel**: `vercel deploy`
- **GitHub Pages**: Push `dist/` to gh-pages branch
- **Cloudflare Pages**: Connect repository

### Performance

- Bundle size: <100KB gzipped
- First Contentful Paint: <1.5s
- Image loading: <2s for 95% of requests
- No backend required

## Architecture

- **Tech Stack**: Vanilla JavaScript (ES2022+), Vite, Vitest, Playwright
- **Storage**: Browser localStorage (ephemeral, 24-hour sessions)
- **Recommendation Engine**: Client-side algorithm using style scores and keyword extraction
- **Optional LLM**: Anthropic Claude API (Haiku model) for enhanced analysis
- **Deployment**: Static hosting (no server needed)

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Navigate between elements |
| `A` | Select image A |
| `B` | Select image B |
| `Enter` | Submit/Confirm |
| `Shift+Enter` | Submit explanation (while typing) |
| `Escape` | Cancel/Go back |

## Accessibility

- ✅ WCAG 2.1 AA compliant
- ✅ Full keyboard navigation
- ✅ ARIA labels and live regions
- ✅ Focus indicators (3px solid, 4px offset)
- ✅ Color contrast ratios (4.5:1 normal, 3:1 large text)
- ✅ Screen reader support
- ✅ Reduced motion support
- ✅ High contrast mode support

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

[License information here]

## Contributing

[Contributing guidelines here]

## Support

For issues, questions, or feedback:
- Open an issue on GitHub
- Email: [contact email]

---

🤖 Built with [Speckit](https://github.com/specify/speckit) development workflow

# Quickstart Guide: Interior Style Discovery App

**Date**: 2025-10-14
**For**: Non-technical users
**Estimated Time**: 15 minutes setup

This guide will help you get the Interior Style Discovery app running on your computer with **no Docker** and minimal complexity.

---

## Prerequisites

You only need **one thing** installed:

### Node.js (version 18 or higher)

**Check if you already have it:**
```bash
node --version
```

If you see `v18.0.0` or higher, you're good! Skip to [Project Setup](#project-setup).

**If you don't have it, install it:**

1. Go to https://nodejs.org/
2. Download the **LTS version** (left button, green)
3. Run the installer (just click "Next" on everything)
4. Restart your terminal/command prompt
5. Verify: `node --version` should now work

---

## Project Setup

### Step 1: Get the Code

```bash
# Navigate to where you want the project
cd ~/Documents  # or wherever you keep projects

# Clone the repository (or download and unzip)
git clone <your-repo-url>
cd interior-designer
```

### Step 2: Install Dependencies

This downloads the 5 small tools we need (Vite, Vitest, Playwright, ESLint, Prettier):

```bash
npm install
```

**Wait 1-2 minutes**. You'll see a progress bar. When it finishes, you'll see:

```
added 47 packages in 1.2s
```

That's it! Dependencies installed.

### Step 3: Run the Development Server

```bash
npm run dev
```

You'll see:

```
  VITE v5.0.0  ready in 350 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.10:5173/
```

**Open your browser** and go to: `http://localhost:5173/`

🎉 **The app is now running!**

---

## What You'll See

### First Screen (Discovery Phase)
- Two living room images side-by-side
- Labels "A" and "B" above each image
- You can click on an image OR press `A` or `B` on your keyboard

### After Selecting
- A text box appears: "Why did you choose [A/B]?"
- Type at least 10 characters (e.g., "I like the colors")
- Press `Enter` or click "Next"

### Progress Through Rounds
- Each round shows a new pair of images
- Round counter shows "Round 5" or "About 3-5 more rounds"
- After 6-15 rounds, you'll get recommendations

### Recommendations Screen
- 10 images of your matched style (e.g., "Modern")
- Button: "Yes, this is my style!"
- Button: "Not quite" (shows alternatives or restart)

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `A` or `a` | Select image A |
| `B` or `b` | Select image B |
| `Tab` | Move to next field |
| `Shift + Tab` | Move to previous field |
| `Enter` | Submit/Continue |
| `Escape` | Cancel/Go back |

**Full keyboard navigation** - you never need a mouse!

---

## Adding Your Own Images

### Step 1: Organize Images by Style

Put images in `public/images/living-rooms/`:

```
public/images/living-rooms/
├── modern/
│   ├── modern-001.jpg
│   ├── modern-002.jpg
│   └── modern-003.jpg
├── traditional/
│   ├── trad-001.jpg
│   └── trad-002.jpg
└── minimalist/
    └── min-001.jpg
```

**Requirements:**
- JPEG or WebP format
- Max 1920px width (optimize first!)
- Descriptive filenames (no spaces)

### Step 2: Update Image Metadata

Edit `src/data/images.json`:

```json
{
  "images": [
    {
      "id": "modern-001",
      "url": "/images/living-rooms/modern/modern-001.jpg",
      "thumbnail": "/images/living-rooms/modern/modern-001-thumb.jpg",
      "primaryStyle": "modern",
      "secondaryStyles": ["minimalist"],
      "colors": ["gray", "white", "neutral"],
      "furniture": ["sectional-sofa", "coffee-table"],
      "lighting": ["natural", "recessed"],
      "attributes": ["open-space", "clean-lines"],
      "alt": "Modern living room with gray sectional sofa"
    }
  ]
}
```

**Copy this template for each image** and fill in the details.

### Step 3: Restart Dev Server

```bash
# Press Ctrl+C to stop the server
# Then restart:
npm run dev
```

Refresh your browser - new images appear!

---

## Testing Your Changes

### Run Automated Tests

```bash
# Unit tests (fast, checks logic)
npm run test

# End-to-end tests (slower, simulates real user)
npm run test:e2e
```

### Manual Testing Checklist

- [ ] Load homepage - two images appear
- [ ] Click/press `A` or `B` - explanation box appears
- [ ] Type short text (< 10 chars) - error message shows
- [ ] Type long text (≥ 10 chars) - advances to next round
- [ ] Complete 6-15 rounds - recommendations appear
- [ ] Click "Not quite" - alternatives or restart options show
- [ ] Refresh page mid-session - progress is saved
- [ ] Wait 24+ hours - session clears on next visit

---

## Deploying to the Internet (No Docker!)

### Option 1: Netlify (Recommended - Easiest)

1. **Build production files:**
   ```bash
   npm run build
   ```
   This creates a `dist/` folder with optimized files.

2. **Sign up at Netlify:**
   - Go to https://www.netlify.com/
   - Click "Sign up" (free account)

3. **Deploy:**
   - Drag the `dist/` folder onto Netlify's dashboard
   - OR connect your GitHub repo:
     - Click "New site from Git"
     - Connect GitHub
     - Select repository
     - Build command: `npm run build`
     - Publish directory: `dist`
     - Click "Deploy site"

4. **Done!**
   - Netlify gives you a URL: `https://your-app-name.netlify.app`
   - Every time you push to GitHub, it auto-deploys
   - Free HTTPS, global CDN included

### Option 2: Vercel (Similar to Netlify)

1. Build: `npm run build`
2. Go to https://vercel.com/
3. Sign up, connect GitHub repo
4. Deploy button → done

### Option 3: GitHub Pages (Free, Simple)

1. Build: `npm run build`
2. Install GitHub Pages deployer:
   ```bash
   npm install --save-dev gh-pages
   ```
3. Add to `package.json`:
   ```json
   "scripts": {
     "deploy": "gh-pages -d dist"
   }
   ```
4. Run: `npm run deploy`
5. Enable GitHub Pages in repo settings
6. Your URL: `https://<username>.github.io/<repo-name>`

**No servers, no Docker, no complexity!**

---

## Troubleshooting

### Problem: "npm: command not found"
**Solution**: Node.js isn't installed or not in PATH.
- Reinstall Node.js from https://nodejs.org/
- Restart terminal after installing

### Problem: "Port 5173 already in use"
**Solution**: Another app is using that port.
```bash
# Kill the process on port 5173 (macOS/Linux):
lsof -ti:5173 | xargs kill

# Or change the port in vite.config.js:
export default {
  server: { port: 3000 }
}
```

### Problem: Images don't load
**Solution**: Check file paths.
- Images must be in `public/images/`
- Paths in `images.json` must start with `/images/`
- Check browser console (F12) for 404 errors

### Problem: "Module not found" errors
**Solution**: Dependencies missing.
```bash
rm -rf node_modules package-lock.json
npm install
```

### Problem: Changes don't appear
**Solution**: Hard refresh browser.
- Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear cache in browser settings

### Problem: Tests fail
**Solution**: Check test output for specifics.
```bash
# Run tests with detailed output:
npm run test -- --reporter=verbose

# Run single test file:
npm run test -- tests/unit/validators.test.js
```

---

## Project Structure Quick Reference

```
interior-designer/
├── src/                    # Your code goes here
│   ├── index.html         # Main HTML file
│   ├── main.js            # App entry point
│   ├── components/        # UI components
│   ├── services/          # Logic (session, images, etc.)
│   ├── data/              # Image metadata JSON files
│   └── styles/            # CSS files
├── public/                # Static assets (images)
│   └── images/            # Living room photos
├── tests/                 # Automated tests
├── package.json           # Dependencies and scripts
└── vite.config.js         # Build tool config
```

**What to edit:**
- Add images → `public/images/` + `src/data/images.json`
- Change styles → `src/styles/`
- Modify UI → `src/components/`
- Update logic → `src/services/`

**What NOT to touch:**
- `node_modules/` (auto-generated)
- `dist/` (auto-generated build output)
- `package-lock.json` (auto-generated)

---

## Development Workflow

### Typical Day-to-Day

1. **Start dev server** (once per session):
   ```bash
   npm run dev
   ```

2. **Make changes** in `src/` folder
   - Save file → browser auto-refreshes (Hot Module Reload)
   - No need to restart server!

3. **Test changes**:
   - Manual: Check in browser
   - Automated: `npm run test`

4. **Commit when ready**:
   ```bash
   git add .
   git commit -m "Add new minimalist images"
   git push
   ```

5. **Auto-deploy** (if connected to Netlify/Vercel)
   - Push to GitHub → site updates in ~1 minute

### Before Deploying Big Changes

```bash
# 1. Run all tests
npm run test
npm run test:e2e

# 2. Check code quality
npm run lint

# 3. Build production version
npm run build

# 4. Preview production build locally
npm run preview
# Opens at http://localhost:4173

# 5. If looks good, deploy!
```

---

## Getting Help

### Resources
- **Vite docs**: https://vitejs.dev/guide/
- **JavaScript tutorial**: https://javascript.info/
- **CSS reference**: https://developer.mozilla.org/en-US/docs/Web/CSS

### Common Questions

**Q: Do I need to know React?**
A: No! This uses vanilla JavaScript. Much simpler.

**Q: Can I use TypeScript?**
A: Yes, but not required. Vite supports `.ts` files if you want.

**Q: How do I change the recommendation algorithm?**
A: Edit `src/services/recommendationEngine.js`. See `research.md` for algorithm details.

**Q: Can I add more styles beyond the 6 default?**
A: Yes! Add to `src/data/styles.json`, then tag images accordingly.

**Q: Is user data tracked/saved?**
A: No. Everything is local (browser localStorage), cleared after 24 hours.

---

## Next Steps

Once you're comfortable:

1. **Customize styles**: Edit `src/styles/global.css` to change colors, fonts
2. **Add more images**: Follow "Adding Your Own Images" above
3. **Tweak algorithm**: Adjust weights in `recommendationEngine.js`
4. **Deploy online**: Follow Netlify/Vercel instructions above
5. **Share with friends**: Get feedback, iterate!

**You're all set!** 🎉

Questions? See `plan.md` for technical details or `spec.md` for requirements.

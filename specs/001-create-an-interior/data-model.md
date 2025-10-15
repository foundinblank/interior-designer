# Data Model: Interior Style Discovery App

**Date**: 2025-10-14
**Feature**: Interior Style Discovery App
**Plan**: [plan.md](./plan.md)

## Overview

This document defines the data structures used throughout the application. All data is stored client-side in browser localStorage and is ephemeral (cleared after 24 hours or browser close).

---

## Entities

### 1. Session

Represents a single user's discovery journey from start to recommendations.

**Lifecycle**: Created on app load (if no valid session exists) → Updated after each round → Cleared after 24 hours or user restart

**Storage Location**: `localStorage` key: `interiorDesignSession`

**Schema**:
```typescript
interface Session {
  id: string;                    // UUID v4, unique session identifier
  startTime: number;             // Unix timestamp (milliseconds) when session created
  currentRound: number;          // Current round number (1-based, max 15)
  phase: 'discovery' | 'recommendations' | 'alternatives' | 'complete';
  choices: Choice[];             // Array of user choices, one per completed round
  styleScores: Record<string, number>;  // Map of style → confidence score (0-1)
  recommendedStyle: string | null;      // Top style identified (e.g., "modern")
  secondBestStyle: string | null;       // Second-best style for alternatives
  isValid: boolean;              // True if session age < 24 hours
}
```

**Validation Rules**:
- `id`: Must be valid UUID v4 format
- `startTime`: Must be valid Unix timestamp
- `currentRound`: Must be between 1 and 15 (inclusive)
- `phase`: Must be one of the four allowed values
- `choices`: Must have length equal to `currentRound - 1` (one less than current)
- `styleScores`: All values must be between 0 and 1
- `isValid`: Calculated field: `Date.now() - startTime < 24 * 60 * 60 * 1000`

**State Transitions**:
```
null (no session) → discovery (round 1)
discovery (rounds 1-N) → recommendations (when confidence threshold met)
recommendations → complete (user confirms style)
recommendations → alternatives (user rejects style)
alternatives → complete (user confirms alternative)
alternatives → discovery (user restarts)
complete → null (session cleanup)
```

---

### 2. Choice

Represents a single binary choice made by the user in a round.

**Lifecycle**: Created when user submits explanation → Added to Session.choices array → Never modified

**Schema**:
```typescript
interface Choice {
  round: number;                 // Round number (1-based)
  selectedImageId: string;       // ID of chosen image (e.g., "modern-001")
  rejectedImageId: string;       // ID of non-chosen image
  selectedImageStyles: string[]; // Style tags of selected image (copied from Image)
  explanation: string;           // User's typed explanation (min 10 chars)
  keywords: string[];            // Extracted design keywords from explanation
  timestamp: number;             // Unix timestamp when choice submitted
}
```

**Validation Rules**:
- `round`: Must match parent Session's `currentRound` when created
- `selectedImageId`: Must exist in images.json
- `rejectedImageId`: Must exist in images.json, must differ from `selectedImageId`
- `selectedImageStyles`: Must be non-empty array of strings
- `explanation`: Minimum 10 characters, maximum 500 characters
- `keywords`: Array of lowercase strings extracted from explanation
- `timestamp`: Must be valid Unix timestamp, must be >= Session.startTime

**Keyword Extraction Logic**:
```javascript
const DESIGN_KEYWORDS = [
  'color', 'bright', 'dark', 'neutral', 'vibrant',
  'style', 'modern', 'traditional', 'minimalist', 'cozy',
  'furniture', 'sofa', 'table', 'chair', 'lighting',
  'space', 'open', 'compact', 'airy', 'cluttered',
  'texture', 'wood', 'metal', 'fabric', 'glass'
];

function extractKeywords(explanation) {
  const words = explanation.toLowerCase().split(/\s+/);
  return words.filter(word => DESIGN_KEYWORDS.includes(word));
}
```

---

### 3. Image

Represents a living room image with associated metadata for recommendation matching.

**Lifecycle**: Static data loaded once at app initialization from `src/data/images.json`

**Storage Location**: In-memory JavaScript object (not in localStorage)

**Schema**:
```typescript
interface Image {
  id: string;                    // Unique identifier (e.g., "modern-001")
  url: string;                   // Full image path (e.g., "/images/living-rooms/modern/modern-001.jpg")
  thumbnail: string;             // Thumbnail path for faster loading (400px width)
  primaryStyle: string;          // Main style category (e.g., "modern")
  secondaryStyles: string[];     // Additional style tags (e.g., ["minimalist", "scandinavian"])
  colors: string[];              // Color palette tags (e.g., ["neutral", "gray", "white"])
  furniture: string[];           // Furniture types (e.g., ["sectional-sofa", "coffee-table"])
  lighting: string[];            // Lighting characteristics (e.g., ["natural", "recessed"])
  attributes: string[];          // Other attributes (e.g., ["open-space", "clean-lines"])
  alt: string;                   // Accessibility alt text
  loadStatus: 'pending' | 'loading' | 'loaded' | 'error';  // Runtime loading state
  retryCount: number;            // Number of retry attempts (runtime, not persisted)
}
```

**Validation Rules**:
- `id`: Must be unique across all images, alphanumeric + hyphens only
- `url`: Must be valid relative path starting with `/images/`
- `thumbnail`: Must be valid relative path, must differ from `url`
- `primaryStyle`: Must match one of the predefined styles in styles.json
- `secondaryStyles`: Each must match a predefined style
- `colors`: Non-empty array of lowercase strings
- `furniture`: Array of lowercase hyphenated strings
- `lighting`: Array of lowercase strings
- `attributes`: Array of lowercase hyphenated strings
- `alt`: Non-empty string, descriptive (not "image" or "photo")
- `loadStatus`: Runtime only, always starts as 'pending'
- `retryCount`: Runtime only, always starts as 0

**Relationships**:
- Each Choice references two Images via `selectedImageId` and `rejectedImageId`
- RecommendationSet contains 10 Images filtered by style match

---

### 4. Style

Represents a decorative style category with metadata for display and matching.

**Lifecycle**: Static data loaded once at app initialization from `src/data/styles.json`

**Storage Location**: In-memory JavaScript object (not in localStorage)

**Schema**:
```typescript
interface Style {
  id: string;                    // Unique identifier (e.g., "modern")
  displayName: string;           // Human-readable name (e.g., "Modern")
  description: string;           // Brief style description for results screen
  keywords: string[];            // Synonyms and related terms for keyword matching
  relatedStyles: string[];       // IDs of similar styles (for alternatives)
  imageCount: number;            // Number of images tagged with this primary style
}
```

**Validation Rules**:
- `id`: Must be unique, lowercase, no spaces
- `displayName`: Non-empty string, title case
- `description`: 1-2 sentences, max 200 characters
- `keywords`: Non-empty array of lowercase strings
- `relatedStyles`: Each must be a valid style `id`
- `imageCount`: Positive integer, calculated from images.json

**Predefined Styles** (MVP):
```json
[
  {
    "id": "modern",
    "displayName": "Modern",
    "description": "Clean lines, neutral colors, and minimalist decor define modern style.",
    "keywords": ["contemporary", "sleek", "simple", "geometric"],
    "relatedStyles": ["minimalist", "scandinavian"],
    "imageCount": 12
  },
  {
    "id": "traditional",
    "displayName": "Traditional",
    "description": "Classic furniture, rich colors, and ornate details create a timeless look.",
    "keywords": ["classic", "elegant", "formal", "ornate"],
    "relatedStyles": ["transitional"],
    "imageCount": 10
  },
  {
    "id": "minimalist",
    "displayName": "Minimalist",
    "description": "Less is more with sparse furnishings and a focus on function over form.",
    "keywords": ["simple", "sparse", "clean", "zen"],
    "relatedStyles": ["modern", "scandinavian"],
    "imageCount": 8
  },
  {
    "id": "bohemian",
    "displayName": "Bohemian",
    "description": "Eclectic mix of colors, patterns, and global-inspired decor.",
    "keywords": ["boho", "eclectic", "colorful", "layered"],
    "relatedStyles": ["eclectic"],
    "imageCount": 7
  },
  {
    "id": "industrial",
    "displayName": "Industrial",
    "description": "Exposed materials, metal accents, and raw finishes create urban edge.",
    "keywords": ["urban", "loft", "raw", "metal"],
    "relatedStyles": ["modern"],
    "imageCount": 6
  },
  {
    "id": "scandinavian",
    "displayName": "Scandinavian",
    "description": "Light woods, white walls, and cozy textiles embody Nordic simplicity.",
    "keywords": ["nordic", "hygge", "light", "cozy"],
    "relatedStyles": ["minimalist", "modern"],
    "imageCount": 9
  }
]
```

---

### 5. RecommendationSet

Represents the final 10 images shown to the user for style confirmation.

**Lifecycle**: Created when Session transitions to 'recommendations' phase → Displayed to user → Discarded if user restarts

**Storage Location**: Not persisted; generated on-demand from images.json + Session.recommendedStyle

**Schema**:
```typescript
interface RecommendationSet {
  styleId: string;               // The recommended style (e.g., "modern")
  styleName: string;             // Display name (e.g., "Modern")
  description: string;           // Style description from styles.json
  images: Image[];               // Exactly 10 images matching the style
  confidence: number;            // Confidence score 0-1 (from Session.styleScores)
  generatedAt: number;           // Unix timestamp when set was generated
}
```

**Generation Rules**:
1. Filter images where `primaryStyle === styleId` OR `secondaryStyles.includes(styleId)`
2. Exclude images already shown during discovery phase (check Session.choices)
3. Sort by style tag overlap with user's top choices
4. Select top 10 images (or all if fewer than 10 available)
5. Shuffle to avoid pattern bias

**Validation Rules**:
- `styleId`: Must be valid style ID from styles.json
- `styleName`: Must match styles.json `displayName` for `styleId`
- `description`: Must match styles.json `description` for `styleId`
- `images`: Must contain exactly 10 Image objects (or fewer if insufficient images exist)
- `confidence`: Must be between 0 and 1
- `generatedAt`: Must be valid Unix timestamp

---

## Data Flow Diagram

```
┌──────────────┐
│ App Load     │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Load images.json     │ ──→ [Image[]] in memory
│ Load styles.json     │ ──→ [Style[]] in memory
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│ Check localStorage   │
└──────┬───────────────┘
       │
       ▼
   ┌───────┐
   │Session│ exists?
   └───┬───┘
       │
  ┌────┴────┐
  │Yes      │No
  │         │
  ▼         ▼
[Valid?]  [Create new Session]
  │
  ├─Yes──→ [Resume session]
  │
  └─No───→ [Clear localStorage, create new]
           │
           ▼
      ┌──────────────┐
      │Discovery Loop│
      └──────┬───────┘
             │
             ▼
      ┌────────────────────┐
      │1. Show ImagePair   │
      │2. User selects A/B │
      │3. User explains    │
      │4. Create Choice    │
      │5. Update Session   │
      │6. Calculate scores │
      └────────┬───────────┘
               │
               ▼
         [Confidence met?]
               │
      ┌────────┴────────┐
      │No (< threshold) │Yes (≥ threshold)
      │Continue rounds  │
      │                 │
      └────┬───────     │
           │            ▼
           │      ┌──────────────────┐
           │      │Generate          │
           │      │RecommendationSet │
           └──────┤                  │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │Show 10 images   │
                  │Ask confirmation │
                  └────────┬────────┘
                           │
                  ┌────────┴────────┐
                  │User confirms?   │
                  └────────┬────────┘
                           │
              ┌────────────┴──────────────┐
              │Yes                        │No
              │                           │
              ▼                           ▼
      ┌─────────────┐           ┌───────────────────┐
      │Set phase:   │           │Show alternatives? │
      │'complete'   │           │or restart?        │
      └─────────────┘           └─────────┬─────────┘
                                          │
                              ┌───────────┴──────────┐
                              │Alt           │Restart │
                              │              │        │
                              ▼              ▼        │
                    [Generate set      [Clear       │
                     with 2nd best]     session]    │
                                        └────────────┘
```

---

## Storage Schema (localStorage)

**Key**: `interiorDesignSession`

**Value** (JSON serialized):
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "startTime": 1697234567890,
  "currentRound": 5,
  "phase": "discovery",
  "choices": [
    {
      "round": 1,
      "selectedImageId": "modern-001",
      "rejectedImageId": "traditional-005",
      "selectedImageStyles": ["modern", "minimalist"],
      "explanation": "I prefer the clean lines and open space",
      "keywords": ["clean", "open", "space"],
      "timestamp": 1697234580000
    },
    {
      "round": 2,
      "selectedImageId": "scandinavian-003",
      "rejectedImageId": "bohemian-007",
      "selectedImageStyles": ["scandinavian", "minimalist"],
      "explanation": "The light colors and simple furniture feel calming",
      "keywords": ["light", "simple", "furniture"],
      "timestamp": 1697234620000
    }
  ],
  "styleScores": {
    "modern": 0.45,
    "scandinavian": 0.38,
    "minimalist": 0.67,
    "traditional": 0.10,
    "bohemian": 0.05,
    "industrial": 0.15
  },
  "recommendedStyle": null,
  "secondBestStyle": null,
  "isValid": true
}
```

**Size Estimate**: ~5-10KB for full 15-round session (well within localStorage 5MB limit)

---

## API Contracts Reference

See [contracts/recommendation-api.json](./contracts/recommendation-api.json) for detailed type definitions and validation schemas.

---

## Next Steps

Data model complete. Proceed to:
- Generate API contracts (contracts/ directory)
- Generate quickstart.md with setup instructions

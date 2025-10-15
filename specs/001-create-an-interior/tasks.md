# Implementation Tasks: Interior Style Discovery App

**Feature**: Interior Style Discovery App
**Branch**: `001-create-an-interior`
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md) | **Data Model**: [data-model.md](./data-model.md)

**Total Tasks**: 100 (includes 2 success criteria validation tasks added in Phase 6)
**Test-First Approach**: ✅ Tests written before implementation (TDD per constitution)
**Independent Stories**: ✅ Each user story is independently testable and deliverable

---

## Implementation Strategy

### MVP Scope (Recommended First Delivery)
**User Story 1 (P1)** only - Binary Choice Discovery:
- Tasks T001-T043 (43 tasks)
- Delivers core value: Users can discover their style through binary choices
- Fully functional, testable, and deployable
- Estimated effort: 2-3 weeks for solo developer

### Incremental Delivery Order
1. **Phase 1**: Setup & Configuration (T001-T008)
2. **Phase 2**: Foundational Services (T009-T016)
3. **Phase 3**: User Story 1 - Binary Choice Discovery (T017-T043) ← **MVP HERE**
4. **Phase 4**: User Story 2 - Style Confirmation (T044-T065)
5. **Phase 5**: User Story 3 - Mid-Session Progress (T066-T078)
6. **Phase 6**: Polish & Cross-Cutting (T079-T098)

### Parallel Execution Opportunities
Tasks marked `[P]` can run in parallel within their phase (different files, no dependencies on incomplete tasks).

---

## Phase 1: Setup & Configuration

**Goal**: Initialize project with minimal dependencies and verify build/test infrastructure

- [x] T001 Initialize Node.js project with package.json
- [x] T002 [P] Install Vite as dev dependency in package.json
- [x] T003 [P] Install Vitest as test dependency in package.json
- [x] T004 [P] Install Playwright as E2E test dependency in package.json
- [x] T005 [P] Install ESLint and Prettier as dev dependencies in package.json
- [x] T006 Create vite.config.js with ES2022 target and absolute import paths
- [x] T007 Create vitest.config.js with test environment configuration
- [x] T008 Create playwright.config.js with keyboard navigation test configuration

**Parallel Execution Example** (Phase 1):
```bash
# Run these 3 npm installs simultaneously
npm install vite --save-dev &
npm install vitest --save-dev &
npm install playwright --save-dev &
wait
```

---

## Phase 2: Foundational Setup

**Goal**: Create project structure, static data, and core utilities needed by all user stories

- [x] T009 Create src/ directory structure per plan.md (components/, services/, data/, lib/, styles/)
- [x] T010 Create public/images/living-rooms/ directory structure (modern/, traditional/, minimalist/, bohemian/, industrial/, scandinavian/)
- [x] T011 Create tests/ directory structure (unit/, integration/, e2e/)
- [x] T012 [P] Create src/data/styles.json with 6 predefined styles from data-model.md
- [x] T013 [P] Create src/data/images.json template (empty array, ready for image metadata)
- [x] T014 [P] Create .eslintrc.json with ES2022 config and accessibility rules
- [x] T015 [P] Create src/styles/global.css with CSS custom properties and base styles
- [x] T016 [P] Create src/styles/keyboard.css with focus indicators (3px solid, 4px offset per research.md)

**Parallel Execution Example** (Phase 2):
```bash
# Create static data files simultaneously
touch src/data/styles.json src/data/images.json .eslintrc.json &
touch src/styles/global.css src/styles/keyboard.css &
wait
```

**Blocking**: All Phase 3+ tasks depend on Phase 2 completion

---

## Phase 3: User Story 1 - Binary Choice Discovery (P1 - MVP)

**Story Goal**: Users can launch app, make binary choices with explanations, and receive style recommendations

**Independent Test Criteria**: Launch app → Make 6-15 binary choices → Verify style recommendation appears

### Test Tasks (Write First per TDD)

- [x] T017 [P] [US1] Write unit test for validators.js (10-char minimum validation) in tests/unit/validators.test.js
- [x] T018 [P] [US1] Write unit test for sessionManager.js (create, load, save, validate session) in tests/unit/sessionManager.test.js
- [x] T019 [P] [US1] Write unit test for imageLoader.js (retry logic, exponential backoff) in tests/unit/imageLoader.test.js
- [x] T020 [P] [US1] Write unit test for recommendationEngine.js (calculateStyleScores, isConfident, getTopStyles) in tests/unit/recommendationEngine.test.js
- [x] T021 [US1] Write integration test for discovery flow (full choice→explanation→next round) in tests/integration/discovery-flow.test.js
- [x] T022 [US1] Write E2E test for keyboard navigation (Tab, Enter, A/B keys, Escape) in tests/e2e/keyboard-navigation.spec.js

**Run Tests (should fail - Red phase)**:
```bash
npm run test        # Unit tests fail (files don't exist yet)
npm run test:e2e    # E2E tests fail (app doesn't exist yet)
```

### Implementation Tasks (Make Tests Pass - Green phase)

#### Core Services Layer

- [x] T023 [P] [US1] Implement src/lib/validators.js with validateExplanation(text) function
- [x] T024 [P] [US1] Implement src/services/sessionManager.js with createSession(), loadSession(), saveSession(), isSessionValid()
- [x] T025 [P] [US1] Implement src/services/imageLoader.js with loadImage(url, maxRetries=3) and exponential backoff
- [x] T026 [US1] Implement src/services/recommendationEngine.js with calculateStyleScores(choices), isConfidentRecommendation(), getTopStyles()

**Run Tests (should start passing)**:
```bash
npm run test -- tests/unit/  # Unit tests should pass now
```

#### Data Layer

- [x] T027 [P] [US1] Create UUID utility function in src/lib/utils.js for session IDs
- [x] T028 [US1] Add extractKeywords(explanation) to recommendationEngine.js per data-model.md

#### UI Components Layer

- [x] T029 [P] [US1] Create src/index.html with semantic HTML structure and keyboard-accessible markup
- [x] T030 [P] [US1] Implement src/components/ImagePair.js with A/B image display and selection handling
- [x] T031 [P] [US1] Implement src/components/ExplanationForm.js with 10-char validation and error display
- [x] T032 [P] [US1] Implement src/components/PlaceholderImage.js with retry button
- [x] T033 [US1] Create src/lib/router.js with hash-based routing for discovery/recommendations phases
- [x] T034 [US1] Create src/services/keyboardNav.js with keyboard event handlers (A/B selection, Tab, Enter, Escape)

#### Styling Layer

- [x] T035 [P] [US1] Create src/styles/typography.css with heading/body text hierarchy
- [x] T036 [P] [US1] Implement side-by-side image layout styles in src/components/ImagePair.css
- [x] T037 [P] [US1] Implement form styles with validation feedback in src/components/ExplanationForm.css
- [x] T038 [P] [US1] Implement placeholder styles with retry button in src/components/PlaceholderImage.css

#### Integration & Entry Point

- [x] T039 [US1] Implement src/main.js as application entry point (load data, initialize session, mount components)
- [x] T040 [US1] Wire ImagePair component to session manager (record choices)
- [x] T041 [US1] Wire ExplanationForm component to validators and session manager
- [x] T042 [US1] Wire recommendation engine to trigger phase transition when confidence threshold met

**Run All Tests (should fully pass - Green phase complete)**:
```bash
npm run test            # All unit + integration tests pass
npm run test:e2e        # Keyboard navigation E2E test passes
```

#### Sample Images (MVP Minimum)

- [x] T043 [US1] Add 12 sample living room images (2 per style: modern, traditional, minimalist, bohemian, industrial, scandinavian) using Unsplash and populate src/data/images.json

**User Story 1 Complete** ✅ - Independent test passes: User can discover style through binary choices

**Parallel Execution Example** (US1 Components):
```bash
# Create all component files simultaneously
touch src/components/ImagePair.js src/components/ExplanationForm.js src/components/PlaceholderImage.js &
touch src/components/ImagePair.css src/components/ExplanationForm.css src/components/PlaceholderImage.css &
wait
```

---

## Phase 4: User Story 2 - Style Confirmation (P2)

**Story Goal**: After discovery, show 10 style recommendations with confirm/reject options

**Independent Test Criteria**: Complete discovery phase (can simulate) → Verify 10 images shown → Test confirm/reject flows

**Dependencies**: Requires US1 (T017-T043) complete

### Test Tasks (Write First)

- [ ] T044 [P] [US2] Write unit test for generateRecommendationSet() in tests/unit/recommendationEngine.test.js
- [ ] T045 [US2] Write integration test for recommendation display (10 images, style consistency) in tests/integration/recommendation-flow.test.js
- [ ] T046 [US2] Write E2E test for confirm/reject flows in tests/e2e/recommendation-confirm.spec.js

**Run Tests (should fail)**:
```bash
npm run test -- tests/unit/recommendationEngine.test.js  # New test fails
npm run test:e2e -- recommendation-confirm               # E2E fails
```

### Implementation Tasks

#### Recommendation Logic

- [ ] T047 [US2] Add generateRecommendationSet(styleId, excludeImageIds, count=10) to src/services/recommendationEngine.js
- [ ] T048 [US2] Add getSecondBestStyle() method to recommendationEngine.js for alternatives

#### UI Components

- [ ] T049 [P] [US2] Implement src/components/RecommendationGrid.js with 10-image grid layout
- [ ] T050 [P] [US2] Implement src/components/ConfirmationPrompt.js with "Are we on the right track?" UI
- [ ] T051 [P] [US2] Implement src/components/RejectionOptions.js with "View Alternatives" and "Restart" buttons
- [ ] T052 [P] [US2] Implement src/components/SuccessMessage.js for style match confirmation

#### Styling

- [ ] T053 [P] [US2] Create src/components/RecommendationGrid.css with responsive grid (2-3 columns)
- [ ] T054 [P] [US2] Create src/components/ConfirmationPrompt.css with clear button hierarchy
- [ ] T055 [P] [US2] Create src/components/RejectionOptions.css with dual-action layout

#### Phase Management

- [ ] T056 [US2] Update src/lib/router.js to handle recommendations phase routing
- [ ] T057 [US2] Add phase transition logic to src/main.js (discovery → recommendations)
- [ ] T058 [US2] Wire ConfirmationPrompt "Yes" button to set session phase to 'complete'
- [ ] T059 [US2] Wire ConfirmationPrompt "Not quite" button to show RejectionOptions component

#### Alternative Styles Flow

- [ ] T060 [US2] Wire "View Alternatives" button to generate second-best style recommendations
- [ ] T061 [US2] Add alternative recommendations display logic to RecommendationGrid component
- [ ] T062 [US2] Update session.phase to 'alternatives' when viewing alternative styles

#### Restart Flow

- [ ] T063 [US2] Wire "Restart" button to sessionManager.clearSession()
- [ ] T064 [US2] Add restart confirmation modal to prevent accidental data loss
- [ ] T065 [US2] Update router to navigate back to discovery phase round 1 after restart

**Run All Tests (should pass)**:
```bash
npm run test            # All unit + integration tests pass
npm run test:e2e        # Confirmation flow E2E test passes
```

**User Story 2 Complete** ✅ - Independent test passes: User can confirm or reject style recommendations

**Parallel Execution Example** (US2 Components):
```bash
# Create all US2 component files simultaneously
touch src/components/RecommendationGrid.js src/components/ConfirmationPrompt.js &
touch src/components/RejectionOptions.js src/components/SuccessMessage.js &
touch src/components/RecommendationGrid.css src/components/ConfirmationPrompt.css &
wait
```

---

## Phase 5: User Story 3 - Mid-Session Progress (P3)

**Story Goal**: Display progress indicator with round number and estimated remaining rounds

**Independent Test Criteria**: Make choices → Verify round counter updates → Verify "About 3-5 more rounds" appears

**Dependencies**: Requires US1 (T017-T043) complete; does NOT require US2

### Test Tasks (Write First)

- [ ] T066 [P] [US3] Write unit test for calculateEstimatedRounds() in tests/unit/recommendationEngine.test.js
- [ ] T067 [US3] Write integration test for progress indicator updates in tests/integration/progress-indicator.test.js

**Run Tests (should fail)**:
```bash
npm run test -- progress-indicator  # New test fails
```

### Implementation Tasks

#### Progress Logic

- [ ] T068 [US3] Add calculateEstimatedRounds(session) to src/services/recommendationEngine.js
- [ ] T069 [US3] Add getProgressMessage(currentRound, estimatedRemaining) helper to recommendationEngine.js

#### UI Component

- [ ] T070 [P] [US3] Implement src/components/ProgressIndicator.js with round counter display
- [ ] T071 [P] [US3] Create src/components/ProgressIndicator.css with non-intrusive positioning
- [ ] T072 [US3] Add estimated rounds logic to ProgressIndicator component (shows after round 3)

#### Integration

- [ ] T073 [US3] Wire ProgressIndicator to session.currentRound in src/main.js
- [ ] T074 [US3] Update ProgressIndicator after each choice submission
- [ ] T075 [US3] Hide ProgressIndicator when session.phase !== 'discovery'

#### Accessibility

- [ ] T076 [P] [US3] Add ARIA live region to ProgressIndicator for screen reader announcements
- [ ] T077 [P] [US3] Ensure progress text has sufficient contrast (WCAG 2.1 AA: 4.5:1)

**Run All Tests (should pass)**:
```bash
npm run test            # All unit + integration tests pass
npm run test:e2e        # Progress display verified in full journey test
```

#### Visual Polish

- [ ] T078 [US3] Add smooth transition animation when progress text updates (CSS transition)

**User Story 3 Complete** ✅ - Independent test passes: Progress indicator displays and updates correctly

**Parallel Execution Example** (US3):
```bash
# US3 is small - can parallelize test writing with component implementation if desired
# (Not recommended for strict TDD, but possible after test spec is defined)
```

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Production readiness, performance optimization, final accessibility audit

### Performance Optimization

- [ ] T079 [P] Optimize images: Convert to WebP format with JPEG fallback
- [ ] T080 [P] Generate thumbnails (400px width) for all images in public/images/living-rooms/
- [ ] T081 [P] Add image lazy loading attributes to ImagePair component (<img loading="lazy">)
- [ ] T082 Implement preloading for next image pair while user types explanation
- [ ] T083 Verify bundle size <100KB gzipped (run npm run build and check dist/ size)
- [ ] T084 Measure First Contentful Paint <1.5s (run Lighthouse audit)
- [ ] T084a [P] Add completion time tracking to sessionManager.js for SC-001 validation (log startTime to endTime in localStorage)
- [ ] T084b [P] Add optional analytics event logging for SC-002, SC-003, SC-004, SC-006 (completion rate, confirmation rate, round count, explanation length) - post-MVP enhancement

### Accessibility Compliance

- [ ] T085 [P] Run Lighthouse accessibility audit and address all critical issues
- [ ] T086 [P] Verify all images have descriptive alt text in images.json
- [ ] T087 [P] Add skip-to-content link for keyboard-only users in src/index.html
- [ ] T088 [P] Verify color contrast meets WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text)
- [ ] T089 Verify focus indicators visible on all interactive elements (manual keyboard test)
- [ ] T090 Add prefers-reduced-motion media query to disable animations in keyboard.css

### Error Handling & Edge Cases

- [ ] T091 [P] Add localStorage unavailable fallback (in-memory session, warn user)
- [ ] T092 [P] Add error boundary for unhandled JavaScript errors (display friendly error message)
- [ ] T093 Handle zero-state: No images available (display error message and contact info)
- [ ] T094 Handle low confidence after 15 rounds (show best-guess recommendation with disclaimer)

### Documentation & Deployment

- [ ] T095 [P] Create README.md with quickstart instructions (reference quickstart.md)
- [ ] T096 [P] Create .gitignore with node_modules/, dist/, .env exclusions
- [ ] T097 Test production build: npm run build && npm run preview
- [ ] T098 Deploy to Netlify/Vercel (follow quickstart.md deployment instructions)

**Parallel Execution Example** (Polish phase - maximize parallelism):
```bash
# Most polish tasks can run simultaneously
npm run build &           # Build production bundle
npm run lighthouse &      # Run accessibility audit
./scripts/optimize-images.sh &  # Image optimization script
npm run test:e2e &        # Final E2E test suite
wait
```

**All User Stories Complete** ✅ - Production-ready app deployed

---

## Dependency Graph

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ↓
    ├─→ Phase 3 (US1: Binary Choice) ─→ Phase 4 (US2: Confirmation)
    ├─→ Phase 3 (US1: Binary Choice) ─→ Phase 5 (US3: Progress)
    └─────────────────────────────────→ Phase 6 (Polish)
```

**Key Insights**:
- Phase 3 (US1) MUST complete before Phase 4 (US2) - US2 depends on recommendation engine from US1
- Phase 5 (US3) is independent of Phase 4 (US2) - can implement in any order after US1
- Phase 6 (Polish) can start once any user story is complete (incremental polish)

---

## Task Execution Guide

### Daily Workflow

1. **Pick next sequential task** from current phase
2. **If marked [P]**, check if previous non-parallel tasks complete; if yes, run in parallel
3. **Run tests** after each task (npm run test for unit/integration, npm run test:e2e for E2E)
4. **Commit** after each passing test (or every 2-3 related tasks)
5. **Mark task complete** by changing `- [ ]` to `- [x]`

### Test-First Workflow (TDD)

For each user story phase:
1. **RED**: Write all test tasks (T017-T022 for US1) - tests fail
2. **GREEN**: Implement tasks (T023-T043 for US1) - make tests pass
3. **REFACTOR**: Clean up code while tests still pass

### MVP Checkpoint (After Phase 3)

After completing T001-T043:
- ✅ Run full test suite: `npm run test && npm run test:e2e`
- ✅ Manual test: Open app, complete discovery flow, verify recommendations appear
- ✅ Deploy to staging: `npm run build && netlify deploy`
- ✅ **Decision point**: Ship MVP or continue to Phase 4?

### Parallel Execution Tips

**Example: Maximize Phase 2 parallelism**
```bash
# Terminal 1
npm run test -- --watch  # Keep tests running

# Terminal 2 - Create all JSON files simultaneously
(cd src/data && touch styles.json images.json) &
(cd src/styles && touch global.css keyboard.css typography.css) &
wait

# Terminal 3 - Write tests while others work on implementation
vi tests/unit/validators.test.js
```

### Quality Gates (Must Pass Before Merge)

- [ ] All unit tests pass: `npm run test`
- [ ] All E2E tests pass: `npm run test:e2e`
- [ ] Linting passes: `npm run lint`
- [ ] Bundle size <100KB: Check dist/ after `npm run build`
- [ ] Lighthouse accessibility score ≥90: `npm run lighthouse`
- [ ] Manual keyboard navigation test passes (Tab through all elements)

---

## Task Summary

| Phase | Task Range | Count | Parallelizable | User Story |
|-------|------------|-------|----------------|------------|
| Setup | T001-T008 | 8 | 5 | N/A |
| Foundational | T009-T016 | 8 | 6 | N/A |
| US1: Binary Choice | T017-T043 | 27 | 18 | P1 (MVP) |
| US2: Confirmation | T044-T065 | 22 | 12 | P2 |
| US3: Progress | T066-T078 | 13 | 6 | P3 |
| Polish | T079-T098 + T084a-T084b | 22 | 16 | N/A |
| **TOTAL** | **T001-T098 + 2 SC validation tasks** | **100** | **63** | **3 stories** |

**Parallelization Potential**: 63% of tasks (63/100) can run in parallel within their phase

---

## Suggested MVP Delivery (Phase 1-3 Only)

**Tasks**: T001-T043 (43 tasks, ~44% of total)
**Effort**: 2-3 weeks (solo developer)
**Value**: Fully functional style discovery app with recommendations

**What MVP Includes**:
- ✅ Binary choice discovery flow
- ✅ Explanation validation (10-char minimum)
- ✅ Recommendation engine with confidence scoring
- ✅ Image loading with retry logic
- ✅ Keyboard navigation support
- ✅ Basic styling and UX
- ✅ Full test coverage (unit + E2E)

**What MVP Excludes** (add in later iterations):
- ❌ Confirmation/rejection flows (US2)
- ❌ Progress indicator (US3)
- ❌ Performance optimizations (Phase 6)
- ❌ Full accessibility audit (Phase 6)

**MVP Deployment**: After T043, run `npm run build && netlify deploy --prod`

---

## Next Steps

1. **Start with Phase 1**: Run `npm init -y` and begin T001-T008
2. **Follow TDD rigorously**: Write tests (RED) → Implement (GREEN) → Refactor
3. **Commit frequently**: After each passing test or every 2-3 related tasks
4. **Track progress**: Mark tasks complete (`- [x]`) as you finish them
5. **Decision point at MVP**: After T043, decide whether to ship or continue to US2/US3

**Ready to start!** Begin with T001: `npm init -y`

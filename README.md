# Side-by-Side: Bilingual General Conference Reader

## Overview

A personal Chrome extension for reading English and Portuguese versions of General Conference talks side by side on the Church of Jesus Christ of Latter-day Saints website.

The two language versions stay in two ordinary Chrome tabs, so the website's existing features (annotations, highlights, study notes) keep working. The extension:

* Detects the paragraph currently being read.
* Finds the corresponding paragraph in the other language using the shared HTML element ID.
* Scrolls the other tab so that paragraph lines up.
* Marks the current paragraph in both tabs.

This is also a learning project for practicing TypeScript, DOM inspection, browser APIs, and Chrome extension development.

## Scope

### Version 1: General Conference Talks

* English and Portuguese versions of the same talk.
* Scroll synchronization in either direction, based on matching paragraph IDs.
* A reading-position marker on the current paragraph in both tabs.
* Only the two tabs showing the same talk are synchronized. Unrelated tabs are left alone.
* The site's annotations, highlights, and study-note behavior are preserved.

### Later

* Scripture pages, using verse IDs such as `p12`.
* Additional languages available on the Church website.
* A popup for enabling or disabling synchronization.

### Out of Scope

* Synchronizing study notes, annotations, or asides between languages.
* Translations hosted on other websites (ESV, NIV, KJV, etc.).
* Recreating the website's annotation or study-note functionality.
* A standalone scripture or conference reader.

### Why Not Dual Page Sync?

The existing Dual Page Sync extension was tested. Its default mode syncs by page-height percentage, which drifts because translated paragraphs have different heights. Its element-based mode doesn't know about the shared paragraph IDs. Once the extension can identify the current paragraph (which it needs for the marker anyway), scrolling the other tab to the matching paragraph is a small step. Doing it in one extension avoids two extensions competing over scroll events.

## Discoveries So Far

### 1. Corresponding paragraphs share IDs

English and Portuguese paragraphs in the same talk have the same `id` but different `data-aid` values:

```html
<!-- Portuguese -->
<p data-aid="173909859" id="p_d5rju">...</p>

<!-- English -->
<p data-aid="173867460" id="p_d5rju">...</p>
```

The element ID is the cross-language anchor. The meaning of `data-aid` is unconfirmed, and the extension does not depend on it.

**Confirmed on two talks:**

* Both languages have identical ID lists, in the same order, with no extra or missing elements.
* IDs are unchanged after reloading the page, so they are part of the content, not generated at runtime.
* Anchors include the title (`<h1>`), section headings (`<h2>`), and paragraphs (`<p>`), all with `p_` IDs.
* The talk container (`<article id="main">`) also has `data-aid` and must be excluded.

Anchor selector: `[data-aid][id]:not(article)`

### 2. Paragraph heights differ

The example paragraph is about 432px high in English and 490px in Portuguese. Raw scroll positions or pixel offsets can't be matched. The extension has to match paragraph elements.

### 3. The `active-item` class produces the blue-line marker

Adding `active-item` shows the site's blue-line indicator on scripture verses and on conference paragraphs, in both language tabs:

```javascript
document.getElementById("p_atr5w").classList.add("active-item");
```

The site itself only applies `active-item` on scripture pages (for example, from verse links). It has not been observed on conference pages.

**Decision:** The extension uses its own class (e.g. `sbs-current`) with a purple line, offset from the site's blue line so both can be visible on scripture pages. The bar is drawn with `border-image` and `border-image-outset`, which doesn't change layout or positioning. An earlier version used `position: relative` plus `::after`. That made the verse the reference point for the site's own absolutely positioned blue bar, which then shifted into the text.

### 4. Study notes open in an aside

Study-note links open an aside on the current page. This works with the two-tab arrangement and does not need to sync.

### 5. URLs are predictable

* Pathname identifies the talk, or the book and chapter for scriptures.
* `lang=eng` and `lang=por` select the language.
* For scriptures, `id=p12-p17` selects a verse range and `#p12` navigates to a verse.

Changing only `lang` loads the same content in the other language. This is what makes automatic tab pairing possible.

## Design

### Reading position

A "reading line" sits about 30% down the viewport. The paragraph crossing that line is the current paragraph. An `IntersectionObserver` with a thin band (for example `rootMargin: "-30% 0px -69% 0px"`) detects it without running code on every scroll event.

### Tab pairing

The background service worker pairs two tabs automatically when their pathnames match and their `lang` values differ. No pairing UI is needed, and unrelated conference tabs are ignored.

### Scroll synchronization

1. The content script in the active tab reports the current paragraph ID and how far through it the reading line is (e.g. `0.4` = 40%).
2. The background worker relays the message to the paired tab:
   content script → `chrome.runtime.sendMessage` → worker → `chrome.tabs.sendMessage` → paired content script.
3. The paired tab scrolls so the same fraction of its matching paragraph sits on its reading line. Proportional alignment handles the height differences and keeps the movement smooth instead of jumping paragraph by paragraph.

### Avoiding feedback loops

Only the tab the user is actually interacting with sends updates. Each content script tracks the last `wheel`, `keydown`, or `touchstart` event. Programmatic scrolling doesn't fire these events, so a synced scroll never echoes back.

### Marker

The current paragraph is marked in both tabs with the extension's own purple-line class. The extension never touches `active-item`, so cleanup can't remove the website's own state.

### Single-page navigation

The site changes pages without full reloads. The content script watches for URL changes, re-scans paragraphs, and lets the worker re-pair tabs.

## Technical Approach

* **Browser:** Google Chrome
* **Extension:** Manifest V3
* **Language:** TypeScript
* **Build:** `esbuild` bundles each entry point (content script, service worker) into `dist/`. `tsc --noEmit` does type checking.
* **Types:** `@types/chrome`
* **Content scripts:** restricted to `https://www.churchofjesuschrist.org/study/*`
* **Paragraph matching:** shared HTML element IDs

No backend, framework, or React application is needed.

Why a bundler: Manifest V3 content scripts can't use ES module `import`s. `esbuild` lets the content script and worker share TypeScript types (such as message shapes) and still output single plain-JS files. It's one dev dependency and one build command.

## Development Plan

Each phase should produce a working, testable result before moving on.

### Phase 1: Validate the DOM ✅

* ✅ Paragraph IDs match across two talks in both languages.
* ✅ IDs stay the same after reloading.
* ✅ Anchors are `h1`, `h2`, and `p` elements with `data-aid` and `id`. The `article` container is excluded.
* ✅ The site doesn't use `active-item` on conference pages, so the extension uses its own marker class.

### Phase 2: Console proof of concept (one tab) ✅

* ✅ Detect the current paragraph or heading with an `IntersectionObserver` reading line.
* ✅ Log its ID and the fraction read while scrolling, throttled with `requestAnimationFrame`.
* ✅ Mark it with a purple `::after` bar, and clear the previous marker.
* ✅ Show a magenta debug line at the reading position.

### Phase 3: Extension skeleton ✅

* ✅ Set up `package.json`, `tsconfig.json`, `build.mjs` (esbuild), and `public/manifest.json`.
* ✅ Move the Phase 2 logic into `src/content.ts`, with styles in `public/content.css`.
* ✅ Re-scan for anchors when the page changes (`MutationObserver`).
* ✅ Load the unpacked extension from `dist/` and confirm the marker works.

Dev loop: `npm run watch`, then reload the extension in `chrome://extensions` and reload the tab.

### Phase 4: Pairing and messaging ✅

* ✅ Pair tabs in `src/background.ts` by pathname and differing `lang`, looked up fresh on every message (no stored state).
* ✅ Relay position messages (`src/messages.ts`) between paired tabs, and log them on the receiving side.
* ✅ A third tab showing a different talk is not paired.
* ✅ Closed tabs, navigation, and reloads need no special handling because pairs are recomputed each time.

### Phase 5: Scroll synchronization ✅

* ✅ Apply proportional alignment in the paired tab (`alignTo`).
* ✅ Use input-based leader detection (wheel, keys, touch, pointer within the last 1s) to prevent feedback loops.
* ✅ Test scrolling in both directions.
* ✅ Add a spacer after the talk so the last paragraphs can reach the reading line.

Known limitation: dragging the scrollbar may not count as reader input, so it may not sync.

### Phase 6: Test and refine

* ✅ Study-note aside: the tab with a note open can't be scrolled by the reader (the site locks it), but it still follows the other tab. This is the intended behavior.
* ✅ Annotations and highlights still work.
* ✅ Scripture pages: the purple bar and the site's blue `active-item` bar both show without overlapping.
* ✅ Touch: long drags and flicks sync. A held finger, pen, or mouse button keeps the tab leading, and a leading tab stays leading while it keeps scrolling (momentum).

* Long and short paragraphs with different heights.
* Paragraphs with no counterpart.
* Study-note asides open in one tab.
* Back/forward and in-site navigation.
* Multiple conference talks open at once.
* Performance during continuous scrolling.
* Existing annotations and highlights still work.

### Phase 7: Future enhancements

* Scripture pages using verse IDs.
* Additional languages.
* An enable/disable popup.

## Learning Approach

Build incrementally, one small testable step at a time, with AI as a guide.

1. Before each step, agree on what it should do and how to tell it works.
2. AI provides complete, working code for the step, with a plain-language explanation of each part: the JavaScript/TypeScript concepts, browser APIs, and why it's written that way.
3. Run it, observe the result, and ask about anything unclear.
4. Experiment by changing values and pieces to see what happens.
5. Move on only when the step works and makes sense.

The goal is understanding the code, not writing every line unaided.

## Success Criteria

Version 1 succeeds when a reader can open the English and Portuguese versions of a General Conference talk side by side, scroll either one, and see the other follow with the matching paragraph aligned and marked in both tabs, without disrupting the website's existing features.

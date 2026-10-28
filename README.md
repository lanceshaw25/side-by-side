# Bilingual Scripture and General Conference Reading Assistant

## Overview

A personal Chrome extension to make reading bilingual content on the Church of Jesus Christ of Latter-day Saints website easier.

The initial focus is on reading General Conference talks in English and Portuguese side by side. The extension will complement the existing **Dual Page Sync** Chrome extension by highlighting the paragraph currently being read in both language versions.

Rather than building a new scrolling synchronization system, this project aims to use Dual Page Sync for scrolling and add a synchronized reading-position indicator using the website's existing `active-item` CSS class.

## Goals

* Read English and Portuguese versions of the same General Conference talk side by side.
* Use Dual Page Sync to keep the two pages approximately synchronized while scrolling.
* Highlight the current paragraph in both languages with the website's existing blue-line indicator.
* Match corresponding paragraphs using their shared HTML element IDs.
* Preserve the website's existing annotations, study notes, highlights, and other functionality.
* Keep the implementation small and understandable as a learning project.

## Initial Scope

### Version 1

* Chrome extension using Manifest V3.
* General Conference talks on the Church website.
* English and Portuguese language versions.
* Detect the paragraph currently being read.
* Find the corresponding paragraph in the other language.
* Apply `active-item` to the corresponding paragraphs.
* Remove previous extension-managed markers as the reading position changes.
* Work alongside Dual Page Sync without taking over scroll synchronization.

### Out of Scope for Version 1

* Synchronizing study notes or annotations between languages.
* Supporting translations hosted on unrelated websites.
* Implementing a replacement for Dual Page Sync.
* Synchronizing arbitrary page navigation.
* Supporting every scripture page and language combination before the initial approach is validated.

Scripture pages may be added later, since they also use the `active-item` class.

## Discoveries and Experiments

### 1. Corresponding paragraphs share IDs

On General Conference pages, corresponding English and Portuguese paragraphs have been observed to use the same HTML element IDs, even when their translated text and `data-aid` values differ.

For example, a paragraph may have an ID such as:

```html
<p id="p_d5rju" data-aid="173867460">
```

The corresponding paragraph in the other language may use the same `id` but a different `data-aid`.

This suggests that the element ID can be used to find the corresponding paragraph across language versions. This behavior should be validated across additional talks and page reloads.

### 2. The `active-item` class produces the blue-line marker

Scripture verse elements normally use a class such as `verse`. A selected verse may use `verse active-item`.

For example:

```html
<p class="verse active-item" id="p3">
```

In Chrome DevTools, adding the class manually makes the blue-line indicator appear:

```javascript
document.getElementById("p3").classList.add("active-item");
```

The same experiment worked on a General Conference paragraph that did not originally have a class:

```javascript
document.getElementById("p_atr5w").classList.add("active-item");
```

The class was also successfully applied to the same paragraph ID in both language panes, producing the marker in both places.

**Confirmed:** The `active-item` class can be used to display the marker on both scripture verses and General Conference paragraphs.

**Still to investigate:** How the Church website manages this class internally, and how to avoid conflicting with its own state.

### 3. Scripture URL parameters

Scripture URLs can include a selected verse range, for example:

```text
?lang=eng&id=p3-p12#p3
```

The `id` parameter appears to identify a selected range of verses, and the website applies its active state accordingly.

For the initial General Conference implementation, the extension will not depend on URL-selected ranges. It will manage its own reading-position markers.

### 4. Dual Page Sync

Dual Page Sync has been tested with two pages displayed side by side. Its scroll synchronization appears reasonably close for bilingual reading, although alignment can drift because translated paragraphs have different heights.

The extension provides two scroll modes:

* Default mode, based on page-height percentages.
* Element-based mode.

URL synchronization can be disabled so that the English and Portuguese pages remain independent.

The initial project will leave scrolling to Dual Page Sync and focus on highlighting the corresponding paragraphs.

## Proposed Design

1. Detect the paragraph currently being read in one pane.
2. Obtain its element ID.
3. Find the corresponding paragraph in the other pane using that ID.
4. Apply `active-item` to both paragraphs.
5. Remove the extension's previous markers when the reading position changes.
6. Handle missing IDs, page navigation, and paragraphs that have no counterpart.

The marker should follow the reading position; it should not control scrolling. This keeps highlighting independent of Dual Page Sync.

An `IntersectionObserver` is a candidate for detecting the current paragraph. A small console experiment should establish a reliable reading-position rule before the extension is implemented.

## Technical Approach

* **Browser:** Google Chrome
* **Extension:** Manifest V3
* **Language:** JavaScript or TypeScript
* **Integration:** Content scripts running on the Church website
* **Scrolling:** Existing Dual Page Sync extension
* **Paragraph matching:** Shared HTML element IDs
* **Visual indicator:** Existing `active-item` class

No backend service should be necessary for the initial version.

## Development Plan

### Phase 1: Validate the DOM

* Test paragraph ID matching across several talks and both languages.
* Confirm that IDs remain consistent after reloading pages.
* Investigate how the website applies and removes `active-item`.
* Determine how to distinguish the current reading paragraph from nearby paragraphs.

### Phase 2: Build a Console Proof of Concept

* Detect the paragraph currently being read.
* Log its ID while scrolling.
* Find the matching paragraph in the other language.
* Apply the marker to both paragraphs.
* Remove previous markers safely.

### Phase 3: Build the Chrome Extension

* Create the Manifest V3 configuration.
* Add content scripts for supported Church website pages.
* Implement reading-position detection and matching.
* Track extension-managed markers so cleanup does not remove unrelated website state.

### Phase 4: Test with Dual Page Sync

* Test English and Portuguese versions of the same talk.
* Try both scroll modes.
* Verify that highlighting follows the reader in either pane.
* Test different paragraph heights and long talks.
* Test navigation, page reloads, missing counterpart paragraphs, and existing annotations.

### Phase 5: Consider Future Enhancements

* Support scripture pages using verse IDs.
* Support additional languages.
* Improve reading-position detection.
* Add configuration options if needed.

## Learning Approach

This project is intended to be developed incrementally as a learning exercise.

The preferred workflow is to investigate each behavior, attempt a small implementation, and use AI assistance for hints, explanations, and code review rather than generating the entire extension at once.

Each phase should produce a working, testable result before moving on.

## Success Criteria

The first version will be successful if a reader can open matching English and Portuguese General Conference talks side by side, scroll using Dual Page Sync, and see a blue-line marker beside the corresponding paragraph in both languages without disrupting the website's existing features.

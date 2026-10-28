# Bilingual Church Content Synchronizer — Chrome Extension

## Goal

Build a personal Chrome extension that synchronizes reading between English and Portuguese versions of General Conference talks on the Church of Jesus Christ of Latter-day Saints website.

The extension will use two separate Chrome tabs, preserving the website's existing features, including personal annotations, highlights, and study notes.

This is also a learning project for practicing JavaScript/TypeScript, DOM inspection, browser APIs, and Chrome extension development.

## Scope and Priorities

### Version 1: General Conference Talks

* Pair an English conference talk with its Portuguese translation.
* Synchronize reading positions using matching paragraph IDs.
* Keep the two tabs aligned as the reader scrolls through either language.
* Preserve the existing website's annotations, highlights, and study-note behavior.
* Avoid synchronizing unrelated Chrome tabs.

### Later: Scripture Pages

The same extension may eventually support English/Portuguese scripture pages, using verse IDs such as `p20`.

### Out of Scope for Now

* Synchronizing Bible translations hosted on other websites, such as ESV, NIV, and KJV.
* Recreating the Church website's annotation or study-note functionality.
* Building a standalone scripture or conference reader.

## Discoveries So Far

### 1. Conference paragraph IDs match across languages

Example Portuguese paragraph:

`<p data-aid="173909859" id="p_d5rju">...</p>`

Corresponding English paragraph:

`<p data-aid="173867460" id="p_d5rju">...</p>`

Both paragraphs have the same `id="p_d5rju"`, even though their `data-aid` values and text differ.

This suggests that paragraph IDs can serve as cross-language synchronization anchors.

The exact meaning of `data-aid` is not confirmed. It may identify individual content records, but the extension does not need to depend on it.

### 2. Paragraph heights differ

The example paragraph is approximately 432 pixels high in English and 490 pixels in Portuguese.

Consequently, matching raw scroll positions or pixel offsets would be unreliable. The extension should locate corresponding paragraph elements instead.

### 3. Study notes open in an aside

Study-note links open in an aside on the current page. This behavior works with the existing two-tab reading arrangement.

The aside does not need to synchronize between languages in version 1.

### 4. Scripture URLs are predictable

For possible future scripture support:

* Pathname identifies the book and chapter.
* `lang=eng` and `lang=por` select the language.
* `id=p12-p17` selects a verse range.
* `#p12` navigates to a particular verse.

Changing the language parameter successfully loads the corresponding passage while preserving the other URL parameters.

## Development Plan

### Step 1: Validate paragraph matching

Before building the extension, inspect several paragraphs in the same conference talk in both languages.

Verify that:

* Corresponding paragraphs consistently share IDs.
* IDs remain stable after reloading the pages.
* The IDs are present in the actual talk content.
* The same approach works for multiple talks.

### Step 2: Build a small proof of concept

Use Chrome DevTools to experiment with finding a paragraph by ID.

For example:

`document.getElementById("p_d5rju")`

Test scrolling the matching paragraph into view:

`element.scrollIntoView({ behavior: "smooth", block: "start" })`

The immediate goal is to prove that one page can locate and navigate to a corresponding paragraph on another page. Cross-tab coordination will require an extension or another suitable mechanism.

### Step 3: Detect the current reading position

Investigate how to identify the paragraph the reader is currently reading.

Possible approaches include:

* `IntersectionObserver`
* Scroll events combined with paragraph positions

Prefer a solution that avoids doing unnecessary work on every scroll event.

### Step 4: Create the Chrome extension

Use Manifest V3 with content scripts restricted to the Church's conference-talk pages.

Use TypeScript if convenient, compiling it to JavaScript for the extension.

No backend or React application is necessary.

### Step 5: Pair the tabs

Provide an explicit way to pair the English and Portuguese tabs.

The extension should coordinate only the paired tabs, not every conference-talk tab that happens to be open.

Investigate how the content scripts can communicate navigation information through the extension.

### Step 6: Synchronize scrolling

When the reader moves through one talk:

1. Identify the paragraph currently being read.
2. Obtain its element ID.
3. Find the corresponding paragraph in the paired tab.
4. Scroll that paragraph into view.
5. Avoid triggering an endless feedback loop between the tabs.

### Step 7: Test and refine

Test:

* Scrolling in either language.
* Long and short paragraphs with different heights.
* Study-note asides.
* Browser back and forward navigation.
* Multiple open conference talks.
* Missing or unmatched paragraph IDs.
* Performance during continuous scrolling.

## Possible Future Enhancements

* Synchronize navigation between scripture pages using verse IDs.
* Support additional languages available on the Church website.
* Add a simple popup for pairing tabs and enabling or disabling synchronization.

## Learning Approach

Build incrementally rather than having AI generate the entire extension.

Preferred workflow:

1. Spend 10–15 minutes attempting each task independently.
2. Ask AI for hints rather than a complete solution.
3. Implement the code.
4. Request a code review.
5. Compare the implementation with an alternative solution.

**First milestone:** Prove that a paragraph ID from one language can reliably identify the corresponding paragraph in the other language. Once that works, build the extension around that behavior.


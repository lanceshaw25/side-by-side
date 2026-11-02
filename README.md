# Side-by-Side

A Chrome extension for reading General Conference talks and scriptures on [churchofjesuschrist.org](https://www.churchofjesuschrist.org/study) in two languages side by side, kept aligned paragraph by paragraph.

* Scroll either language and the other follows, lining up the matching paragraph, even when the translations run different lengths.
* A purple bar marks the paragraph you're reading in both languages.
* Both pages stay normal Church website pages, so annotations, highlights, and study notes keep working.
* Works with mouse, keyboard, trackpad, touch, and pen.

## Setup

The extension isn't in the Chrome Web Store. You load it into Chrome as an "unpacked" extension from a built `dist` folder.

### Get the `dist` folder

**On a development machine** (needs Node.js 18 or newer):

```bash
git clone git@github.com:lanceshaw25/side-by-side.git
cd side-by-side
npm install
npm run build
```

This creates the `dist/` folder.

**On another machine without build tools:** copy the `dist/` folder from the development machine (for example, with Warpinator or a USB stick). Put it somewhere permanent: Chrome loads the extension from that folder every time it starts.

### Load it into Chrome

1. Go to `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose the `dist` folder.
4. Optional: pin it from the puzzle-piece menu in the toolbar.

### Updating

1. Rebuild with `npm run build`, or replace the copied `dist/` folder's contents. Keep the same folder path: if a copy lands as `dist (1)`, Chrome keeps loading the old one.
2. Click the reload ↻ icon on the Side-by-Side card in `chrome://extensions`.
3. Reload any open talk tabs.

## Use

1. Open a talk or scripture chapter, e.g. `…/study/general-conference/…?lang=eng`.
2. Open the same page in another language by changing `lang=eng` to another code, such as `lang=por` (Portuguese) or `lang=spa` (Spanish).
3. Put the two tabs side by side, using Chrome's Split View or two windows.
4. Scroll either one. The other follows.

Tabs are paired automatically when they show the same page in different languages. Tabs showing other pages are left alone.

### Good to know

* **Study notes:** the side with a note open can't be scrolled (the site locks it), but it keeps following the other side.
* **Following links:** navigating one tab doesn't move the other yet. Navigate both to the same page and syncing resumes.
* **End of a talk:** extra blank space after the last paragraph lets the final paragraphs line up too.
* **Scrollbar dragging** may not sync. Use the wheel, keyboard, trackpad, or touch.
* **After updating or reloading the extension,** reload open tabs. Tabs opened before the reload can't talk to the new version.

## Development

Source is in `src/` (TypeScript) and `public/` (manifest and CSS). Run `npm run watch` to rebuild on every save, then reload the extension and the tabs. `npm run typecheck` checks types.

To show the magenta reading-line guide and console logging, set `DEBUG = true` in `src/content.ts`.

See [DEVELOPMENT.md](DEVELOPMENT.md) for the design, discoveries, project history, and planned enhancements.

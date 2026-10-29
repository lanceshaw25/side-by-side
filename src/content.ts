// Runs on every churchofjesuschrist.org/study page. Marks the paragraph
// crossing the reading line and tracks how far through it the reader is.

// ---------- Settings ----------
const READING_LINE_PERCENT = 30; // % down the screen; must match content.css
const ANCHORS = "[data-aid][id]:not(article)"; // title, headings, paragraphs
const MARK_CLASS = "sbs-current"; // styled in content.css
const DEBUG = true; // show the magenta line and log positions

// ---------- Tracking the current paragraph ----------
let current: Element | null = null;

function setCurrent(el: Element): void {
  if (el === current) return;
  current?.classList.remove(MARK_CLASS);
  el.classList.add(MARK_CLASS);
  current = el;
}

// Watches a 1%-tall strip at the reading line.
const readingLineObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) setCurrent(entry.target);
    }
  },
  { rootMargin: `-${READING_LINE_PERCENT}% 0px -${100 - READING_LINE_PERCENT - 1}% 0px` },
);

// Elements we've already handed to the observer, so we never add one twice.
const observed = new WeakSet<Element>();

function observeAnchors(): void {
  for (const el of document.querySelectorAll(ANCHORS)) {
    if (observed.has(el)) continue;
    observed.add(el);
    readingLineObserver.observe(el);
  }
}

// The site can add content after this script runs (and swaps content when
// you navigate between talks without a reload), so re-scan when the page
// changes. Batched to at most one scan per frame.
let scanQueued = false;
new MutationObserver(() => {
  if (scanQueued) return;
  scanQueued = true;
  requestAnimationFrame(() => {
    scanQueued = false;
    observeAnchors();
  });
}).observe(document.body, { childList: true, subtree: true });

observeAnchors();

// ---------- How far through the current paragraph ----------
function fractionRead(el: Element): number {
  const rect = el.getBoundingClientRect();
  const lineY = window.innerHeight * (READING_LINE_PERCENT / 100);
  const f = (lineY - rect.top) / rect.height;
  return Math.min(Math.max(f, 0), 1);
}

let ticking = false;
document.addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (current && DEBUG) console.log(current.id, fractionRead(current).toFixed(2));
    });
  },
  { capture: true, passive: true },
);

// ---------- Debug ----------
if (DEBUG) {
  const debugLine = document.createElement("div");
  debugLine.id = "sbs-debug-line";
  document.body.append(debugLine);
}

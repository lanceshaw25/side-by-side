// Runs on every churchofjesuschrist.org/study page. Marks the paragraph
// crossing the reading line, tracks how far through it the reader is, and
// reports that to the background worker for the paired tab.
import type { PositionMessage } from "./messages";

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

// ---------- Who is leading? ----------
// The tab the reader is actually scrolling leads; the other one follows.
// Scrolling we do from code doesn't fire these input events, so a follower
// never mistakes a synced scroll for the reader and sends it back.
const LEAD_WINDOW_MS = 500; // grace period after the last input or (while leading) scroll
let lastInputTime = -Infinity;
let touching = false; // a finger is on the screen
let pressing = false; // a mouse button or pen is held down

function markInput(): void {
  lastInputTime = performance.now();
}

function listen<K extends keyof DocumentEventMap>(
  type: K,
  handler: (event: DocumentEventMap[K]) => void,
): void {
  document.addEventListener(type, handler, { capture: true, passive: true });
}

listen("wheel", markInput);
listen("keydown", markInput);

// A long drag fires touchstart once and nothing else until the finger lifts,
// so treat the whole time the finger is down as input.
listen("touchstart", () => {
  touching = true;
  markInput();
});
for (const type of ["touchend", "touchcancel"] as const) {
  listen(type, (event) => {
    touching = event.touches.length > 0; // other fingers may still be down
    markInput();
  });
}

// Same idea for mouse and pen. Touch is skipped here because Chrome sends
// pointercancel as soon as a touch starts scrolling, while the finger is
// still down. The touch events above handle it instead.
listen("pointerdown", (event) => {
  if (event.pointerType === "touch") return;
  pressing = true;
  markInput();
});
for (const type of ["pointerup", "pointercancel"] as const) {
  listen(type, (event) => {
    if (event.pointerType === "touch") return;
    pressing = false;
    markInput();
  });
}

// If the window loses focus mid-drag, the "end" event may never arrive.
window.addEventListener("blur", () => {
  touching = false;
  pressing = false;
});

function readerIsScrollingHere(): boolean {
  return touching || pressing || performance.now() - lastInputTime < LEAD_WINDOW_MS;
}

// ---------- Sending our position to the paired tab ----------
let lastSent = "";

async function reportPosition(): Promise<void> {
  if (!current || !readerIsScrollingHere()) return;
  const message: PositionMessage = {
    type: "position",
    id: current.id,
    fraction: Math.round(fractionRead(current) * 100) / 100,
  };

  // Only send when something changed (scrolling past a margin, for example,
  // would otherwise repeat the same position many times).
  const key = `${message.id} ${message.fraction}`;
  if (key === lastSent) return;
  lastSent = key;

  if (DEBUG) console.log("sent", key);
  try {
    await chrome.runtime.sendMessage(message);
  } catch {
    // The extension was reloaded, so this old copy of the script can't reach
    // it anymore. Reloading the tab fixes it.
  }
}

let ticking = false;
document.addEventListener(
  "scroll",
  () => {
    // A flick keeps coasting long after the finger lifts. While we're
    // leading, every scroll extends the lead, so we lead until the page
    // stops moving. A follower isn't leading, so its synced scrolls never
    // extend anything.
    if (readerIsScrollingHere()) markInput();

    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      void reportPosition();
    });
  },
  { capture: true, passive: true },
);

// ---------- Following the paired tab ----------
// The element that actually scrolls: either an inner box the site set up
// with overflow, or the page itself.
function scrollContainerOf(el: Element): Element {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }
  }
  return document.scrollingElement ?? document.documentElement;
}

// Scroll so that `fraction` of the way through paragraph `id` sits on our
// reading line, the same spot the reader is at in the other tab.
function alignTo(id: string, fraction: number): void {
  const el = document.getElementById(id);
  if (!el) return; // no counterpart in this language
  const rect = el.getBoundingClientRect();
  const lineY = window.innerHeight * (READING_LINE_PERCENT / 100);
  const pointY = rect.top + fraction * rect.height; // that spot, on screen right now
  scrollContainerOf(el).scrollBy({ top: pointY - lineY, behavior: "instant" });
}

chrome.runtime.onMessage.addListener((message: PositionMessage) => {
  if (message.type !== "position") return;
  if (readerIsScrollingHere()) return; // the reader is in control of this tab
  if (DEBUG) console.log("received", message.id, message.fraction);
  alignTo(message.id, message.fraction);
});

// ---------- Debug ----------
if (DEBUG) {
  const debugLine = document.createElement("div");
  debugLine.id = "sbs-debug-line";
  document.body.append(debugLine);
}

{
  // ---------- Settings ----------
  const READING_LINE = 0.30;                        // 30% down the screen
  const ANCHORS = "[data-aid][id]:not(article)";    // title, headings, paragraphs
  const MARK_CLASS = "sbs-current";                 // our purple marker

  // ---------- Styles ----------
  // A <style> tag we add to the page, so our class actually looks like something.
  const style = document.createElement("style");
  style.textContent = `
    .${MARK_CLASS} { position: relative; }
    .${MARK_CLASS}::after {
      content: "";
      position: absolute;
      left: -20px; top: 0; bottom: 0;
      width: 4px;
      border-radius: 2px;
      background: rebeccapurple;
    }
    #sbs-debug-line {
      position: fixed; left: 0; right: 0;
      top: ${READING_LINE * 100}%;
      height: 1px;
      background: magenta;
      pointer-events: none;
      z-index: 99999;
    }
  `;
  document.head.append(style);

  // The magenta debug line, so you can see where the reading line is.
  const debugLine = document.createElement("div");
  debugLine.id = "sbs-debug-line";
  document.body.append(debugLine);

  // ---------- Tracking the current paragraph ----------
  let current = null;

  function setCurrent(el) {
    if (el === current) return;              // nothing changed
    current?.classList.remove(MARK_CLASS);   // unmark the old one (if any)
    el.classList.add(MARK_CLASS);            // mark the new one
    current = el;
  }

  // The observer watches a thin strip at the reading line. -30% from the top
  // and -69% from the bottom leaves a 1%-tall strip. Keep it matching READING_LINE.
  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) setCurrent(entry.target);
      }
    },
    { rootMargin: "-30% 0px -69% 0px" }
  );

  document.querySelectorAll(ANCHORS).forEach(el => observer.observe(el));

  // ---------- How far through the current paragraph ----------
  function fractionRead(el) {
    const rect = el.getBoundingClientRect();         // position on screen right now
    const lineY = window.innerHeight * READING_LINE; // reading line, in pixels
    const f = (lineY - rect.top) / rect.height;
    return Math.min(Math.max(f, 0), 1);              // keep it between 0 and 1
  }

  // Scroll events can fire dozens of times per frame. This lets the work
  // run at most once per frame.
  let ticking = false;
  document.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (current) console.log(current.id, fractionRead(current).toFixed(2));
      });
    },
    { capture: true, passive: true }
  );
}

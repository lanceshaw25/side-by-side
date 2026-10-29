// Relays reading positions between paired tabs: the same talk open in two
// languages. Pairs are worked out fresh from the open tabs on every message,
// so nothing is lost when Chrome shuts this worker down between uses.
import type { PositionMessage } from "./messages";

const STUDY_PAGES = "https://www.churchofjesuschrist.org/study/*";

// The talk a URL shows, and in which language. A URL without ?lang= is English.
function describe(url: string): { path: string; lang: string } {
  const parsed = new URL(url);
  return {
    path: parsed.pathname,
    lang: parsed.searchParams.get("lang") ?? "eng",
  };
}

// Other tabs showing the same talk in a different language.
async function findPartners(from: chrome.tabs.Tab): Promise<chrome.tabs.Tab[]> {
  if (!from.url) return [];
  const me = describe(from.url);
  const tabs = await chrome.tabs.query({ url: STUDY_PAGES });
  return tabs.filter((tab) => {
    if (tab.id === from.id || !tab.url) return false;
    const other = describe(tab.url);
    return other.path === me.path && other.lang !== me.lang;
  });
}

async function relay(message: PositionMessage, from: chrome.tabs.Tab): Promise<void> {
  for (const partner of await findPartners(from)) {
    if (partner.id === undefined) continue;
    try {
      await chrome.tabs.sendMessage(partner.id, message);
    } catch {
      // The partner tab has no content script right now (still loading,
      // or opened before the extension was reloaded). Skip it.
    }
  }
}

chrome.runtime.onMessage.addListener((message: PositionMessage, sender) => {
  if (message.type !== "position" || !sender.tab) return;
  void relay(message, sender.tab);
});

// Message shapes shared by the content script and the background worker.

// "I'm reading paragraph `id`, this far through it (0 = top, 1 = bottom)."
export interface PositionMessage {
  type: "position";
  id: string;
  fraction: number;
}

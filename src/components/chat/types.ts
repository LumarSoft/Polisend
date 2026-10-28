export type PhotoVariant = "card" | "license" | "damage" | "damage2";

export type ChatMessage =
  | { id: string; kind: "in"; text: string; time: string }
  | { id: string; kind: "out"; text: string; time: string }
  | {
      id: string;
      kind: "buttons";
      text: string;
      time: string;
      buttons: string[];
      picked?: number;
    }
  | { id: string; kind: "list"; text: string; time: string; button: string }
  | {
      id: string;
      kind: "photo";
      variant: PhotoVariant;
      label: string;
      time: string;
    }
  | { id: string; kind: "doc"; name: string; meta: string; time: string }
  | {
      id: string;
      kind: "quote";
      time: string;
      title: string;
      rows: { name: string; price: string }[];
      note: string;
    }
  | { id: string; kind: "event"; text: string; tone?: "volt" | "coral" | "mute" };

export interface ListSheet {
  title: string;
  rows: { emoji: string; title: string; desc: string }[];
  picked?: number;
}

export type ChatStep = { delay?: number } & (
  | { do: "add"; msg: ChatMessage }
  | { do: "typing" }
  | { do: "pick"; id: string; index: number }
  | { do: "sheet"; sheet: ListSheet | null }
  | { do: "sheetPick"; index: number }
  | { do: "clock"; time: string }
);

export interface ChatState {
  messages: ChatMessage[];
  typing: boolean;
  sheet: ListSheet | null;
  clock: string;
}

export interface ChatScenario {
  label: string;
  clock: string;
  steps: ChatStep[];
  hold?: number;
}

/** Pure reducer: the chat state after applying the first `count` steps. */
export function applySteps(
  steps: ChatStep[],
  count: number,
  clock: string,
): ChatState {
  const state: ChatState = { messages: [], typing: false, sheet: null, clock };
  for (const step of steps.slice(0, count)) {
    switch (step.do) {
      case "add":
        state.messages.push(step.msg);
        state.typing = false;
        break;
      case "typing":
        state.typing = true;
        break;
      case "pick":
        state.messages = state.messages.map((m) =>
          m.id === step.id && m.kind === "buttons"
            ? { ...m, picked: step.index }
            : m,
        );
        break;
      case "sheet":
        state.sheet = step.sheet;
        break;
      case "sheetPick":
        if (state.sheet) state.sheet = { ...state.sheet, picked: step.index };
        break;
      case "clock":
        state.clock = step.time;
        break;
    }
  }
  return state;
}

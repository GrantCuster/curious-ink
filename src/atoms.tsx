import { atomWithStorage } from "jotai/utils";
import { atom } from "jotai";

export const promptAtom = atomWithStorage<string>(
  "prompt-2",
  `Look at the content or concept of this drawing and give me list of 6 search queries based on it. Think outside of the box. Give the results in the form of a json code block, like:
\`\`\`json
["query 1", "query 2", "query 3", "query 4", "query 5", "query 6"]
\`\`\``
);
export const prefixAtom = atomWithStorage<string>(
  "prefix",
  "https://google.com/search?q="
);

export const responseAtom = atomWithStorage<string>("response-1", "");
export const isGeneratingAtom = atom(false);

export const expandedAtom = atomWithStorage("expanded", true);

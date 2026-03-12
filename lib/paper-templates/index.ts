// lib/paper-templates/index.ts
// Add new templates here — just drop a .tex file and register it below.

import fs from "fs";
import path from "path";

export interface PaperTemplate {
  id:          string;
  name:        string;         // display name in UI
  description: string;
  supports:    ("cq" | "mcq" | "both")[];
  file:        string;         // filename inside lib/paper-templates/
  placeholders: string[];      // list of %%PLACEHOLDER%% tokens this template uses
}

export const TEMPLATES: PaperTemplate[] = [
  {
    id:          "board-cq-mcq",
    name:        "বোর্ড স্ট্যান্ডার্ড (CQ + MCQ)",
    description: "সৃজনশীল + নৈর্ব্যক্তিক — লিগ্যাল পেপার, ওয়াটারমার্ক সহ",
    supports:    ["both"],
    file:        "board-cq-mcq.tex",
    placeholders: [
      "%%INSTITUTION%%",
      "%%EXAM_TITLE%%",
      "%%SUBJECT%%",
      "%%TIME%%",
      "%%FULL_MARKS%%",
      "%%EXAM_DATE%%",
      "%%WATERMARK_TEXT%%",
      "%%CQ_QUESTIONS%%",
      "%%MCQ_QUESTIONS%%",
    ],
  },
  // Add more templates here:
  // {
  //   id: "mcq-only",
  //   name: "শুধু নৈর্ব্যক্তিক",
  //   ...
  // }
];

export function getTemplate(id: string): PaperTemplate | undefined {
  return TEMPLATES.find(t => t.id === id);
}

export function loadTemplateSource(template: PaperTemplate): string {
  const filePath = path.join(process.cwd(), "lib", "paper-templates", template.file);
  return fs.readFileSync(filePath, "utf8");
}

// Fill all %%PLACEHOLDER%% tokens in a template source string
export function fillTemplate(source: string, values: Record<string, string>): string {
  let result = source;
  for (const [key, val] of Object.entries(values)) {
    // key should be like "%%INSTITUTION%%"
    result = result.split(key).join(val ?? "");
  }
  return result;
}

import type { Problem } from "@/app/(dashboard)/dashboard/types";

export interface SelectedProblem extends Problem {
  customMarks: number;
  showAnswer:  boolean;
  optionCols:  "auto" | "1" | "2";
}

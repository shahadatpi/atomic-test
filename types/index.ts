// ─── Shared domain types ───────────────────────────────────────────────────
// Single source of truth for all database-backed entities.
// Import from here everywhere: import type { Problem, Attempt } from "@/types"

export interface Subject {
  id:   string
  name: string
}

export interface Topic {
  id:         string
  name:       string
  subject_id: string
}

export interface Subtopic {
  id:       string
  name:     string
  topic_id: string
}

export interface Problem {
  id:             string
  question:       string
  option_a:       string
  option_b:       string
  option_c:       string
  option_d:       string
  correct_answer: string
  explanation:    string | null
  hint:           string | null
  difficulty:     "easy" | "medium" | "hard"
  is_free:        boolean
  tags:           string[] | null
  source:         string | null
  created_at?:    string
  subtopic_id?:   string | null
  problem_type?:  string | null
  subjects:       { name: string }
  topics:         { name: string }
  subtopics?:     { name: string } | null
}

export interface Attempt {
  id:              string
  problem_id:      string
  selected_answer: string
  is_correct:      boolean
  created_at:      string
  problems: {
    question:   string
    difficulty: string
    subjects:   { name: string }
    topics:     { name: string }
  }
}

export interface ExamProblem {
  id:             string
  question:       string
  option_a:       string
  option_b:       string
  option_c:       string
  option_d:       string
  correct_answer: string
  explanation:    string | null
  hint:           string | null
  difficulty:     string
  is_free:        boolean
  subjects:       { name: string }
  topics:         { name: string }
}

export interface ExamConfig {
  subjectId:     string
  subjectName:   string
  topicId:       string
  topicName:     string
  questionCount: number
  durationMin:   number
  difficulty:    "any" | "easy" | "medium" | "hard"
  standard:      string
}

export interface ExamAnswer {
  problemId: string
  selected:  string | null
  correct:   string
  isCorrect: boolean
}

export type ExamPhase    = "setup" | "exam" | "results"
export type DashboardTab = "overview" | "practice" | "progress" | "exam" | "settings"
export type Difficulty   = "easy" | "medium" | "hard"
export type Answer       = "a" | "b" | "c" | "d"

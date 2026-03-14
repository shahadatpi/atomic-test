export interface Problem {
  id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  explanation: string | null
  hint: string | null
  difficulty: string
  is_free: boolean
  tags: string[] | null
  subjects: { name: string }
  topics: { name: string }
  subtopics: { name: string } | null
  problem_type: string | null
}

export interface Attempt {
  id: string
  problem_id: string
  selected_answer: string
  is_correct: boolean
  created_at: string
  problems: {
    question: string
    difficulty: string
    subjects: { name: string }
    topics: { name: string }
  }
}

export interface Subject {
  id: string
  name: string
}

export interface Topic {
  id: string
  name: string
  subject_id: string
}

export type DashboardTab = "overview" | "practice" | "progress" | "exam" | "settings"

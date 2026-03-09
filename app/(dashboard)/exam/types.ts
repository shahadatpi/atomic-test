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
  subjectId:    string
  subjectName:  string
  topicId:      string
  topicName:    string
  questionCount: number
  durationMin:  number
  difficulty:   "any" | "easy" | "medium" | "hard"
  standard:     string   // "any" | "Board" | "DU" | "BUET" | "CKRUET" | "SUST" | "Medical"
}

export interface ExamAnswer {
  problemId:      string
  selected:       string | null   // a | b | c | d | null (unanswered)
  correct:        string
  isCorrect:      boolean
}

export type ExamPhase = "setup" | "exam" | "results"

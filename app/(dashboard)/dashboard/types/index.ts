// Re-export all shared types from the central barrel.
// This keeps relative imports inside the dashboard working unchanged.
export type {
  Problem,
  Attempt,
  Subject,
  Topic,
  DashboardTab,
} from "@/types"

import {
  BookOpen, FlaskConical, Trophy, TrendingUp,
  Sun, Moon, Monitor,
} from "lucide-react";

export const PRACTICE_LINKS = [
  { label: "Problems",     href: "/problems",    icon: BookOpen,     desc: "Browse all MCQ problems"    },
  { label: "Practice",    href: "/practice",    icon: FlaskConical, desc: "Start a practice session"   },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy,       desc: "See how you rank globally"  },
  { label: "Progress",    href: "/progress",    icon: TrendingUp,   desc: "Track your improvement"     },
] as const;

export const SIMPLE_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Pricing",   href: "#pricing"   },
] as const;

export const USER_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Profile",   href: "/profile"   },
  { label: "Settings",  href: "/settings"  },
] as const;

export const THEME_OPTIONS = [
  { label: "Light",  value: "light",  icon: Sun     },
  { label: "Dark",   value: "dark",   icon: Moon    },
  { label: "System", value: "system", icon: Monitor },
] as const;

export const STUDENT_TABS = ["Profile", "Appearance", "Notifications", "Subscription", "Security"] as const
export const ADMIN_TABS   = ["Profile", "Appearance", "Notifications", "Admin",        "Security"] as const

export type StudentTab = typeof STUDENT_TABS[number]
export type AdminTab   = typeof ADMIN_TABS[number]
export type AnyTab     = StudentTab | AdminTab

export type NotifPrefs = {
    dailyReminder: boolean
    streakAlert:   boolean
    newProblems:   boolean
    weeklyReport:  boolean
    promotional:   boolean
}

export type NotifItem = {
    key:   keyof NotifPrefs
    label: string
    desc:  string
}

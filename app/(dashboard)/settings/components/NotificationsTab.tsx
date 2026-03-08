import { Section } from "../ui/Section"
import { Row }     from "../ui/Row"
import { Toggle }  from "../ui/Toggle"
import type { NotifPrefs, NotifItem } from "../types"

const STUDENT_ITEMS: NotifItem[] = [
    { key: "dailyReminder", label: "Daily practice reminders", desc: "Get reminded to practice every day" },
    { key: "streakAlert",   label: "Streak alerts",            desc: "Know when your streak is at risk" },
    { key: "newProblems",   label: "New problems available",   desc: "When new problems are added" },
    { key: "weeklyReport",  label: "Weekly progress report",   desc: "Summary of your weekly activity" },
    { key: "promotional",   label: "Promotional emails",       desc: "Updates about new features and plans" },
]

const ADMIN_ITEMS: NotifItem[] = [
    { key: "dailyReminder", label: "New user signups",      desc: "Get notified when new users register" },
    { key: "newProblems",   label: "Problem import alerts",  desc: "When bulk problem imports complete" },
    { key: "streakAlert",   label: "Platform error alerts",  desc: "Critical errors on the platform" },
    { key: "weeklyReport",  label: "Weekly platform report", desc: "Summary of platform activity" },
    { key: "promotional",   label: "Promotional emails",     desc: "Updates about new features" },
]

interface NotificationsTabProps {
    isAdmin:      boolean
    notifPrefs:   NotifPrefs
    onPrefChange: (key: keyof NotifPrefs, value: boolean) => void
}

export function NotificationsTab({ isAdmin, notifPrefs, onPrefChange }: NotificationsTabProps) {
    const items = isAdmin ? ADMIN_ITEMS : STUDENT_ITEMS

    return (
        <Section title="Notification Preferences" description="Control what emails and alerts you receive.">
            <div className="space-y-3">
                {items.map(item => (
                    <Row key={item.key} label={item.label} description={item.desc}
                         action={
                             <Toggle
                                 on={notifPrefs[item.key]}
                                 onChange={v => onPrefChange(item.key, v)}
                             />
                         }
                    />
                ))}
            </div>
        </Section>
    )
}

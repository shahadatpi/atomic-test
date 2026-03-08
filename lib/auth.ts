import { betterAuth } from "better-auth"
import { Pool } from "pg"

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL!,
    secret:  process.env.BETTER_AUTH_SECRET!,

    database: new Pool({
        connectionString: process.env.DATABASE_URL!,
        ssl: { rejectUnauthorized: false },
    }),

    emailAndPassword: { enabled: true },

    socialProviders: {
        google: {
            clientId:     process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },

    // ── Tell Better Auth about the role column we added ───────────────────
    //
    // additionalFields means: "this column exists in my user table,
    // include it whenever you return a session or user object"
    //
    // After this, session.user.role will be available everywhere:
    //   - Server: auth.api.getSession()
    //   - Client: useSession() hook
    user: {
        additionalFields: {
            role: {
                type:         "string",
                defaultValue: "user",       // new signups get "user" by default
                input:        false,        // users cannot set their own role
            },
        },
    },
})

// ── TypeScript types ───────────────────────────────────────────────────────
//
// These let TypeScript know about session.user.role
// so you get autocomplete and type safety everywhere.
export type Session = typeof auth.$Infer.Session
export type User    = typeof auth.$Infer.Session.user

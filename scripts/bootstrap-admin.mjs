import { createClient } from "@supabase/supabase-js";

const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

const secret =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

const email =
    String(process.env.ADMIN_EMAIL || "")
        .trim()
        .toLowerCase();

const password =
    String(process.env.ADMIN_PASSWORD || "");

const name =
    String(
        process.env.ADMIN_NAME ||
        "Teacher Vanessa"
    ).trim();

if (!url || !secret) {
    throw new Error(
        "Supabase server configuration was not found."
    );
}

if (!email) {
    throw new Error(
        "ADMIN_EMAIL is required."
    );
}

if (password.length < 8) {
    throw new Error(
        "ADMIN_PASSWORD must have at least 8 characters."
    );
}

const supabase = createClient(
    url,
    secret,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

let user = null;
let page = 1;

while (!user) {
    const {
        data,
        error
    } = await supabase.auth.admin.listUsers({
        page,
        perPage: 100
    });

    if (error) {
        throw error;
    }

    user = data.users.find(
        current =>
            String(current.email || "")
                .toLowerCase() === email
    );

    if (
        user ||
        data.users.length < 100
    ) {
        break;
    }

    page++;
}

if (!user) {
    const {
        data,
        error
    } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            name
        }
    });

    if (error) {
        throw error;
    }

    user = data.user;

    console.log(
        "Administrator authentication user created."
    );
} else {
    const {
        error
    } = await supabase.auth.admin.updateUserById(
        user.id,
        {
            password,
            email_confirm: true,
            user_metadata: {
                name
            }
        }
    );

    if (error) {
        throw error;
    }

    console.log(
        "Existing administrator credentials updated."
    );
}

const {
    error: profileError
} = await supabase
    .from("profiles")
    .upsert({
        id: user.id,
        email,
        name,
        role: "admin",
        level: "C1",
        active: true
    });

if (profileError) {
    throw profileError;
}

const {
    error: progressError
} = await supabase
    .from("student_progress")
    .upsert(
        {
            student_id: user.id,
            progress_percent: 0,
            xp: 0,
            streak: 0,
            teacher_notes: ""
        },
        {
            onConflict: "student_id"
        }
    );

if (progressError) {
    throw progressError;
}

console.log(
    `Administrator ready: ${email}`
);
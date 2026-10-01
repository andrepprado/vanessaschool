import pg from "pg";
import fs from "node:fs";
import path from "node:path";

const { Client } = pg;

const rawConnectionString =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL;

if (!rawConnectionString) {
    throw new Error(
        "POSTGRES_URL_NON_POOLING or POSTGRES_URL is required."
    );
}

const connectionUrl =
    new URL(rawConnectionString);

connectionUrl.searchParams.delete("sslmode");
connectionUrl.searchParams.delete("sslrootcert");
connectionUrl.searchParams.delete("uselibpqcompat");

const migrationsDirectory =
    "supabase/migrations";

const migrations =
    fs.readdirSync(migrationsDirectory)
        .filter(
            file =>
                file.toLowerCase().endsWith(".sql")
        )
        .sort();

const client =
    new Client({
        connectionString:
            connectionUrl.toString(),
        ssl: {
            rejectUnauthorized: false
        }
    });

try {
    console.log(
        "Connecting to Supabase PostgreSQL..."
    );

    await client.connect();

    for (const migration of migrations) {
        const filePath =
            path.join(
                migrationsDirectory,
                migration
            );

        const sql =
            fs.readFileSync(
                filePath,
                "utf8"
            );

        console.log(
            `Applying ${migration}...`
        );

        await client.query(sql);
    }

    console.log(
        "All migrations applied successfully."
    );
}
finally {
    await client.end();
}

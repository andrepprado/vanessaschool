import pg from "pg";
import fs from "node:fs";

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

/*
 * Some Windows/corporate environments inject a local certificate
 * into the TLS chain. Remove sslmode from the URL so the explicit
 * Node TLS configuration below is respected.
 *
 * TLS is still used, but certificate validation is disabled ONLY
 * for this local one-time database bootstrap connection.
 */
connectionUrl.searchParams.delete("sslmode");
connectionUrl.searchParams.delete("sslrootcert");
connectionUrl.searchParams.delete("uselibpqcompat");

const sql =
    fs.readFileSync(
        "supabase/migrations/20261001000100_student_platform.sql",
        "utf8"
    );

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
        "Connecting securely to Supabase PostgreSQL..."
    );

    await client.connect();

    console.log(
        "Applying Vanessa School database schema..."
    );

    await client.query(sql);

    console.log(
        "Database schema applied successfully."
    );
} finally {
    await client.end();
}
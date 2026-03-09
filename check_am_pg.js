const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: "postgres://postgres:c733daf583bb5665a0fe@46.224.148.12:5432/restaurant-os?sslmode=disable"
    });

    await client.connect();

    const res = await client.query('SELECT id, name, "firstName", "lastName" FROM "User" WHERE name ILIKE $1', ['%Amelie%']);
    console.log(res.rows);

    await client.end();
}

main().catch(console.error);

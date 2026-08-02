# cur8d

## Database changes

`src/server/db/schema.ts` is the source of truth for the app, and the repo
owner applies schema changes to the deployed database by hand. There is no
migration folder: `npm run db:push` is for a scratch database on your own
machine, never for the deployed one, where a diff computed on the spot is
neither reviewable nor repeatable.

A change to `schema.ts` therefore ships with the SQL that puts it into the
database, written out in the commit message and the pull request so it can be
copied and run:

1. Write the `ALTER TABLE` / `CREATE TABLE` yourself rather than generating it,
   and keep it idempotent — `ADD COLUMN IF NOT EXISTS`,
   `CREATE TABLE IF NOT EXISTS`. Running it twice should cost nothing.
2. Check the change against a local database before handing it over, and say in
   the commit message that you did.
3. Say whether the SQL and the code can deploy in either order. Adding a
   nullable column is order-free, since old code ignores it and new code reads
   null. A `NOT NULL` column, a narrowed type, or a rename is not — those need
   the order stated explicitly, and are worth raising with the repo owner
   before writing, since the data is live and the change does not run
   backwards.

Because nothing records what has been applied, `schema.ts` is only true if
someone ran the SQL. A column added to the file and never applied is a
production error at the first query that reads it.

# cur8d

## Database changes

Schema changes ship as SQL migration files under `drizzle/`. Do not run
`npm run db:push` against the deployed database: it applies a diff computed on
the spot, so the change that actually ran is never written down, is never
reviewed alongside the code, and cannot be replayed on another environment.
Pushing to a scratch database on your own machine is fine.

After editing `src/server/db/schema.ts`:

1. `npm run db:generate` writes the next `drizzle/NNNN_*.sql` and updates the
   snapshot under `drizzle/meta/`.
2. Read the generated SQL before trusting it. It diffs the schema file against
   that snapshot rather than against any live database, so anything a past
   `db:push` applied without a migration will surface here as a change the
   deployed database already has.
3. Keep additive statements idempotent — `ADD COLUMN IF NOT EXISTS` alongside
   the `CREATE TABLE IF NOT EXISTS` drizzle already emits. A migration that can
   be replayed over a database which got the same change some other way is the
   difference between a deploy that heals the drift and one that fails on it.
4. `npm run db:migrate` applies what is pending. Verify against both a fresh
   database and a copy of the deployed one before pushing.
5. Commit the `.sql` file and the `drizzle/meta/` changes in the same commit as
   the schema change. A migration that lands separately from the code reading
   those columns is a broken deploy in one order or the other.

Destructive statements — dropping or renaming a column, narrowing a type — are
worth raising with the repo owner before generating them, since the data is
live and the change cannot be replayed backwards.

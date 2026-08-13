# TODO

Work that has been designed but not built. Each entry records the decision and
the reasoning behind it, because most of these were settled after an argument
that is expensive to have twice.

## Community skill sets

Letting anyone submit a skill set anonymously — name it, paste the URLs of the
skills they like, optionally leave a social handle. No account, no session.

This extends a pattern the app already ships: `src/components/submission-form.tsx`
is a three-step no-auth modal posting to `/api/submissions`, and it already asks
for a referrer URL so a contributor can be credited.

### The publish gate

The risk here is specific to this feature and worth stating plainly. Every other
part of the site publishes links. A skill set publishes *"paste this into your
agent so it installs code."* A freely-published set is therefore a "run this on
your machine" button carrying cur8d's credibility — one real skill plus one repo
the submitter controls, and the site is the delivery mechanism.

So the gate is drawn around the payload rather than the person:

1. Parse each pasted URL into `{ sourceRepo, skillKey }`.
2. Look each up in `cur8d_skill` by **exact `sourceRepo` + `skillKey`**, not by
   repo alone. Repo-level matching would auto-approve anything later added to a
   known repo, which is not what "pre-vetted" means.
3. **All known** → insert straight into `cur8d_skill_set` with
   `origin = 'community'`. Live immediately, no review, because every skill in
   it was already vetted.
4. **Any unknown** → insert into `cur8d_skill_set_submission` for review.

The invariant this buys, and it is worth defending: **only the owner's approval
ever creates a `cur8d_skill` row.** The auto-publish path can assemble existing
skills but can never introduce a new install target.

Review needs no auth, because Notion is already the authenticated admin panel.
Promote queued submissions into the Notion Skill Sets database and the existing
sync publishes them as `origin = 'curated'`.

### `origin` is not attribution

The two are orthogonal and the naming invites confusion later:

- `origin` records who owns the row for sync purposes. `'curated'` is mirrored
  from Notion and the sync may delete it; `'community'` is DB-native and the
  sync must not touch it.
- `submitterHandle` records who gets credit.

A queued submission that gets approved ends up `origin = 'curated'` *and*
attributed to its submitter. Both are correct.

**The sync's delete pass must be scoped `WHERE origin = 'curated'`.** An
auto-published community set is a row Notion has never heard of, and an unscoped
delete pass destroys it on the first run.

### What auto-publish still owes

Vetted skills make the *install payload* safe. They do nothing for the page
content or the byline, so this path carries three obligations that a review step
would otherwise have absorbed:

- **Rate limit the endpoint per IP.** `/api/submissions` has none today. That is
  survivable for a table nothing reads, and not survivable for one that renders
  straight onto the site.
- **Generate slugs defensively.** Two people will submit "Website Kit". Slugify
  the name, and on unique-index conflict append a short random suffix and retry.
- **Fetch the submitter avatar in the cron, not on submit.** Matches how every
  other avatar in the app resolves, and usefully means a freshly auto-published
  set goes live with a handle but no face until the next pass.

Impersonation is the residual risk: nothing verifies a handle, and on this path
nobody reviews it. Pair it with a report affordance copied from the `reportLink`
mutation in `src/server/api/routers/collectable.ts`, with `isBroken` as the
takedown switch. Render attribution as "submitted by @handle" linking to the
profile — never phrased as an endorsement the site cannot back.

### Storing submissions

`cur8d_skill_set_submission` is created alongside the curated-sets tables so the
SQL is applied once; nothing writes to it until this work happens.

Store the **raw pasted URLs**, not resolved skill rows. Nothing unreviewed
should reach the published tables, and normalising once at approval is when a
human is already looking anyway.

The existing `submissions` table is written and read by nothing, and this queue
would rot the same way. So have the **cron push queued rows into a Notion inbox
database** — `@notionhq/client` is already a dependency and
`scripts/ingest-video.ts` already writes to Notion — stamping
`pushedToNotionAt` so a row is never pushed twice. Driving it from the cron
rather than the public endpoint keeps a spam flood off the Notion API and off
the request path.

### Attribution avatars

`fetchAvatarUrl` in `src/lib/twitter-avatar.ts` already resolves a handle
through `unavatar.io/x/<handle>?fallback=false` and mirrors the bytes to Blob.
unavatar also serves `/github/` and `/instagram/`, so this generalises to
`fetchAvatarUrl(provider, handle, id)` — one extra parameter, and a rename of
the file to something like `social-avatar.ts`.

Keep `fallback=false`. As that file's comment says, a made-up avatar stored as a
real one is worse than none, because nothing downstream can tell the difference.
GitHub and X resolve reliably; Instagram blocks aggressively, so treat it as
best-effort and let the card fall back to initials via
`src/components/designer-avatar.tsx`.

### Verifying it

- A submission whose URLs all resolve to existing skills goes live immediately
  with `origin = 'community'`; one containing an unknown URL does not appear on
  the site and lands in the queue instead.
- No submission, of either kind, creates a `cur8d_skill` row.
- Two submissions named "Website Kit" both publish, with distinct slugs.
- `parseSkillSource` handles `owner/repo`, a full GitHub URL, a
  `/tree/main/skills/<key>` path, and refuses a non-GitHub URL.
- A queued row reaches the Notion inbox once and only once.
- Avatars resolve for GitHub and X handles and fail closed for a nonexistent
  one, leaving initials rather than a fabricated face.

---

## Smaller things left out

**Multi-select selection layer.** Ticking skills to assemble and copy a custom
prompt. Cut because with no flat skill index there is nowhere to add skills
*from*, so deselect-within-a-set alone is half a feature. It is also the natural
entry point to community sets, so it most likely returns alongside them — not as
a browse destination, but as the picker you assemble a set from.

**A "view prompt" disclosure** under the copy buttons. Declined by design: the
two destination-labelled buttons plus destination-specific toasts carry it. Five
lines to add if it ever proves too opaque.

**`member_search_text` denormalisation.** Member search currently runs as a
correlated `EXISTS` subquery over `cur8d_skill` so it can never go stale. If it
ever drags, a denormalised haystack column rebuilt by the sync is the fallback.

**Slug namespacing.** `cur8d_skill_set.slug` is globally unique, which is fine
while the owner is the only curator. Once anyone can publish it becomes a
landgrab, and community sets will need a handle prefix or an id-based URL param.

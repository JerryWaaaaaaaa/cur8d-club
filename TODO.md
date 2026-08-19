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

1. Parse each pasted URL into `{ sourceRepo, skillKey }` with `parseSkillSource`
   in `src/lib/skill-install-text.ts`, which already handles the shorthand, a
   repository URL and a `/tree/<ref>/<path>` link.
2. Look each up in `cur8d_skill` by **exact `source_repo` + `skill_key`**, not by
   repository alone. Repo-level matching would auto-approve anything later added
   to a known repo, which is not what "pre-vetted" means.
3. **All known** → insert straight into `cur8d_skill_set`. Live immediately, no
   review, because every skill in it was already vetted.
4. **Any unknown** → insert into `cur8d_skill_set_submission` for review.

The invariant this buys, and it is worth defending: **only the owner ever creates
a `cur8d_skill` row.** The auto-publish path can assemble existing skills but can
never introduce a new install target.

### Reviewing the queue

There is no admin UI and no Notion behind this tab — the database is the source
of truth, and `scripts/import-skill-sets.ts` is an import rather than a sync.
So review happens in whatever database client is already to hand (`npm run
db:studio`, or the hosting provider's console), and approving a submission means
inserting the skills it introduced and then the set itself.

That is honest at low volume and needs nothing built. It has one failure mode
worth naming: the existing `cur8d_submission` table has been written to and read
by nothing for as long as it has existed, and a review queue nobody opens will
go the same way. Whatever ships alongside this needs *some* prompt to look —
even a count surfaced somewhere the owner already looks.

### What auto-publish still owes

Vetted skills make the *install payload* safe. They do nothing for the page
content or the byline, so this path carries three obligations that a review step
would otherwise have absorbed:

- **Rate limit the endpoint per IP.** `/api/submissions` has none today. That is
  survivable for a table nothing reads, and not survivable for one that renders
  straight onto the site.
- **Generate slugs defensively.** Two people will submit "Website Kit". Slugify
  the name — `scripts/import-skill-sets.ts` has the function — and on unique
  index conflict append a short random suffix and retry. `skill_set_slug_idx` is
  unique, so this is a real error rather than a tidiness concern.
- **Fetch the submitter avatar on a schedule, not on submit.** Matches how every
  other avatar in the app is resolved, and usefully means a freshly
  auto-published set goes live with a handle but no face until the next pass.

Impersonation is the residual risk: nothing verifies a handle, and on this path
nobody reviews it. Pair it with a report affordance copied from the `reportLink`
mutation in `src/server/api/routers/collectable.ts`, with `is_broken` as the
takedown switch — the skill set reader already filters on it.

### Storing submissions

`cur8d_skill_set_submission` already exists in `src/server/db/schema.ts` and in
the applied SQL. Nothing writes to it yet.

It stores the **raw pasted URLs**, not resolved skill rows, because nothing
unreviewed should reach a published table and normalising once at approval is
when someone is already looking at it.

`cur8d_skill_set` already carries the attribution columns —
`submitter_provider`, `submitter_handle`, `submitter_avatar_url` — and
`src/components/skill-set-detail.tsx` already renders a "submitted by" line when
the handle is set. A submitted set needs no schema change to appear correctly.

### Attribution avatars

`fetchAvatarUrl` in `src/lib/twitter-avatar.ts` resolves a handle through
`unavatar.io/x/<handle>?fallback=false` and mirrors the bytes to Blob. unavatar
also serves `/github/` and `/instagram/`, so this generalises to
`fetchAvatarUrl(provider, handle, id)` — one extra parameter, and a rename of
the file to something like `social-avatar.ts`.

Keep `fallback=false`. As that file's comment says, a made-up avatar stored as a
real one is worse than none, because nothing downstream can tell the difference.
GitHub and X resolve reliably; Instagram blocks aggressively, so treat it as
best-effort and let it fall through to initials the way
`src/components/source-avatar.tsx` already does.

### Verifying it

- A submission whose URLs all resolve to existing skills goes live immediately;
  one containing an unknown URL does not appear on the site and lands in the
  queue instead.
- No submission, of either kind, creates a `cur8d_skill` row.
- Two submissions named "Website Kit" both publish, with distinct slugs.
- Avatars resolve for GitHub and X handles and fail closed for a nonexistent
  one, leaving initials rather than a fabricated face.

---

## Smaller things left out

**Multi-select selection layer.** Ticking skills to assemble and copy a custom
prompt. Cut because with no flat skill index there is nowhere to add skills
*from*, so deselect-within-a-set alone is half a feature. It is also the natural
entry point to community sets, so it most likely returns alongside them — not as
a browse destination, but as the picker you assemble a set from.
`buildInstallText` already takes an arbitrary list of skills, so the text half of
this is done.

**A "view prompt" disclosure** under the copy buttons. Declined by design: the
two destination-labelled buttons plus destination-specific toasts carry it. Five
lines to add if it ever proves too opaque.

**Per-skill descriptions.** The CSV has none, so every `cur8d_skill.description`
is null and the copied prompt lists names and repositories without a summary
line. `buildInstallText` already omits the clause when it is missing, and an
agent reads each SKILL.md as it installs it, so this is a nicety. Filling it in
means fetching each skill's SKILL.md front-matter — the paths vary by repository,
which is why it was not done at import time.

**Deep links to a skill.** `cur8d_skill.source_url` exists for a link to a
skill's own directory but is null for every imported row, so rows fall back to
the repository root — three skills from `pbakaus/impeccable` all point at the
same page. Filling it in has the same repository-layout problem as descriptions
and would naturally be the same pass.

**Pagination for the skills tab.** `skillSet.getAll` returns everything, which is
right for twenty sets and wrong somewhere past fifty. At that point it should
become `getInfiniteScroll` like the other two grids.

**`member_search_text` denormalisation.** Member search runs as a correlated
`EXISTS` subquery over `cur8d_skill` so it can never go stale. If it ever drags,
a denormalised haystack column rebuilt by the import is the fallback.

**Slug namespacing.** `cur8d_skill_set.slug` is globally unique, which is fine
while the owner is the only curator. Once anyone can publish it becomes a
landgrab, and community sets will need a handle prefix or an id-based URL param.

import { asc, desc, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

import type { SortValue } from "@/lib/sort-options";

/**
 * `createdAt` is nullable on every sortable table, so both time-based
 * orderings push nulls to the end rather than letting Postgres default them to
 * the top of a DESC sort. Name is the tiebreaker so offset pagination stays
 * deterministic.
 */
export function getOrderBy(
  columns: { createdAt: PgColumn; name: PgColumn },
  sort: SortValue,
): SQL[] {
  switch (sort) {
    case "recent":
      return [sql`${columns.createdAt} DESC NULLS LAST`, asc(columns.name)];
    case "earliest":
      return [sql`${columns.createdAt} ASC NULLS LAST`, asc(columns.name)];
    case "name-desc":
      return [desc(columns.name)];
    case "name-asc":
    default:
      return [asc(columns.name)];
  }
}

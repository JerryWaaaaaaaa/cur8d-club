import { accentForKey, inkForBackground } from "@/lib/colors";
import { splitOnMatches } from "@/lib/search";

interface HighlightProps {
  text: string;
  terms: string[];
}

/**
 * Marks the parts of a result that the query actually hit, so a card accounts
 * for why it is in the grid rather than leaving the reader to guess which
 * field matched.
 *
 * Only the matched characters are marked, inside a tag pill as much as in a
 * name — searching "typo" blocks four letters of "Typography" rather than
 * flipping the whole pill, which would overstate what matched.
 *
 * With no query this renders the bare string, so an unsearched grid produces
 * the same DOM it did before highlighting existed.
 */
export function Highlight({ text, terms }: HighlightProps) {
  const segments = splitOnMatches(text, terms);

  if (segments.length === 1 && !segments[0]!.matched) return <>{text}</>;

  return (
    <>
      {segments.map((segment, index) => {
        if (!segment.matched) return <span key={index}>{segment.text}</span>;

        // `mark` is the element for this, but its user-agent yellow has to go:
        // the highlight wears the wordmark's colours, the same set a hovered
        // link lights up in.
        //
        // The key carries the terms so a new search repaints the grid, and the
        // position so one card's matches are not all the same colour.
        const accent = accentForKey(`${terms.join(",")}|${text}|${index}`);

        return (
          <mark
            key={index}
            // Painted rather than classed: these are hex values, not palette
            // steps Tailwind knows about.
            style={{ backgroundColor: accent, color: inkForBackground(accent) }}
            // Square, and painted on every line of a match that wraps — the
            // description panel highlights run to paragraph length.
            className="box-decoration-clone rounded-none px-[0.15em]"
          >
            {segment.text}
          </mark>
        );
      })}
    </>
  );
}

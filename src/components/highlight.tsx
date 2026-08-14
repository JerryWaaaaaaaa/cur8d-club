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
      {segments.map((segment, index) =>
        segment.matched ? (
          // `mark` is the element for this, but its user-agent yellow has to
          // go: the highlight borrows the black-on-white pair the type and
          // "Visit" badges already use, so it reads as part of the same set.
          <mark
            key={index}
            className="bg-foreground px-[0.15em] text-background"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

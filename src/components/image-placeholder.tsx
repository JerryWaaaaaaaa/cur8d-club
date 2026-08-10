import {
  colorForName,
  initialsFor,
  inkForBackground,
} from "@/lib/name-visuals";

interface ImagePlaceholderProps {
  name: string;
  className?: string;
}

export function ImagePlaceholder({ name, className }: ImagePlaceholderProps) {
  const initials = initialsFor(name);
  const backgroundColor = colorForName(name);

  return (
    <div
      className={`flex h-full w-full items-center justify-center p-16 ${className}`}
    >
      <div
        className="relative w-full"
        style={{ paddingTop: "50%" }} // 2:1 aspect ratio
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor }}
        >
          <span
            className="text-4xl font-medium"
            style={{ color: inkForBackground(backgroundColor) }}
          >
            {initials}
          </span>
        </div>
      </div>
    </div>
  );
}

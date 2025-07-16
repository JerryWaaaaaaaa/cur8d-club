interface ImagePlaceholderProps {
  name: string;
  className?: string;
}

// Expanded Bauhaus and Swiss style inspired color palette
const bauhausColors = [
  "#E30022", // Bauhaus Red
  "#0087CC", // Bauhaus Blue
  "#F5D13B", // Bauhaus Yellow
  "#000000", // Black
  "#D9043D", // Swiss Red
  "#005CA9", // Swiss Blue
  "#FFDD00", // Swiss Yellow
  "#009F4D", // Green
  "#FF5C00", // Bauhaus Orange
  "#7C378A", // Bauhaus Purple
  "#00A19A", // Teal
  "#6B6B6B", // Dark Gray
  "#B8B8B8", // Light Gray
  "#E84E0F", // Vermilion
  "#2D2D2D", // Charcoal
  "#F2F2F2", // Off-White
  "#005F73", // Dark Teal
  "#DC143C", // Crimson
  "#1A5E63", // Petroleum Blue
  "#F28C28", // Tangerine
  "#264653", // Prussian Blue
  "#E76F51", // Burnt Sienna
  "#2A9D8F", // Persian Green
  "#E9C46A", // Saffron
];

export function ImagePlaceholder({ name, className }: ImagePlaceholderProps) {
  // Get initials from name (up to 2 characters)
  const initials = name
    .split(/[^a-zA-Z]/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Generate a deterministic hash from the name to select a color
  const nameHash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Select a color from the palette based on the name hash
  const backgroundColor = bauhausColors[nameHash % bauhausColors.length];

  // Create solid color style
  const colorStyle = {
    backgroundColor: backgroundColor,
  };

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
          style={colorStyle}
        >
          <span className="text-4xl font-medium text-white">{initials}</span>
        </div>
      </div>
    </div>
  );
}

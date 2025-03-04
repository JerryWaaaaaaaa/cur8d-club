interface ImagePlaceholderProps {
  name: string
  className?: string
}

export function ImagePlaceholder({ name, className }: ImagePlaceholderProps) {
  // Get initials from name (up to 2 characters)
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={`w-full h-full flex items-center justify-center bg-gray-100 ${className}`}>
      <span className="text-4xl font-medium text-gray-400">{initials}</span>
    </div>
  )
}


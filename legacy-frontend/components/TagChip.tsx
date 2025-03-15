interface TagChipProps {
  tag: string;
}

export function TagChip({ tag }: TagChipProps) {
  const baseStyle = 'inline-block px-3 py-1 text-sm font-normal rounded-full';
  const tagStyle = 'bg-gray-100 text-gray-600';

  return <span className={`${baseStyle} ${tagStyle}`}>{tag}</span>;
}

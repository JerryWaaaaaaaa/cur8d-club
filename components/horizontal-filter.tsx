import { Button } from "@/components/ui/button"
import { ArrowCounterClockwise } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface HorizontalFilterProps {
  tags: string[]
  selectedTag: string | null
  selectedType: string | null
  onTagSelect: (tag: string | null) => void
  onTypeSelect: (type: string | null) => void
  onReset: () => void
}

const types = ["individual", "studio", "agency"]

export function HorizontalFilter({
  tags,
  selectedTag,
  selectedType,
  onTagSelect,
  onTypeSelect,
  onReset,
}: HorizontalFilterProps) {
  const hasSelection = selectedTag !== null || selectedType !== null

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-3.5 overflow-x-auto pb-4 -mb-4 scrollbar-hide">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          onClick={onReset}
          className={cn(
            "text-sm font-normal rounded-full px-4 h-9 border-0",
            !hasSelection
              ? "bg-black text-white hover:bg-black/80 hover:text-white"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300",
          )}
        >
          All
        </Button>
        {hasSelection && (
          <Button
            variant="outline"
            onClick={onReset}
            className="text-sm font-normal rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 px-2 border-0 w-9 h-9 flex items-center justify-center shrink-0 -ml-1 group"
          >
            <ArrowCounterClockwise
              weight="bold"
              className="h-4 w-4 transform transition-all duration-300 ease-out origin-center group-hover:-rotate-[60deg]"
            />
            <span className="sr-only">Reset filters</span>
          </Button>
        )}
      </div>

      <div className="h-full w-px bg-gray-200 shrink-0" />

      <div className="flex items-center gap-1">
        {types.map((type) => (
          <Button
            key={type}
            variant="outline"
            className={cn(
              "text-sm font-normal rounded-full px-4 h-9 border-0 -ml-1 first:-ml-0",
              selectedType === type
                ? "bg-black text-white hover:bg-black/80 hover:text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300",
            )}
            onClick={() => onTypeSelect(selectedType === type ? null : type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}
      </div>

      <div className="h-full w-px bg-gray-200 shrink-0" />

      <div className="flex items-center gap-1">
        {tags.map((tag) => (
          <Button
            key={tag}
            variant="outline"
            className={cn(
              "text-sm font-normal rounded-full px-4 h-9 border-0 -ml-1 first:-ml-0",
              selectedTag === tag
                ? "bg-black text-white hover:bg-black/80 hover:text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300",
            )}
            onClick={() => onTagSelect(selectedTag === tag ? null : tag)}
          >
            {tag}
          </Button>
        ))}
      </div>
    </div>
  )
}


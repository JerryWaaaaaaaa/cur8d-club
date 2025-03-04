import { Manrope } from "next/font/google"
import { HorizontalFilter } from "./horizontal-filter"

const manrope = Manrope({ subsets: ["latin"] })

interface HeaderProps {
  tags: string[]
  selectedTag: string | null
  selectedType: string | null
  onTagSelect: (tag: string | null) => void
  onTypeSelect: (type: string | null) => void
  onReset: () => void
}

export function Header({ tags, selectedTag, selectedType, onTagSelect, onTypeSelect, onReset }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-20 pb-12"
      style={{
        backdropFilter: "blur(20px) brightness(1.1)",
        WebkitBackdropFilter: "blur(20px) brightness(1.1)",
        maskImage:
          "linear-gradient(black 70%, rgba(0, 0, 0, 0.8) 85%, rgba(0, 0, 0, 0.6) 90%, rgba(0, 0, 0, 0.3) 95%, transparent)",
        WebkitMaskImage:
          "linear-gradient(black 70%, rgba(0, 0, 0, 0.8) 85%, rgba(0, 0, 0, 0.6) 90%, rgba(0, 0, 0, 0.3) 95%, transparent)",
        background: "linear-gradient(white 70%, transparent)",
      }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <div className="max-w-3xl">
            <h1 className={`${manrope.className} text-[20px] leading-none font-light`}>
              <span className="text-gray-400">Curated</span>
              <br />
              <span className="text-gray-600 block mt-2 font-light">
                A personal curation of my favorite designers/studios/agencies/builders.
              </span>
            </h1>
          </div>
          <HorizontalFilter
            tags={tags}
            selectedTag={selectedTag}
            selectedType={selectedType}
            onTagSelect={onTagSelect}
            onTypeSelect={onTypeSelect}
            onReset={onReset}
          />
        </div>
      </div>
    </header>
  )
}


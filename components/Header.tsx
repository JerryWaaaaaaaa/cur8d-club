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
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        maskImage: "linear-gradient(to bottom, black 85%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent)",
        background: "linear-gradient(to bottom, white 60%, rgba(255, 255, 255, 0.9) 85%, rgba(255, 255, 255, 0) 100%)",
      }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <div className="max-w-3xl">
            <h1 className={`${manrope.className} text-[20px] leading-none font-light`}>
              <span className="text-gray-400">Curated</span>
              <br />
              <span className="text-gray-600 block mt-2 font-light">
                A personal curation of my favorite designers/studios/agency/builders.
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


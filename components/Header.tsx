import { Manrope } from "next/font/google"
import { HorizontalFilter } from "./horizontal-filter"
import Image from "next/image"

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
        background: "linear-gradient(#FDFEFF 70%, transparent)",
      }}
    >
      <div className="container mx-auto px-4 pt-6 pb-8">
        <div className="flex flex-col gap-4">
          <div className="max-w-3xl space-y-2">
            <div className="h-[82px] relative">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-3owh7eOHQaG8H8K2JBoBCUkGQpZvkt.svg"
                alt="cur8d.club"
                height={82}
                width={328}
                priority
                className="object-contain object-left"
              />
            </div>
            <p className={`${manrope.className} text-[20px] leading-none text-gray-900`}>
              inspiring designers, builders, and studios.
            </p>
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


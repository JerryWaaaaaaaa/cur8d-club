import { Manrope } from "next/font/google"
import { HorizontalFilter } from "./horizontal-filter"
import Image from "next/image"
import Link from "next/link"

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
      className="sticky top-0 z-20 pt-10 pb-16"
      style={{
        backdropFilter: "blur(20px) brightness(1.1)",
        WebkitBackdropFilter: "blur(20px) brightness(1.1)",
        maskImage:
          "linear-gradient(black 72%, rgba(0, 0, 0, 0.8) 85%, rgba(0, 0, 0, 0.6) 90%, rgba(0, 0, 0, 0.3) 95%, transparent)",
        WebkitMaskImage:
          "linear-gradient(black 72%, rgba(0, 0, 0, 0.8) 85%, rgba(0, 0, 0, 0.6) 90%, rgba(0, 0, 0, 0.3) 95%, transparent)",
        background: "linear-gradient(white 72%, transparent)",
      }}
    >
      <div className="container mx-auto px-4 pb-12">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-7 mb-4">
            <div className="relative w-[200px] md:w-auto">
              <Image
                src="/site-assets/logo.svg"
                alt="cur8d.club"
                height={82}
                width={328}
                priority
                className="object-contain object-left h-auto w-full max-w-[200px] md:max-w-[328px]"
              />
            </div>
            <div className={`${manrope.className} flex flex-col justify-center mt-0 md:mt-0 w-full md:w-auto`}>
              <p className="text-l leading-tight text-gray-700 max-w-[70%] md:max-w-[400px]">
                Discover inspiring designers ✦ builders ✦ groups. Curated by{" "}
                <Link href="https://x.com/notjerrywang" target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:underline">
                  @Jerry
                </Link>
                , updates every week.
              </p>
            </div>
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


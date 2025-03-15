import { Manrope } from "next/font/google";
import { HorizontalFilter } from "./header/horizontal-filter";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

const manrope = Manrope({ subsets: ["latin"] });

interface HeaderProps {
  typeOptions: string[];
  tagOptions: string[];
}

export function Header({ typeOptions, tagOptions }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-20 pb-16 pt-10"
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
          <div className="mb-4 flex flex-col items-start gap-4 md:flex-row md:items-end md:gap-7">
            <div className="relative w-[200px] md:w-auto">
              <Image
                src="/site-assets/logo.svg"
                alt="cur8d.club"
                height={82}
                width={328}
                priority
                className="h-auto w-full max-w-[200px] object-contain object-left md:max-w-[328px]"
              />
            </div>
            <div
              className={`${manrope.className} mt-0 flex w-full flex-col justify-center md:mt-0 md:w-auto`}
            >
              <p className="text-l max-w-[70%] leading-tight text-gray-700 md:max-w-[400px]">
                Discover inspiring designers ✦ builders ✦ groups. Curated by{" "}
                <Link
                  href="https://x.com/notjerrywang"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-900 hover:underline"
                >
                  @Jerry
                </Link>
                , updates every week.
              </p>
            </div>
          </div>

          <HorizontalFilter tagOptions={tagOptions} typeOptions={typeOptions} />
        </div>
      </div>
    </header>
  );
}

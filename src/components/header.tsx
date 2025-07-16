import { Manrope } from "next/font/google";
import { HorizontalFilter } from "./header/horizontal-filter";
import Image from "next/image";
import Link from "next/link";

const manrope = Manrope({ subsets: ["latin"] });

interface HeaderProps {
  typeOptions: string[];
  tagOptions: string[];
}

export function Header({ typeOptions, tagOptions }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-20 pt-10 pb-10"
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
          {/* 3-column layout */}
          <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:justify-between md:gap-0">
            {/* Left: Filters */}
            <div className="flex justify-start md:w-1/3 md:justify-start">
              <HorizontalFilter tagOptions={tagOptions} typeOptions={typeOptions} />
            </div>
            {/* Center: Logo */}
            <div className="flex justify-center md:w-1/3 md:items-stretch md:justify-center">
              <div className="relative flex h-full items-center justify-center">
                <div className="relative aspect-[328/82] h-full max-h-[120px] w-auto">
                  <Image
                    src="/site-assets/logo.svg"
                    alt="cur8d.club"
                    fill
                    priority
                    className="object-contain object-center"
                  />
                </div>
              </div>
            </div>
            {/* Right: Description/Links */}
            <div className={`${manrope.className} mt-0 flex w-full flex-col items-end justify-center md:mt-0 md:w-1/3 md:items-end md:justify-end`}>
              <p className="text-l max-w-full text-right leading-tight text-neutral-700 md:max-w-[400px]">
                Discover inspiring designers every week. 
                <br />
                Curated by{" "}
                <Link
                  href="https://x.com/notjerrywang"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-900 hover:underline"
                >
                  ↳ @Jerry
                </Link>
                <br />
                <span className="text-l leading-tight text-neutral-700">
                  Have someone in mind?{" "}
                </span>
                <Link
                  href="https://form.typeform.com/to/T4Xb0N7L"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-l leading-tight text-neutral-900 hover:underline"
                >
                   ↳ Submit a referral
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

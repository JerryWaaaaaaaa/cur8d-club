import { Manrope } from "next/font/google";
import { HorizontalFilter } from "./header/horizontal-filter";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ContentDialog } from "@/components/ui/content-dialog";

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
              <ContentDialog 
                title="cur8d.club Manifesto"
                description={
                  <>
                    Our mission is to celebrate and elevate the work of exceptional designers, builders, and creative groups who are pushing the boundaries of digital creation. We believe in the power of curation to cut through the noise and highlight truly innovative work that deserves recognition.
                    <br /><br />
                    In a world of endless scrolling and algorithm-driven content, cur8d.club stands as a thoughtfully assembled collection of inspirational creators who demonstrate excellence, originality, and impact in their fields. Each featured entity has been personally selected for their unique vision and contribution to the creative landscape.
                    <br /><br />
                    We value quality over quantity, meaningful creation over viral trends, and sustainable creative practices that contribute to a healthy digital ecosystem. Our curation philosophy centers on discovering voices that might otherwise be overlooked and connecting them with an audience that appreciates intentional, purpose-driven work.
                    <br /><br />
                    As we grow, we remain committed to regular updates, diverse representation, and maintaining a high standard for what it means to be featured in our collection. We invite you to explore, be inspired, and perhaps discover your next favorite creator.
                  </>
                }
              >
                <span className="text-l max-w-[70%] cursor-pointer leading-tight text-gray-900 hover:underline md:max-w-[400px]">
                  manifesto→
                </span>
              </ContentDialog>
            </div>
          </div>

          <HorizontalFilter tagOptions={tagOptions} typeOptions={typeOptions} />
        </div>
      </div>
    </header>
  );
}

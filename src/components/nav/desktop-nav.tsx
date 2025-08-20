"use client";

import { Manrope } from "next/font/google";
import { HorizontalFilter } from "./horizontal-filter";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SubmissionForm } from "../submission-form";

const manrope = Manrope({ subsets: ["latin"] });

interface DesktopNavProps {
  typeOptions: string[];
  tagOptions: string[];
}

export function DesktopNav({ typeOptions, tagOptions }: DesktopNavProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <>
      <header
        className="hidden md:block sticky top-0 z-20 pt-6 md:pt-8 lg:pt-10 pb-6 md:pb-8 lg:pb-10"
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
        <div className="container mx-auto px-4 md:px-6 lg:px-8 pb-4 md:pb-6">
          <div className="flex flex-col gap-3 md:gap-4">
            {/* Mobile and Desktop: 3-column layout */}
            <div className="hidden lg:flex flex-col gap-3 md:gap-4 lg:gap-6 md:flex-row md:items-center md:justify-between">
              {/* Left: Filters */}
              <div className="flex justify-start md:flex-1 md:justify-start">
                <HorizontalFilter tagOptions={tagOptions} typeOptions={typeOptions} />
              </div>
              {/* Center: Logo */}
              <div className="flex justify-center md:w-[160px] lg:w-[200px] md:flex-shrink-0 md:items-center md:justify-center">
                <div className="relative flex h-full items-center justify-center">
                  <div className="relative h-[40px] w-[150px] md:h-[44px] md:w-[160px] lg:h-[48px] lg:w-[180px]">
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
              <div className={`${manrope.className} mt-0 flex w-full flex-col items-end justify-center md:mt-0 md:flex-1 md:items-end md:justify-center`}>
                <p className="text-sm md:text-base lg:text-l max-w-full text-right leading-tight text-neutral-700 md:max-w-[300px] lg:max-w-[400px]">
                  Made by{" "}
                  <Link
                    href="https://x.com/notjerrywang"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-900 hover:underline"
                  >
                    @Jerry ↵
                  </Link>
                  <br />
                  <span className="text-sm md:text-base lg:text-l leading-tight text-neutral-700">
                    Have someone in mind?{" "}
                  </span>
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="text-sm md:text-base lg:text-l leading-tight text-neutral-900 hover:underline"
                  >
                     Submit a referral ↵
                  </button>
                </p>
              </div>
            </div>

            {/* Tablet: 2-column layout with left content and right logo */}
            <div className="lg:hidden flex flex-col md:flex-row md:items-start md:justify-between">
              {/* Left: Description and Filters stacked vertically */}
              <div className="flex flex-col gap-3 md:gap-3 md:flex-1">
                {/* Description text */}
                <div className={`${manrope.className} flex flex-col`}>
                  <p className="text-sm md:text-base lg:text-l max-w-full leading-tight text-neutral-700">
                    Made by{" "}
                    <Link
                      href="https://x.com/notjerrywang"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-900 hover:underline"
                    >
                      @Jerry ↵
                    </Link>
                    <br />
                    <span className="text-sm md:text-base lg:text-l leading-tight text-neutral-700">
                      Have someone in mind?{" "}
                      <button
                        onClick={() => setIsFormOpen(true)}
                        className="text-neutral-900 hover:underline"
                      >
                        Submit a referral ↵
                      </button>
                    </span>
                  </p>
                </div>
                {/* Filters */}
                <div className="flex justify-start">
                  <HorizontalFilter tagOptions={tagOptions} typeOptions={typeOptions} />
                </div>
              </div>
              
              {/* Right: Logo */}
              <div className="flex justify-end md:flex-shrink-0 md:items-start">
                <div className="relative flex h-full items-center justify-center">
                  <div className="relative h-[40px] w-[150px] md:h-[44px] md:w-[160px]">
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
            </div>
          </div>
        </div>
      </header>
      
      <SubmissionForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
      />
    </>
  );
} 
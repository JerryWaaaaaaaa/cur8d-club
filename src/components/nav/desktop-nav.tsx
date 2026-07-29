"use client";

import { Manrope } from "next/font/google";
import { HorizontalFilter } from "./horizontal-filter";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SubmissionForm } from "../submission-form";
import { useViewParams } from "@/hooks/params-parsers/use-view-params";
import { ViewToggle } from "./view-toggle";
import { CaseStudyFilter } from "./case-study-filter";

const manrope = Manrope({ subsets: ["latin"] });

interface DesktopNavProps {
  typeOptions: string[];
  tagOptions: string[];
  caseStudyTypeOptions: string[];
  caseStudyIndustryOptions: string[];
}

export function DesktopNav({
  typeOptions,
  tagOptions,
  caseStudyTypeOptions,
  caseStudyIndustryOptions,
}: DesktopNavProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [{ view }] = useViewParams();

  const filters =
    view === "case-study" ? (
      <CaseStudyFilter
        typeOptions={caseStudyTypeOptions}
        industryOptions={caseStudyIndustryOptions}
      />
    ) : (
      <HorizontalFilter tagOptions={tagOptions} typeOptions={typeOptions} />
    );

  return (
    <>
      <header
        className="sticky top-0 z-20 hidden pb-6 pt-6 md:block md:pb-8 md:pt-8 lg:pb-10 lg:pt-10"
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
        <div className="container mx-auto px-4 pb-4 md:px-6 md:pb-6 lg:px-8">
          <div className="flex flex-col gap-3 md:gap-4">
            {/* Mobile and Desktop: 3-column layout */}
            <div className="hidden flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4 lg:flex lg:gap-6">
              {/* Left: controls, top-aligned with the logo and the text */}
              <div className="flex flex-wrap items-center gap-2 md:flex-1">
                <ViewToggle />
                {filters}
              </div>
              {/* Center: Logo */}
              <div className="flex justify-center md:w-[160px] md:flex-shrink-0 md:items-center md:justify-center lg:w-[200px]">
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
              <div
                className={`${manrope.className} mt-0 flex w-full flex-col items-end justify-center md:mt-0 md:flex-1 md:items-end md:justify-center`}
              >
                <p className="lg:text-l max-w-full text-right text-sm leading-tight text-neutral-700 md:max-w-[300px] md:text-base lg:max-w-[400px]">
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
                  <span className="lg:text-l text-sm leading-tight text-neutral-700 md:text-base">
                    Have someone in mind?{" "}
                  </span>
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="lg:text-l text-sm leading-tight text-neutral-900 hover:underline md:text-base"
                  >
                    Submit a referral ↵
                  </button>
                </p>
              </div>
            </div>

            {/* Tablet: 2-column layout with left content and right logo */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between lg:hidden">
              {/* Left: Description and Filters stacked vertically */}
              <div className="flex flex-col gap-3 md:flex-1 md:gap-3">
                {/* Description text */}
                <div className={`${manrope.className} flex flex-col`}>
                  <p className="lg:text-l max-w-full text-sm leading-tight text-neutral-700 md:text-base">
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
                    <span className="lg:text-l text-sm leading-tight text-neutral-700 md:text-base">
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
                <div className="flex flex-wrap items-center gap-2">
                  <ViewToggle />
                  {filters}
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

      <SubmissionForm open={isFormOpen} onOpenChange={setIsFormOpen} />
    </>
  );
}

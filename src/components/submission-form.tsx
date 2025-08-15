"use client";

import { useState, useEffect } from "react";
import { Manrope } from "next/font/google";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { CheckCircle } from "@phosphor-icons/react";
import Image from "next/image";

const manrope = Manrope({ subsets: ["latin"] });

const EXPERTISE_OPTIONS = [
  { id: "web-app", label: "web app", letter: "A" },
  { id: "mobile-app", label: "mobile app", letter: "B" },
  { id: "website", label: "website", letter: "C" },
  { id: "brand", label: "brand", letter: "D" },
  { id: "creative", label: "creative", letter: "E" },
  { id: "animation", label: "animation", letter: "F" },
  { id: "coding", label: "coding", letter: "G" },
];

interface SubmissionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubmissionForm({ open, onOpenChange }: SubmissionFormProps) {
  const [step, setStep] = useState(1);
  const [designerUrl, setDesignerUrl] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [referrerUrl, setReferrerUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset form state whenever the form is opened
  useEffect(() => {
    if (open) {
      setStep(1);
      setDesignerUrl("");
      setSelectedExpertise([]);
      setReferrerUrl("");
      setIsSubmitting(false);
      setIsSubmitted(false);
    }
  }, [open]);

  const handleExpertiseToggle = (expertiseId: string) => {
    setSelectedExpertise(prev => {
      if (prev.includes(expertiseId)) {
        return prev.filter(id => id !== expertiseId);
      } else if (prev.length < 3) {
        return [...prev, expertiseId];
      }
      return prev;
    });
  };

  const handleNext = () => {
    if (step === 1 && designerUrl.trim()) {
      setStep(2);
    } else if (step === 2 && selectedExpertise.length === 3) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!designerUrl.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          designerUrl: designerUrl.trim(),
          expertiseAreas: selectedExpertise,
          referrerUrl: referrerUrl.trim() || null,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          onOpenChange(false);
        }, 3000);
      } else {
        throw new Error("Failed to submit");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && step === 1 && designerUrl.trim()) {
      e.preventDefault();
      handleNext();
    } else if (e.key === "Enter" && step === 2 && selectedExpertise.length === 3) {
      e.preventDefault();
      handleNext();
    } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && step === 3) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleExpertiseKeyDown = (e: React.KeyboardEvent, expertiseId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleExpertiseToggle(expertiseId);
    }
  };

  if (isSubmitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`!fixed !inset-0 !z-50 !flex !items-center !justify-center !p-4 !bg-white !border-0 !shadow-none !left-0 !top-0 !translate-x-0 !translate-y-0 !w-full !h-full !max-w-none !rounded-none !duration-0 !data-[state=open]:!animate-none !data-[state=closed]:!animate-none ${manrope.className}`}>
          <div className="w-full max-w-[400px] text-center">
            <div className="mb-6">
              {/* Logo */}
              <div className="flex justify-center mb-4">
                <div className="relative w-[240px] h-[80px]">
                  <Image
                    src="/site-assets/logo.svg"
                    alt="cur8d.club"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
            
            <h2 className="text-2xl font-medium mb-2">
              Thank you so much for helping cur8d.club grow :)
            </h2>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`!fixed !inset-0 !z-50 !flex !items-center !justify-center !p-4 !bg-white !border-0 !shadow-none !left-0 !top-0 !translate-x-0 !translate-y-0 !w-full !h-full !max-w-none !rounded-none !duration-0 !data-[state=open]:!animate-none !data-[state=closed]:!animate-none ${manrope.className}`}>
        <div className="w-full max-w-[480px]">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-medium mb-2">
                  1. Who&apos;s the designer you want to recommend?*
                </h2>
                <p className="text-gray-600">
                  Drop their social or website link so we can take a look :)
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={designerUrl}
                    onChange={(e) => setDesignerUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="https://"
                    className="w-full pl-0 pr-4 py-2 border-b border-gray-300 focus:outline-none focus:border-black"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <Button
                    variant="primary"
                    onClick={handleNext}
                    disabled={!designerUrl.trim()}
                  >
                    Continue
                  </Button>
                  {/* <span className="text-sm text-gray-500">press Enter ↵</span> */}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-medium mb-2">
                  2. What is their area of expertise?*
                </h2>
                <p className="text-gray-600">
                  Choose the top 3 areas of expertise that impress you the most.
                </p>
              </div>
              
              <div className="space-y-3">
                {EXPERTISE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleExpertiseToggle(option.id)}
                    onKeyDown={(e) => handleExpertiseKeyDown(e, option.id)}
                    className={`w-full flex items-center p-3 rounded-full border transition-colors ${
                      selectedExpertise.includes(option.id)
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center mr-3">
                      {selectedExpertise.includes(option.id) ? (
                        <CheckCircle weight="fill" className="h-6 w-6 text-white" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-gray-300 bg-white"></div>
                      )}
                    </div>
                    <span className="capitalize">{option.label}</span>
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={selectedExpertise.length !== 3}
                >
                  Continue
                </Button>
                {/* <span className="text-sm text-gray-500">press Enter ↵</span> */}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-medium mb-2">
                  3. Do you want to let them know that you recommended them?
                </h2>
                <p className="text-gray-600">
                  It can totally be anonymous, but if you share your profile, we&apos;ll tag you as the referrer when we feature them on social media.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={referrerUrl}
                    onChange={(e) => setReferrerUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="https://"
                    className="w-full pl-0 pr-4 py-2 border-b border-gray-300 focus:outline-none focus:border-black"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                  {/* <span className="text-sm text-gray-500">press Cmd ⌘ + Enter ←</span> */}
                </div>
              </div>
              
              {/* <div className="text-xs text-gray-500">
                Never submit passwords! - <a href="#" className="text-blue-600 underline">Report abuse</a>
              </div> */}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

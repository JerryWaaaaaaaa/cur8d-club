import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";

interface MobileDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: string[];
  selectedOptions?: string[];
  onOptionSelect: (option: string) => void;
  multiSelect?: boolean;
}

export function MobileDropdown({
  open,
  onOpenChange,
  title,
  options,
  selectedOptions = [],
  onOptionSelect,
  multiSelect = false,
}: MobileDropdownProps) {
  const handleOptionClick = (option: string) => {
    if (multiSelect) {
      // For multi-select, toggle the option
      if (selectedOptions.includes(option)) {
        onOptionSelect(option); // Remove
      } else {
        onOptionSelect(option); // Add
      }
    } else {
      // For single-select, select the option and close
      onOptionSelect(option);
      onOpenChange(false);
    }
  };

  const isSelected = (option: string) => {
    return selectedOptions.includes(option);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/10 backdrop-blur-[96px]"
          onClick={() => onOpenChange(false)}
        >
          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative w-full max-w-sm h-screen flex flex-col justify-end pt-3 px-2 pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2 h-full">
              {/* Filter Options Container */}
              <div className="flex flex-col gap-2 flex-1">
                {options.map((option) => (
                  <motion.button
                    key={option}
                    onClick={() => handleOptionClick(option)}
                    className={cn(
                      "flex items-center justify-center px-4 py-2 text-base font-normal rounded-full transition-colors relative basis-0 grow w-full",
                      isSelected(option)
                        ? "bg-neutral-50 text-neutral-900"
                        : "text-neutral-900"
                    )}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-center">{option}</span>
                    {isSelected(option) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute left-6 flex items-center"
                      >
                        <CheckCircle weight="fill" className="h-5 w-5" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Dismiss Button */}
              <motion.button
                onClick={() => onOpenChange(false)}
                className="flex h-20 w-full items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-200 shrink-0"
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <X className="h-6 w-6" />
                </motion.div>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 
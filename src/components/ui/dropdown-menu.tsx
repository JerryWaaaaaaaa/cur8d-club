import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { CheckCircle } from "@phosphor-icons/react";
import * as React from "react";
import { AnimatePresence, motion } from "motion/react";

// Styled DropdownMenu Content
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof RadixDropdownMenu.Content>,
  React.ComponentPropsWithoutRef<typeof RadixDropdownMenu.Content> & { open?: boolean }
>(({ className, children, open, ...props }, ref) => {
  return (
    <RadixDropdownMenu.Portal>
      <AnimatePresence>
        {open && (
          <RadixDropdownMenu.Content
            ref={ref}
            align="start"
            sideOffset={8}
            asChild={false}
            className={cn(
              "z-50 mt-0 min-w-[244px] rounded-3xl bg-neutral-200 py-1.5 px-1.5 overflow-hidden",
              className
            )}
            {...props}
            style={{ ...props.style, overflow: "hidden" }}
          >
            <motion.div
              className="flex flex-col gap-1.5"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {children}
            </motion.div>
          </RadixDropdownMenu.Content>
        )}
      </AnimatePresence>
    </RadixDropdownMenu.Portal>
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

// Styled DropdownMenu Item
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof RadixDropdownMenu.Item>,
  React.ComponentPropsWithoutRef<typeof RadixDropdownMenu.Item> & {
    selected?: boolean;
  }
>(({ className, children, selected, ...props }, ref) => (
  <RadixDropdownMenu.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer items-center justify-center px-2 py-2 text-sm font-normal rounded-full transition-colors outline-none focus:outline-none focus:ring-0 text-center min-h-[36px]",
              selected
          ? "bg-neutral-300 text-neutral-900"
          : "hover:bg-neutral-300 text-neutral-900",
      className
    )}
    {...props}
  >
    {selected && (
      <span className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center">
        <CheckCircle weight="fill" className="h-5 w-5" />
      </span>
    )}
    {children}
  </RadixDropdownMenu.Item>
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenu = {
  Root: RadixDropdownMenu.Root,
  Trigger: RadixDropdownMenu.Trigger,
  Content: DropdownMenuContent,
  Item: DropdownMenuItem,
  Portal: RadixDropdownMenu.Portal,
}; 
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { Check } from "@phosphor-icons/react";
import * as React from "react";

// Styled DropdownMenu Content
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof RadixDropdownMenu.Content>,
  React.ComponentPropsWithoutRef<typeof RadixDropdownMenu.Content>
>(({ className, children, ...props }, ref) => (
  <RadixDropdownMenu.Portal>
    <RadixDropdownMenu.Content
      ref={ref}
      align="start"
      sideOffset={8}
      asChild={false}
      className={cn(
        "z-50 mt-2 min-w-[244px] rounded-3xl bg-gray-200 py-1.5 px-1.5 flex flex-col gap-1.5",
        className
      )}
      {...props}
    >
      {children}
    </RadixDropdownMenu.Content>
  </RadixDropdownMenu.Portal>
));
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
        ? "bg-gray-300 text-gray-900"
        : "hover:bg-gray-300 text-gray-900",
      className
    )}
    {...props}
  >
    {selected && (
      <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
        <Check weight="bold" className="h-4 w-4" />
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
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

interface ManifestoOverlayProps {
  trigger: React.ReactNode;
}

export function ManifestoOverlay({ trigger }: ManifestoOverlayProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-[800px] p-0 overflow-hidden gap-0">
        <DialogHeader className="sticky m-0 top-0 z-10 p-6 pb-0">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-semibold">Why i built cur8d.club</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-6">
          <DialogDescription className="text-foreground space-y-0 text-base leading-relaxed">
            <p>
              When I first started my career as a designer, I often felt like I was navigating the design world alone. Working as the founding and only designer at a startup, there was no benchmark, no critique, and no clear sense of what "good" looked like. It was a lonely experience, filled with uncertainty about my own progress and potential. To find my footing, I turned to the work of others, seeking inspiration and a sense of direction.
            </p>
            <br /> 
            <p>
              Now, after years of navigating this path, I've come to realize the importance of a tribe—a conceptual community of designers whose work I admire and aspire to. This idea of a "tribe" isn't about a physical group, but rather a collective of individuals who share a passion for design, a commitment to craftsmanship, and a drive for excellence.
            </p>
            <br />
            <p>
              cur8d.club was born out of this realization. It's a curated space designed to help designers—especially those working in isolation—find inspiration and motivation. By bringing together the work of designers I admire, I hope to create a sense of companionship, a virtual support system where you can find your own role models and feel less alone in your creative journey.
            </p>
            <br />
            <p>
              The goal is not just to observe but to engage—to raise the bar for your own work, to be vocal, and to eventually build connections that might lead you to become part of this tribe in reality. It's about visibility, shared enthusiasm, and the pursuit of excellence. cur8d.club is my attempt to bridge the gap between solitude and community, offering a place where you can discover, connect, and grow. I invite you to explore, engage, and find your own tribe :)
            </p>
          </DialogDescription>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 
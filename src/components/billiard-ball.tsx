import { cn } from "@/lib/utils";
import Image from "next/image";

interface BilliardBallProps {
  className?: string;
  ballType?: keyof typeof BALL_TYPE_IMAGES;
  spin?: boolean;
}

const BALL_TYPE_IMAGES = {
  "8-ball": "/balls/8-ball.svg",
  "cue-ball": "/balls/cue-ball.svg",
} as const;

function BilliardBall({
  className,
  ballType = "cue-ball",
  spin = false,
}: BilliardBallProps) {
  return (
    <Image
      src={BALL_TYPE_IMAGES[ballType]}
      alt="Loading ball"
      width={16}
      height={16}
      className={cn("h-16 w-16", spin && "animate-spin", className)}
    />
  );
}

export default BilliardBall;

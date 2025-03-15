import { cn } from "@/lib/utils";
import Image from "next/image";

interface LoadingBallProps {
  className?: string;
  ballType?: keyof typeof BALL_TYPE_IMAGES;
}

const BALL_TYPE_IMAGES = {
  "8-ball": "/balls/8-ball.svg",
  "cue-ball": "/balls/cue-ball.svg",
} as const;

function LoadingBall({ className, ballType = "cue-ball" }: LoadingBallProps) {
  return (
    <Image
      src={BALL_TYPE_IMAGES[ballType]}
      alt="Loading ball"
      width={16}
      height={16}
      className={cn("h-16 w-16 animate-spin", className)}
    />
  );
}

export default LoadingBall;

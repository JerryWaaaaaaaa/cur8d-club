import { Button } from "@/components/ui/button"
import { TwitterLogo, LinkedinLogo, GithubLogo } from "@phosphor-icons/react"

interface SocialMediaButtonsProps {
  twitter?: string
  linkedin?: string
  github?: string
}

export function SocialMediaButtons({ twitter, linkedin, github }: SocialMediaButtonsProps) {
  return (
    <>
      {twitter && (
        <Button variant="ghost" size="icon" className="h-10 w-10 bg-transparent hover:bg-white/20 text-white" asChild>
          <a href={twitter} target="_blank" rel="noopener noreferrer">
            <TwitterLogo weight="fill" className="h-5 w-5" />
          </a>
        </Button>
      )}
      {linkedin && (
        <Button variant="ghost" size="icon" className="h-10 w-10 bg-transparent hover:bg-white/20 text-white" asChild>
          <a href={linkedin} target="_blank" rel="noopener noreferrer">
            <LinkedinLogo weight="fill" className="h-5 w-5" />
          </a>
        </Button>
      )}
      {github && (
        <Button variant="ghost" size="icon" className="h-10 w-10 bg-transparent hover:bg-white/20 text-white" asChild>
          <a href={github} target="_blank" rel="noopener noreferrer">
            <GithubLogo weight="fill" className="h-5 w-5" />
          </a>
        </Button>
      )}
    </>
  )
}


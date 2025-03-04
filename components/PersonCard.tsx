"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Globe } from "@phosphor-icons/react"
import { ImagePlaceholder } from "./ImagePlaceholder"
import type { Person } from "../types/person"
import { useState } from "react"

interface PersonCardProps {
  person: Person
}

export function PersonCard({ person }: PersonCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <div>
      <div className="aspect-square bg-gray-100 mb-4 relative overflow-hidden">
        <span className="absolute top-2 left-2 z-10 bg-black text-white text-xs px-2 py-1 rounded-full">
          {person.type.charAt(0).toUpperCase() + person.type.slice(1)}
        </span>
        {person.url && (
          <Button
            size="icon"
            variant="outline"
            className="absolute top-2 right-2 z-10 bg-gray-200 hover:bg-gray-300 h-auto w-auto p-1 rounded-full border-0"
            asChild
          >
            <a href={person.url} target="_blank" rel="noopener noreferrer">
              <Globe className="h-3.5 w-3.5 text-gray-600" />
              <span className="sr-only">Visit {person.name}'s website</span>
            </a>
          </Button>
        )}
        {person.image && !imageError ? (
          <Image
            src={person.image || "/placeholder.svg"}
            alt={person.name}
            fill
            className="object-contain p-8"
            onError={() => setImageError(true)}
          />
        ) : (
          <ImagePlaceholder name={person.name} className="p-8" />
        )}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">{person.name}</h2>
        </div>
        <div className="text-sm text-gray-600">{person.tags.join(", ")}</div>
      </div>
    </div>
  )
}


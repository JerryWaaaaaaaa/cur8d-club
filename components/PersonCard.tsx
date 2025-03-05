"use client"

import type React from "react"

import Image from "next/image"
import { Globe } from "@phosphor-icons/react"
import { ImagePlaceholder } from "./ImagePlaceholder"
import type { Person } from "../types/person"
import { useState } from "react"

interface PersonCardProps {
  person: Person
}

export function PersonCard({ person }: PersonCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Handle button click to prevent it from triggering the parent link
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    window.open(person.url, "_blank", "noopener,noreferrer")
  }

  const cardContent = (
    <>
      <div className="aspect-square bg-[#F5F5F5] mb-3 relative overflow-hidden">
        <span className="absolute top-2 left-2 z-10 bg-black text-white text-xs px-2 flex items-center h-[22px] rounded-full">
          {person.type.charAt(0).toUpperCase() + person.type.slice(1)}
        </span>
        {person.url && (
          <div className="absolute top-2 right-2 z-10 flex items-center">
            <div
              onClick={handleButtonClick}
              className={`
        flex items-center bg-gray-200 hover:bg-gray-300 rounded-full 
        h-[22px] cursor-pointer overflow-hidden
        transition-all duration-200 ease-out
        ${isHovered ? "w-[54px]" : "w-[22px]"}
      `}
            >
              <div className="flex items-center justify-center w-[22px] flex-shrink-0">
                <Globe className="h-3.5 w-3.5 text-gray-600" />
              </div>
              <span className="text-xs text-gray-600 whitespace-nowrap pl-0">Visit</span>
              <span className="sr-only">Visit</span>
            </div>
          </div>
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
          <ImagePlaceholder name={person.name} />
        )}
      </div>
      <div className="space-y-0">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">{person.name}</h2>
        </div>
        <div className="text-sm text-gray-600">{person.tags.join(", ")}</div>
      </div>
    </>
  )

  if (!person.url) {
    return (
      <div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        {cardContent}
      </div>
    )
  }

  return (
    <a
      href={person.url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {cardContent}
    </a>
  )
}


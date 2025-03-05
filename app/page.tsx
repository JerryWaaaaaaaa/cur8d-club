"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Manrope } from "next/font/google"
import { Header } from "@/components/Header"
import { PersonCard } from "@/components/PersonCard"
import { Globe } from "@phosphor-icons/react"
import type { Person } from "@/types/person"

const manrope = Manrope({ subsets: ["latin"] })

interface PaginationData {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function Page() {
  const [people, setPeople] = useState<Person[]>([])
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const loadingRef = useRef<HTMLDivElement>(null)

  const fetchPeople = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/people?page=${page}&limit=12`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || errorData?.details || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setPeople((prev) => (page === 1 ? data.people : [...prev, ...data.people]))
      setPagination(data.pagination)

      if (page === 1) {
        const tags = Array.from(new Set(data.people.flatMap((p: Person) => p.tags)))
        setAllTags(tags)
      }
    } catch (error) {
      console.error("Error fetching people:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPeople()
  }, [fetchPeople])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0]
        if (firstEntry.isIntersecting && pagination && pagination.page < pagination.totalPages && !loading) {
          fetchPeople(pagination.page + 1)
        }
      },
      {
        rootMargin: "100px",
      },
    )

    if (loadingRef.current) {
      observer.observe(loadingRef.current)
    }

    return () => observer.disconnect()
  }, [pagination, loading, fetchPeople])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const handleReset = () => {
    setSelectedTag(null)
    setSelectedType(null)
  }

  const filteredPeople = people.filter((person) => {
    const tagMatch = !selectedTag || person.tags.includes(selectedTag)
    const typeMatch = !selectedType || person.type === selectedType
    return tagMatch && typeMatch
  })

  return (
    <div className={`min-h-screen ${manrope.className}`} style={{ backgroundColor: "#FDFEFF" }}>
      <Header
        tags={allTags}
        selectedTag={selectedTag}
        selectedType={selectedType}
        onTagSelect={setSelectedTag}
        onTypeSelect={setSelectedType}
        onReset={handleReset}
      />

      <main className="container mx-auto px-4 pt-8 pb-8">
        {error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={handleRetry} className="px-4 py-2 bg-black text-white rounded-full hover:bg-black/90">
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {filteredPeople.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
            {pagination && pagination.page < pagination.totalPages && (
              <div ref={loadingRef} className="flex justify-center items-center py-8">
                {loading && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Globe className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading more...</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}


import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request) {
  try {
    // ✅ Ensure URL is correctly handled
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Number.parseInt(searchParams.get("limit") || "12", 10)
    const start = (page - 1) * limit
    const end = start + limit - 1

    // ✅ First get the count
    const { count, error: countError } = await supabase.from("people").select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Count query error:", countError)
      return NextResponse.json({ error: `Count error: ${countError.message}` }, { status: 500 })
    }

    // ✅ Then fetch the paginated data
    const { data, error } = await supabase
      .from("people")
      .select("*")
      .range(start, end)
      .order("name", { ascending: true })

    if (error) {
      console.error("Supabase query error:", error)
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No data found" }, { status: 404 })
    }

    // ✅ Ensure count is valid
    const totalRecords = count ?? 0
    const totalPages = Math.ceil(totalRecords / limit)

    // ✅ Format data correctly
    const people = data.map((person) => ({
      id: person.id,
      name: person.name,
      role: person.role || "",
      type: person.type?.toLowerCase() || "unknown",
      url: person.url,
      tags: person.tags || [],
      image: person.image || null,
    }))

    return NextResponse.json({
      people,
      pagination: { total: totalRecords, page, limit, totalPages },
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}


import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { submissions } from "@/server/db/schema";
import { randomUUID } from "crypto";
import { z } from "zod";

const submissionSchema = z.object({
  designerUrl: z.string().min(1),
  expertiseAreas: z.array(z.string()).length(3),
  referrerUrl: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as unknown;
    const validatedData = submissionSchema.parse(body);
    const { designerUrl, expertiseAreas, referrerUrl } = validatedData;

    // Create submission
    const submission = await db.insert(submissions).values({
      id: randomUUID(),
      createdAt: new Date(),
      designerUrl,
      expertiseAreas,
      referrerUrl: referrerUrl || null,
    }).returning();

    return NextResponse.json({ success: true, submission: submission[0] });
  } catch (error) {
    console.error("Submission error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

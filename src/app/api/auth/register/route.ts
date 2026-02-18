import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// REGISTER a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }
    
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })
    
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }
    
    // Create user (in production, hash the password with bcrypt)
    const user = await db.user.create({
      data: {
        email,
        password, // Store plain text for demo - use bcrypt in production
        name,
      },
    })
    
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    })
  } catch (error) {
    console.error("Error registering user:", error)
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 })
  }
}

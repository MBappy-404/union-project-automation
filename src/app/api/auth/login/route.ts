import { NextRequest, NextResponse } from "next/server";
import {
  validateCredentials,
  createSessionToken,
  AUTH_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "ইমেইল এবং পাসওয়ার্ড উভয়ই পূরণ করা আবশ্যক।",
        },
        { status: 400 }
      );
    }

    const user = validateCredentials(email, password);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "প্রদত্ত ইমেইল বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
        },
        { status: 401 }
      );
    }

    const days = rememberMe ? 30 : 7;
    const token = createSessionToken(user, days);

    const response = NextResponse.json({
      success: true,
      message: "সফলভাবে লগইন হয়েছে। স্বাগতম!",
      user,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: days * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।",
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "100";
    const offset = searchParams.get("offset") || "0";
    const role_filter = searchParams.get("role_filter") || "";
    const is_active_filter = searchParams.get("is_active_filter") || "";
    const is_verified_filter = searchParams.get("is_verified_filter") || "";

    let url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/users/admin?limit=${limit}&offset=${offset}`;

    if (role_filter) {
      url += `&role_filter=${role_filter}`;
    }
    if (is_active_filter) {
      url += `&is_active_filter=${is_active_filter}`;
    }
    if (is_verified_filter) {
      url += `&is_verified_filter=${is_verified_filter}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch users", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Users list API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

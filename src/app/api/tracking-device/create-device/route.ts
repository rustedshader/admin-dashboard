import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    const deviceData = await request.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/tracking-device/create-device`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deviceData),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: "Failed to create tracking device", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Tracking device creation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.BACKEND_API_URL || "https://api.rustedshader.com";

export async function GET(
  request: NextRequest,
  { params }: { params: { trip_id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    const tripId = params.trip_id;

    const response = await fetch(
      `${API_BASE_URL}/tracking/admin/trip/${tripId}/live-location`,
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        {
          error: `Backend API error: ${response.statusText}`,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying to backend API:", error);
    return NextResponse.json(
      { error: "Failed to fetch trip live location" },
      { status: 500 }
    );
  }
}

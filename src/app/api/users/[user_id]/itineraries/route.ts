import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    const { user_id } = await params;

    // Try admin itineraries endpoint with user_id query parameter
    const response = await fetch(
      `https://api.rustedshader.com/itineraries/admin?user_id=${user_id}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      // If admin endpoint doesn't exist, try general itineraries endpoint
      // and filter by user_id on the frontend
      const fallbackResponse = await fetch(
        `https://api.rustedshader.com/itineraries/`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
        }
      );

      if (!fallbackResponse.ok) {
        const errorData = await response.text();
        return NextResponse.json(
          {
            error: "Failed to fetch user itineraries",
            details: errorData,
          },
          { status: response.status }
        );
      }

      const fallbackData = await fallbackResponse.json();
      // Filter itineraries for the specific user
      const filteredItineraries = Array.isArray(fallbackData)
        ? fallbackData.filter(
            (itinerary: any) =>
              itinerary.user_id?.toString() === user_id ||
              itinerary.owner_id?.toString() === user_id
          )
        : [];

      return NextResponse.json(filteredItineraries);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("User itineraries API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

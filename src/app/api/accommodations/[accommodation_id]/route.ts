import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINTS, buildApiUrl } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accommodation_id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const accommodationId = parseInt(resolvedParams.accommodation_id);
    if (isNaN(accommodationId)) {
      return NextResponse.json(
        { error: "Invalid accommodation ID" },
        { status: 400 }
      );
    }

    const url = buildApiUrl(
      API_ENDPOINTS.accommodations.details(accommodationId)
    );
    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}` };
      }
      return NextResponse.json(
        { error: "Failed to fetch accommodation", details: errorData },
        { status: response.status }
      );
    }

    const accommodation = await response.json();
    return NextResponse.json(accommodation);
  } catch (error) {
    console.error("Error fetching accommodation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ accommodation_id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const accommodationId = parseInt(resolvedParams.accommodation_id);
    if (isNaN(accommodationId)) {
      return NextResponse.json(
        { error: "Invalid accommodation ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const url = buildApiUrl(
      API_ENDPOINTS.accommodations.update(accommodationId)
    );
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}` };
      }
      return NextResponse.json(
        { error: "Failed to update accommodation", details: errorData },
        { status: response.status }
      );
    }

    const accommodation = await response.json();
    return NextResponse.json(accommodation);
  } catch (error) {
    console.error("Error updating accommodation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ accommodation_id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const accommodationId = parseInt(resolvedParams.accommodation_id);
    if (isNaN(accommodationId)) {
      return NextResponse.json(
        { error: "Invalid accommodation ID" },
        { status: 400 }
      );
    }

    const url = buildApiUrl(
      API_ENDPOINTS.accommodations.delete(accommodationId)
    );
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}` };
      }
      return NextResponse.json(
        { error: "Failed to delete accommodation", details: errorData },
        { status: response.status }
      );
    }

    // Return success response (API returns 200 for delete, not 204)
    return NextResponse.json({ message: "Accommodation deleted successfully" });
  } catch (error) {
    console.error("Error deleting accommodation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

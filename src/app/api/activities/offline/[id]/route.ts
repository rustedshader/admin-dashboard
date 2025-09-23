import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINTS, buildApiUrl } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/offline_activities/${id}`;

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
        { error: "Failed to fetch offline activity", details: errorData },
        { status: response.status }
      );
    }

    const activityData = await response.json();
    return NextResponse.json(activityData);
  } catch (error) {
    console.error("Offline activity fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const activityData = await request.json();
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/offline_activities/${id}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(activityData),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}` };
      }
      return NextResponse.json(
        { error: "Failed to update offline activity", details: errorData },
        { status: response.status }
      );
    }

    const updatedActivity = await response.json();
    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error("Offline activity update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/offline_activities/${id}`;

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
        { error: "Failed to delete offline activity", details: errorData },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error("Offline activity deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

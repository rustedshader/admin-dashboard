import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINTS, buildApiUrl } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    // Get the application data from request body
    const applicationData = await request.json();

    const url = buildApiUrl(API_ENDPOINTS.blockchainId.apply);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(applicationData),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}` };
      }
      return NextResponse.json(
        {
          error: "Failed to submit blockchain ID application",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Blockchain ID application error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

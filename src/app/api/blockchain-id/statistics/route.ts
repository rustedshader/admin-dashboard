import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINTS, buildApiUrl } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    const url = buildApiUrl(API_ENDPOINTS.blockchainId.statistics);
    const response = await fetch(url, {
      method: "GET",
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
        {
          error: "Failed to fetch blockchain ID statistics",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const statistics = await response.json();
    return NextResponse.json(statistics);
  } catch (error) {
    console.error("Blockchain ID statistics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

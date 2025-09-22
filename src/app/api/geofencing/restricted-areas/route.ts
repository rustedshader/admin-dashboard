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
    const status_filter = searchParams.get("status_filter") || "";
    const area_type_filter = searchParams.get("area_type_filter") || "";
    const limit = searchParams.get("limit") || "100";
    const offset = searchParams.get("offset") || "0";

    let url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/geofencing/restricted-areas?limit=${limit}&offset=${offset}`;
    if (status_filter) url += `&status_filter=${status_filter}`;
    if (area_type_filter) url += `&area_type_filter=${area_type_filter}`;

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
        { error: "Failed to fetch restricted areas", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform the data to match frontend expectations
    const transformedData = {
      restricted_areas: Array.isArray(data)
        ? data.map((area: any) => ({
            id: area.id.toString(), // Ensure ID is string
            name: area.name,
            description: area.description || "", // Add default description if missing
            area_type_id: area.area_type, // Map area_type to area_type_id
            area_type_name: area.area_type, // Add area_type_name for display
            coordinates: area.coordinates || [], // Add default coordinates if missing
            status: area.status,
            created_at: area.created_at,
            updated_at: area.updated_at || area.created_at, // Use created_at as fallback
          }))
        : [],
      total: Array.isArray(data) ? data.length : 0,
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Restricted areas API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    const restrictedAreaData = await request.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/geofencing/restricted-areas`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(restrictedAreaData),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: "Failed to create restricted area", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Create restricted area API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

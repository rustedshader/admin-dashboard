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
    const limit = searchParams.get("limit") || "10";
    const offset = searchParams.get("offset") || "0";

    const queryParams = new URLSearchParams({
      limit,
      offset,
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/geofencing/admin/area-types?${queryParams}`,
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
      const errorData = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch area types", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform the data to match frontend expectations
    const transformedData = {
      area_types: data.area_types
        ? data.area_types.map((type: any) => ({
            id: type.value, // Map value to id
            name: type.label, // Map label to name
            description: type.description,
            color: getColorForAreaType(type.value), // Add color based on type
            icon: getIconForAreaType(type.value), // Add icon based on type
          }))
        : [],
      total: data.area_types ? data.area_types.length : 0,
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Area types fetch API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions to add missing color and icon data
function getColorForAreaType(areaType: string): string {
  const colorMap: { [key: string]: string } = {
    restricted_zone: "#ff4444",
    danger_zone: "#ff8800",
    private_property: "#8844ff",
    protected_area: "#44ff44",
    military_zone: "#444444",
    seasonal_closure: "#4488ff",
  };
  return colorMap[areaType] || "#888888";
}

function getIconForAreaType(areaType: string): string {
  const iconMap: { [key: string]: string } = {
    restricted_zone: "🚫",
    danger_zone: "⚠️",
    private_property: "🏠",
    protected_area: "🌿",
    military_zone: "🎖️",
    seasonal_closure: "🗓️",
  };
  return iconMap[areaType] || "📍";
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

    const areaTypeData = await request.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/geofencing/admin/area-types`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(areaTypeData),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: "Failed to create area type", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Area type creation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

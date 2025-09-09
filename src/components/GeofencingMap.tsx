"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Polygon, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

interface Coordinate {
  lat: number;
  lng: number;
}

interface RestrictedArea {
  id: string;
  name: string;
  description: string;
  area_type_id: string;
  area_type_name?: string;
  coordinates: Coordinate[];
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

interface AreaType {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface GeofencingMapProps {
  mode: "view" | "create";
  onPolygonCreated?: (coordinates: Coordinate[]) => void;
  existingAreas?: RestrictedArea[];
  areaTypes?: AreaType[];
  center?: [number, number];
  zoom?: number;
}

// Drawing Control Component
function DrawingControl({
  onPolygonCreated,
}: {
  onPolygonCreated?: (coordinates: Coordinate[]) => void;
}) {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    if (!map || !onPolygonCreated) return;

    // Create feature group for drawn items
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Initialize the draw control
    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
        polygon: {
          allowIntersection: false,
          drawError: {
            color: "#e1e100",
            message: "<strong>Oh snap!</strong> you can't draw that!",
          },
          shapeOptions: {
            color: "#97009c",
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.4,
          },
        },
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });

    map.addControl(drawControl);

    // Handle polygon creation
    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.addLayer(layer);

      if (event.layerType === "polygon") {
        const latlngs = layer.getLatLngs()[0] as L.LatLng[];
        const coordinates = latlngs.map((latlng: L.LatLng) => ({
          lat: latlng.lat,
          lng: latlng.lng,
        }));
        onPolygonCreated(coordinates);
      }
    });

    // Handle polygon editing
    map.on(L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        if (layer instanceof L.Polygon) {
          const latlngs = layer.getLatLngs()[0] as L.LatLng[];
          const coordinates = latlngs.map((latlng: L.LatLng) => ({
            lat: latlng.lat,
            lng: latlng.lng,
          }));
          onPolygonCreated(coordinates);
        }
      });
    });

    // Handle polygon deletion
    map.on(L.Draw.Event.DELETED, () => {
      onPolygonCreated([]);
    });

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, onPolygonCreated]);

  return null;
}

// Areas Display Component
function AreasDisplay({
  areas,
  areaTypes,
}: {
  areas: RestrictedArea[];
  areaTypes?: AreaType[];
}) {
  const getAreaTypeColor = (areaTypeId: string) => {
    const type = areaTypes?.find((t) => t.id === areaTypeId);
    return type?.color || "#3388ff";
  };

  const getAreaTypeName = (areaTypeId: string) => {
    const type = areaTypes?.find((t) => t.id === areaTypeId);
    return type?.name || "Unknown";
  };

  return (
    <>
      {areas.map((area) => {
        if (area.coordinates.length < 3) return null;

        const positions: [number, number][] = area.coordinates.map((coord) => [
          coord.lat,
          coord.lng,
        ]);
        const color = getAreaTypeColor(area.area_type_id);

        return (
          <Polygon
            key={area.id}
            positions={positions}
            pathOptions={{
              color: color,
              weight: 3,
              opacity: area.status === "active" ? 0.8 : 0.4,
              fillOpacity: area.status === "active" ? 0.3 : 0.1,
              dashArray: area.status === "inactive" ? "5, 5" : undefined,
            }}
          >
            <Popup>
              <div className="p-2 space-y-1">
                <h3 className="font-semibold">{area.name}</h3>
                <p className="text-sm text-gray-600">{area.description}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium">Type:</span>
                  <span className="text-xs">
                    {getAreaTypeName(area.area_type_id)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium">Status:</span>
                  <span
                    className={`text-xs capitalize ${
                      area.status === "active"
                        ? "text-green-600"
                        : "text-orange-600"
                    }`}
                  >
                    {area.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium">Points:</span>
                  <span className="text-xs">{area.coordinates.length}</span>
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
}

export default function GeofencingMap({
  mode = "view",
  onPolygonCreated,
  existingAreas = [],
  areaTypes = [],
  center = [26.1445, 91.7362], // Default to Guwahati, North East India
  zoom = 11,
}: GeofencingMapProps) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Show existing areas */}
      <AreasDisplay areas={existingAreas} areaTypes={areaTypes} />

      {/* Drawing controls for create mode */}
      {mode === "create" && onPolygonCreated && (
        <DrawingControl onPolygonCreated={onPolygonCreated} />
      )}
    </MapContainer>
  );
}

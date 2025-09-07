'use client'
import React, { useEffect, useRef } from 'react';
import L from 'leaflet'
import 'leaflet/dist/leaflet.css';

// Fix default markers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

interface DefaultIconPrototype extends L.Icon.Default {
  _getIconUrl?: () => string;
}

delete (L.Icon.Default.prototype as DefaultIconPrototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const MapComponent = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = L.map(mapContainer.current).setView([20.5937, 78.9629], 5); // India center

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map.current);

    // Custom marker icon with government theme
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background: #2A777C; 
        width: 20px; 
        height: 20px; 
        border-radius: 50%; 
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    // Add markers for popular Indian tourist destinations
    const destinations = [
      { name: 'New Delhi', coordinates: [28.6139, 77.2090] as [number, number] },
      { name: 'Mumbai', coordinates: [19.0760, 72.8777] as [number, number] },
      { name: 'Goa', coordinates: [15.2993, 74.1240] as [number, number] },
      { name: 'Jaipur', coordinates: [26.9124, 75.7873] as [number, number] },
      { name: 'Kerala (Kochi)', coordinates: [9.9312, 76.2673] as [number, number] },
      { name: 'Agra', coordinates: [27.1767, 78.0081] as [number, number] },
      { name: 'Varanasi', coordinates: [25.3176, 82.9739] as [number, number] },
      { name: 'Rishikesh', coordinates: [30.0869, 78.2676] as [number, number] },
      { name: 'Manali', coordinates: [32.2396, 77.1887] as [number, number] },
      { name: 'Udaipur', coordinates: [24.5854, 73.7125] as [number, number] },
    ];

    destinations.forEach(destination => {
      L.marker(destination.coordinates, { icon: customIcon })
        .bindPopup(`
          <div style="text-align: center; padding: 5px;">
            <strong style="color: #2A777C;">${destination.name}</strong><br/>
            <small>Tourist Destination</small>
          </div>
        `)
        .addTo(map.current!);
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="h-[650px] relative">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg border border-border" />
    </div>
  );
};

export default MapComponent;
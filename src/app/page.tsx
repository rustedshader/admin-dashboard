"use client";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
});
import TouristList from "@/components/TouristList";
import CityList from "@/components/CityList";

const Home = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-100px)]">
          {/* Left Sidebar - Cities */}
          <div className="col-span-3">
            <CityList />
          </div>

          {/* Center - Map */}
          <div className="col-span-6">
            <div className="h-full bg-card rounded-lg border border-border p-4 shadow-lg">
              <h2 className="text-xl flex justify-center font-semibold mb-4 text-card-foreground">
                Tourist Movement Map
              </h2>
              <MapComponent />
            </div>
          </div>

          {/* Right Sidebar - Tourists */}
          <div className="col-span-3">
            <TouristList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

"use client";

import { useState } from "react";
import {
  Car,
  Hotel,
  MapPin,
  Phone,
  Star,
  Users,
  Filter,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for registered services
const hotels = [
  {
    id: 1,
    name: "Grand Palace Hotel",
    location: "New Delhi",
    rating: 4.8,
    price: "₹5,000/night",
    contact: "+91 98765 43210",
    amenities: ["WiFi", "Restaurant", "Pool", "Parking"],
    image: "/placeholder.svg",
  },
  {
    id: 2,
    name: "Mountain View Resort",
    location: "Shimla",
    rating: 4.5,
    price: "₹3,500/night",
    contact: "+91 98765 43211",
    amenities: ["WiFi", "Restaurant", "Spa", "Garden"],
    image: "/placeholder.svg",
  },
  {
    id: 3,
    name: "Heritage Inn",
    location: "Jaipur",
    rating: 4.2,
    price: "₹2,800/night",
    contact: "+91 98765 43212",
    amenities: ["WiFi", "Restaurant", "Pool"],
    image: "/placeholder.svg",
  },
];

const drivers = [
  {
    id: 1,
    name: "Rajesh Kumar",
    vehicle: "Toyota Innova",
    experience: "8 years",
    rating: 4.9,
    rate: "₹12/km",
    contact: "+91 98765 54321",
    languages: ["Hindi", "English"],
    routes: ["Delhi-Agra", "Delhi-Jaipur"],
  },
  {
    id: 2,
    name: "Suresh Singh",
    vehicle: "Mahindra Scorpio",
    experience: "12 years",
    rating: 4.7,
    rate: "₹15/km",
    contact: "+91 98765 54322",
    languages: ["Hindi", "English", "Punjabi"],
    routes: ["Delhi-Manali", "Delhi-Shimla"],
  },
  {
    id: 3,
    name: "Amit Sharma",
    vehicle: "Swift Dzire",
    experience: "5 years",
    rating: 4.6,
    rate: "₹10/km",
    contact: "+91 98765 54323",
    languages: ["Hindi", "English"],
    routes: ["Local City Tours"],
  },
];

const guides = [
  {
    id: 1,
    name: "Priya Verma",
    specialization: "Historical Sites",
    experience: "6 years",
    rating: 4.8,
    rate: "₹1,500/day",
    contact: "+91 98765 65432",
    languages: ["Hindi", "English", "French"],
    areas: ["Delhi", "Agra", "Jaipur"],
  },
  {
    id: 2,
    name: "Vikram Joshi",
    specialization: "Adventure Tourism",
    experience: "10 years",
    rating: 4.9,
    rate: "₹2,000/day",
    contact: "+91 98765 65433",
    languages: ["Hindi", "English", "German"],
    areas: ["Himachal", "Uttarakhand"],
  },
];

const Transport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("all");
  const [activeTab, setActiveTab] = useState("hotels");

  // Filter functions
  const filteredHotels = hotels.filter((hotel) => {
    const matchesSearch =
      hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation =
      !filterLocation ||
      filterLocation === "all" ||
      hotel.location.toLowerCase().includes(filterLocation.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.routes.some((route) =>
        route.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesLocation =
      !filterLocation ||
      filterLocation === "all" ||
      driver.routes.some((route) =>
        route.toLowerCase().includes(filterLocation.toLowerCase())
      );
    return matchesSearch && matchesLocation;
  });

  const filteredGuides = guides.filter((guide) => {
    const matchesSearch =
      guide.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.areas.some((area) =>
        area.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesLocation =
      !filterLocation ||
      filterLocation === "all" ||
      guide.areas.some((area) =>
        area.toLowerCase().includes(filterLocation.toLowerCase())
      );
    return matchesSearch && matchesLocation;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Transport Directory
          </h1>
          <p className="text-xl text-white">
            Registered hotels, drivers, guides, and transport services
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white "
            />
          </div>
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-48 bg-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="delhi">Delhi</SelectItem>
              <SelectItem value="jaipur">Jaipur</SelectItem>
              <SelectItem value="agra">Agra</SelectItem>
              <SelectItem value="shimla">Shimla</SelectItem>
              <SelectItem value="manali">Manali</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs for different services */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hotels" className="flex items-center gap-2">
              <Hotel className="w-4 h-4" />
              Hotels
            </TabsTrigger>
            <TabsTrigger value="drivers" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              Drivers
            </TabsTrigger>
            <TabsTrigger value="guides" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Tour Guides
            </TabsTrigger>
          </TabsList>

          {/* Hotels Tab */}
          <TabsContent value="hotels" className="mt-6">
            {filteredHotels.length === 0 ? (
              <div className="text-center py-12">
                <Hotel className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Hotels Found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHotels.map((hotel) => (
                  <Card
                    key={hotel.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {hotel.name}
                          </CardTitle>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {hotel.location}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-primary font-semibold"
                        >
                          {hotel.price}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex">{renderStars(hotel.rating)}</div>
                        <span className="text-sm font-medium">
                          {hotel.rating}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {hotel.amenities.map((amenity, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {amenity}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{hotel.contact}</span>
                        </div>
                        <Button size="sm">Book Now</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers" className="mt-6">
            {filteredDrivers.length === 0 ? (
              <div className="text-center py-12">
                <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Drivers Found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDrivers.map((driver) => (
                  <Card
                    key={driver.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {driver.name}
                          </CardTitle>
                          <div className="flex items-center gap-1 mt-1">
                            <Car className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {driver.vehicle}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-primary font-semibold"
                        >
                          {driver.rate}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex">{renderStars(driver.rating)}</div>
                        <span className="text-sm font-medium">
                          {driver.rating}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({driver.experience})
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-1">
                          Languages:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {driver.languages.map((lang, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-1">
                          Routes:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {driver.routes.map((route, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {route}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{driver.contact}</span>
                        </div>
                        <Button size="sm">Contact</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tour Guides Tab */}
          <TabsContent value="guides" className="mt-6">
            {filteredGuides.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Tour Guides Found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGuides.map((guide) => (
                  <Card
                    key={guide.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {guide.name}
                          </CardTitle>
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {guide.specialization}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-primary font-semibold"
                        >
                          {guide.rate}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex">{renderStars(guide.rating)}</div>
                        <span className="text-sm font-medium">
                          {guide.rating}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({guide.experience})
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-1">
                          Languages:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {guide.languages.map((lang, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-1">
                          Areas:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {guide.areas.map((area, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{guide.contact}</span>
                        </div>
                        <Button size="sm">Hire Guide</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Registration CTA */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold mb-4">
                Want to Register Your Service?
              </h3>
              <p className="text-muted-foreground mb-6">
                Join our directory and connect with thousands of tourists
                looking for reliable transport services.
              </p>
              <Button size="lg" className="mr-4">
                Register as Hotel
              </Button>
              <Button size="lg" variant="outline" className="mr-4">
                Register as Driver
              </Button>
              <Button size="lg" variant="outline">
                Register as Guide
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Transport;

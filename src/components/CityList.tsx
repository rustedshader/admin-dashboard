import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Users } from "lucide-react";

const CityList = () => {
  const cities = [
    { id: 1, name: "Mumbai", state: "Maharashtra", tourists: 15420, growth: "+12%" },
    { id: 2, name: "Delhi", state: "Delhi", tourists: 14350, growth: "+8%" },
    { id: 3, name: "Goa", state: "Goa", tourists: 12100, growth: "+15%" },
    { id: 4, name: "Jaipur", state: "Rajasthan", tourists: 10800, growth: "+7%" },
    { id: 5, name: "Kerala", state: "Kerala", tourists: 9650, growth: "+18%" },
    { id: 6, name: "Agra", state: "Uttar Pradesh", tourists: 8920, growth: "+5%" },
    { id: 7, name: "Kolkata", state: "West Bengal", tourists: 7340, growth: "+3%" },
    { id: 8, name: "Bangalore", state: "Karnataka", tourists: 6890, growth: "+9%" },
    { id: 9, name: "Chennai", state: "Tamil Nadu", tourists: 6120, growth: "+6%" },
    { id: 10, name: "Hyderabad", state: "Telangana", tourists: 5670, growth: "+11%" },
  ];

  const sortedCities = cities.sort((a, b) => b.tourists - a.tourists);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex justify-center items-center gap-2">
          <MapPin className="w-5 h-5" />
          Cities by Tourist Count
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] px-6">
          <div className="space-y-3">
            {sortedCities.map((city, index) => (
              <div
                key={city.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{city.name}</p>
                    <p className="text-sm text-muted-foreground">{city.state}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{city.tourists.toLocaleString()}</span>
                  </div>
                  <Badge variant="outline" className="text-xs text-green-600">
                    {city.growth}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CityList;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

const TouristList = () => {
  const tourists = [
    { id: 1, name: "John Smith", location: "Kashmir", dangerLevel: 15, status: "safe" },
    { id: 2, name: "Emma Wilson", location: "Ladakh", dangerLevel: 25, status: "caution" },
    { id: 3, name: "Michael Brown", location: "Goa", dangerLevel: 5, status: "safe" },
    { id: 4, name: "Sarah Davis", location: "Delhi", dangerLevel: 35, status: "warning" },
    { id: 5, name: "David Johnson", location: "Mumbai", dangerLevel: 20, status: "caution" },
    { id: 6, name: "Lisa Anderson", location: "Kerala", dangerLevel: 8, status: "safe" },
    { id: 7, name: "Robert Taylor", location: "Rajasthan", dangerLevel: 45, status: "danger" },
    { id: 8, name: "Jennifer Martinez", location: "Himachal Pradesh", dangerLevel: 12, status: "safe" },
  ];

  const sortedTourists = tourists.sort((a, b) => b.dangerLevel - a.dangerLevel);

  const getDangerColor = (level: number) => {
    if (level < 10) return "bg-green-100 text-green-800";
    if (level < 25) return "bg-yellow-100 text-yellow-800";
    if (level < 40) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getIcon = (status: string) => {
    switch (status) {
      case "safe": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "caution": return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "danger": return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Tourist Safety Status
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] px-6">
          <div className="space-y-3">
            {sortedTourists.map((tourist) => (
              <div
                key={tourist.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getIcon(tourist.status)}
                  <div>
                    <p className="font-medium">{tourist.name}</p>
                    <p className="text-sm text-muted-foreground">{tourist.location}</p>
                  </div>
                </div>
                <Badge className={getDangerColor(tourist.dangerLevel)}>
                  {tourist.dangerLevel}% Risk
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TouristList;
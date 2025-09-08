'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Shield, 
  Trees,
  Heart,
  Flame,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Send
} from 'lucide-react';

const Help = () => {
  const [selectedTourists, setSelectedTourists] = useState({
    police: '',
    ranger: '',
    medical: '',
    fire: ''
  });
  const [isSubmitting, setIsSubmitting] = useState('');

  // Tourist data sorted by danger level
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
    if (level < 10) return "bg-success text-success-foreground";
    if (level < 25) return "bg-warning text-warning-foreground";
    if (level < 40) return "bg-orange-500 text-white";
    return "bg-destructive text-destructive-foreground";
  };

  const getIcon = (status: string) => {
    switch (status) {
      case "safe": return <CheckCircle className="w-4 h-4 text-success" />;
      case "caution": return <AlertCircle className="w-4 h-4 text-warning" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "danger": return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default: return <CheckCircle className="w-4 h-4 text-success" />;
    }
  };

  const handleSendHelp = async (serviceType: string) => {
    const touristId = selectedTourists[serviceType as keyof typeof selectedTourists];
    if (!touristId) {
      toast.error("No Tourist Selected", {
        description: "Please select a tourist to send help to."
      });
      return;
    }

    const tourist = tourists.find(t => t.id.toString() === touristId);
    setIsSubmitting(serviceType);
    
    // Simulate API call
    setTimeout(() => {
      toast.success(`${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Help Dispatched!`, {
        description: `Emergency ${serviceType} services have been sent to ${tourist?.name} in ${tourist?.location}.`
      });
      setSelectedTourists(prev => ({ ...prev, [serviceType]: '' }));
      setIsSubmitting('');
    }, 2000);
  };

  const services = [
    {
      id: 'police',
      title: 'Police Station',
      description: 'Emergency law enforcement and security assistance',
      icon: Shield,
      gradient: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      iconColor: 'text-blue-600'
    },
    {
      id: 'ranger',
      title: 'Forest Ranger',
      description: 'Wildlife emergencies and outdoor rescue operations',
      icon: Trees,
      gradient: 'from-green-600 to-green-700',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      iconColor: 'text-green-600'
    },
    {
      id: 'medical',
      title: 'Medical Emergency',
      description: 'Medical assistance and ambulance services',
      icon: Heart,
      gradient: 'from-red-600 to-red-700',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      iconColor: 'text-red-600'
    },
    {
      id: 'fire',
      title: 'Fire Department',
      description: 'Fire emergencies and rescue operations',
      icon: Flame,
      gradient: 'from-orange-600 to-orange-700',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-white mb-4">
            Emergency Response Center
          </h1>
          <p className="text-xl text-white max-w-2xl mx-auto">
            Dispatch emergency services to tourists in need. Select a service and choose from tourists sorted by risk level.
          </p>
        </div>

        {/* Emergency Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {services.map((service) => {
            const IconComponent = service.icon;
            return (
              <Card key={service.id} className="group hover:shadow-elegant transition-all duration-300 border-2 hover:border-primary/20">
                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 rounded-2xl ${service.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`h-8 w-8 ${service.iconColor}`} />
                  </div>
                  <CardTitle className="text-2xl font-bold">{service.title}</CardTitle>
                  <CardDescription className="text-base">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-3 block">
                      Select Tourist (sorted by risk level)
                    </label>
                    <Select 
                      value={selectedTourists[service.id as keyof typeof selectedTourists]} 
                      onValueChange={(value) => 
                        setSelectedTourists(prev => ({ ...prev, [service.id]: value }))
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Choose tourist to help..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {sortedTourists.map((tourist) => (
                          <SelectItem key={tourist.id} value={tourist.id.toString()}>
                            <div className="flex items-center gap-3 w-full py-2">
                              {getIcon(tourist.status)}
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{tourist.name}</span>
                                  <Badge className={`ml-2 ${getDangerColor(tourist.dangerLevel)}`}>
                                    {tourist.dangerLevel}% Risk
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">📍 {tourist.location}</p>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={() => handleSendHelp(service.id)}
                    className={`w-full h-12 bg-gradient-to-r ${service.gradient} hover:shadow-lg transition-all duration-300`}
                    disabled={isSubmitting === service.id}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting === service.id ? "Dispatching Help..." : "Send Help"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Status Section */}
        <Card className="bg-card/50 backdrop-blur-sm border-success/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle className="h-6 w-6" />
              Emergency Services Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {services.map((service) => (
                <div key={service.id} className="flex items-center gap-3 p-4 rounded-xl bg-success/5 border border-success/10">
                  <div className={`w-10 h-10 rounded-lg ${service.bgColor} flex items-center justify-center`}>
                    <service.icon className={`h-5 w-5 ${service.iconColor}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{service.title}</p>
                    <p className="text-xs text-success font-medium">● Online</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Help;

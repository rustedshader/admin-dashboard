"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Mountain,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useAuthenticatedFetch } from "@/hooks/useAuth";
import Link from "next/link";

interface Trek {
  id: number;
  name: string;
  description?: string;
  location: string;
  city: string;
  district: string;
  state: string;
  duration: number;
  altitude?: number;
  nearest_town?: string;
  start_latitude?: number;
  start_longitude?: number;
  best_season?: string;
  permits_required?: string;
  equipment_needed?: string;
  safety_tips?: string;
  minimum_age?: number;
  maximum_age?: number;
  guide_required: boolean;
  minimum_people?: number;
  maximum_people?: number;
  cost_per_person?: number;
  difficulty_level: "easy" | "medium" | "hard";
  created_by_id: number;
  created_at: number;
}

const TreksPage = () => {
  const { authenticatedFetch, isAuthenticated } = useAuthenticatedFetch();
  const [allTreks, setAllTreks] = useState<Trek[]>([]);
  const [filteredTreks, setFilteredTreks] = useState<Trek[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchTreks = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await authenticatedFetch("/api/trek/list");

      if (response.ok) {
        const data = await response.json();
        setAllTreks(data || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching treks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreks();
  }, [isAuthenticated]);

  useEffect(() => {
    let filtered = allTreks;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (trek) =>
          trek.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trek.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trek.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trek.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply difficulty filter
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(
        (trek) => trek.difficulty_level === difficultyFilter
      );
    }

    // Apply state filter
    if (stateFilter !== "all") {
      filtered = filtered.filter((trek) => trek.state === stateFilter);
    }

    setFilteredTreks(filtered);
  }, [allTreks, searchTerm, difficultyFilter, stateFilter]);

  const getDifficultyBadge = (difficulty: string) => {
    const config = {
      easy: {
        color: "bg-green-100 text-green-800 border-green-200",
        label: "Easy",
      },
      medium: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        label: "Medium",
      },
      hard: { color: "bg-red-100 text-red-800 border-red-200", label: "Hard" },
    };

    const difficultyConfig =
      config[difficulty as keyof typeof config] || config.easy;
    return (
      <Badge className={`${difficultyConfig.color} border`}>
        {difficultyConfig.label}
      </Badge>
    );
  };

  const deleteTrek = async (trekId: number) => {
    if (!confirm("Are you sure you want to delete this trek?")) return;

    try {
      const response = await authenticatedFetch(`/api/trek/${trekId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTreks(); // Refresh the list
      }
    } catch (error) {
      console.error("Error deleting trek:", error);
    }
  };

  const uniqueStates = Array.from(
    new Set(allTreks.map((trek) => trek.state))
  ).sort();

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = "text-blue-600",
  }: {
    title: string;
    value: number | string;
    icon: any;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  const trekStats = {
    total: allTreks.length,
    easy: allTreks.filter((t) => t.difficulty_level === "easy").length,
    medium: allTreks.filter((t) => t.difficulty_level === "medium").length,
    hard: allTreks.filter((t) => t.difficulty_level === "hard").length,
    avgDuration:
      allTreks.length > 0
        ? Math.round(
            allTreks.reduce((sum, t) => sum + t.duration, 0) / allTreks.length
          )
        : 0,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trek Management</h1>
            <p className="text-muted-foreground">
              Manage and organize available treks
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
            <Button
              onClick={fetchTreks}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Link href="/treks/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Trek
              </Button>
            </Link>
          </div>
        </div>

        {/* Trek Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Treks"
            value={trekStats.total}
            icon={Mountain}
            color="text-blue-600"
          />
          <StatCard
            title="Easy Treks"
            value={trekStats.easy}
            icon={Mountain}
            color="text-green-600"
          />
          <StatCard
            title="Medium Treks"
            value={trekStats.medium}
            icon={Mountain}
            color="text-yellow-600"
          />
          <StatCard
            title="Hard Treks"
            value={trekStats.hard}
            icon={Mountain}
            color="text-red-600"
          />
          <StatCard
            title="Avg Duration"
            value={`${trekStats.avgDuration} days`}
            icon={Clock}
            color="text-purple-600"
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="all-treks" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all-treks">All Treks</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="all-treks" className="space-y-4">
            {/* Filters and Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    <Input
                      placeholder="Search treks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>

                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>

                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All States</option>
                    {uniqueStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Trek Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTreks.map((trek) => (
                <Card
                  key={trek.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {trek.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          {getDifficultyBadge(trek.difficulty_level)}
                          {trek.guide_required && (
                            <Badge variant="outline">Guide Required</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {trek.location}, {trek.city}, {trek.state}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{trek.duration} days</span>
                      </div>

                      {trek.altitude && (
                        <div className="flex items-center gap-2">
                          <Mountain className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {trek.altitude.toLocaleString()}m altitude
                          </span>
                        </div>
                      )}

                      {trek.cost_per_person && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span>
                            ₹{trek.cost_per_person.toLocaleString()} per person
                          </span>
                        </div>
                      )}

                      {(trek.minimum_people || trek.maximum_people) && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {trek.minimum_people && trek.maximum_people
                              ? `${trek.minimum_people}-${trek.maximum_people} people`
                              : trek.minimum_people
                              ? `Min ${trek.minimum_people} people`
                              : `Max ${trek.maximum_people} people`}
                          </span>
                        </div>
                      )}

                      {trek.best_season && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>Best: {trek.best_season}</span>
                        </div>
                      )}
                    </div>

                    {trek.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {trek.description}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteTrek(trek.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTreks.length === 0 && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                <Mountain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No treks found</p>
                <p className="text-sm">
                  {searchTerm ||
                  difficultyFilter !== "all" ||
                  stateFilter !== "all"
                    ? "Try adjusting your filters or search terms"
                    : "No treks available"}
                </p>
                <Link href="/treks/create">
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Trek
                  </Button>
                </Link>
              </div>
            )}

            {loading && (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
                <p>Loading treks...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Difficulty Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Easy Treks</span>
                        <span className="font-medium">{trekStats.easy}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              trekStats.total > 0
                                ? (trekStats.easy / trekStats.total) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Medium Treks</span>
                        <span className="font-medium">{trekStats.medium}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              trekStats.total > 0
                                ? (trekStats.medium / trekStats.total) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Hard Treks</span>
                        <span className="font-medium">{trekStats.hard}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              trekStats.total > 0
                                ? (trekStats.hard / trekStats.total) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Treks by State</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {uniqueStates.slice(0, 10).map((state) => {
                      const count = allTreks.filter(
                        (t) => t.state === state
                      ).length;
                      return (
                        <div
                          key={state}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm">{state}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TreksPage;

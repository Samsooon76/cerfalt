import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Stats, PipelineStage, Activity } from "@/lib/types";

// Convert the pipelineStages to French for display
const stageTitles: Record<PipelineStage, string> = {
  REQUEST: "Demande de dossier",
  CREATED: "Dossier créé",
  VERIFICATION: "En cours de vérification",
  PROCESSING: "En traitement",
  VALIDATED: "Validé",
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

export default function ReportsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Fetch stats data
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  // Fetch activities data
  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Format stats data for pipeline stages chart
  const getPipelineStagesData = () => {
    if (!stats) return [];

    return Object.entries(stats.filesByStage).map(([stage, count]) => ({
      name: stageTitles[stage as PipelineStage],
      value: count,
    }));
  };

  // Mock data for monthly progress
  const getMonthlyProgressData = () => {
    return [
      { name: "Jan", files: 12, validated: 10 },
      { name: "Fév", files: 15, validated: 12 },
      { name: "Mar", files: 18, validated: 15 },
      { name: "Avr", files: 22, validated: 18 },
      { name: "Mai", files: 25, validated: 20 },
      { name: "Juin", files: 30, validated: 25 },
    ];
  };

  // Format activity data for timeline chart
  const getActivityData = () => {
    if (!activities) return [];

    // Group activities by day
    const activityCounts: Record<string, number> = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.createdAt).toLocaleDateString("fr-FR");
      activityCounts[date] = (activityCounts[date] || 0) + 1;
    });

    // Convert to chart data format
    return Object.entries(activityCounts).map(([date, count]) => ({
      date,
      count,
    }));
  };

  // Format for processing time data
  const getProcessingTimeData = () => {
    if (!stats) return [];

    // Generate some random processing time distribution data
    const avgTime = stats.averageProcessingTime;
    
    return [
      { name: "1 jour", value: Math.floor(Math.random() * 20) + 5 },
      { name: "2 jours", value: Math.floor(Math.random() * 25) + 10 },
      { name: "3 jours", value: Math.floor(Math.random() * 30) + 15 },
      { name: "4 jours", value: Math.floor(Math.random() * 20) + 5 },
      { name: "5+ jours", value: Math.floor(Math.random() * 15) + 5 },
    ];
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Rapports"
          onToggleSidebar={handleToggleSidebar}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Statistiques et rapports</h1>
            <p className="text-gray-500 mt-1">Visualisez les performances et les tendances</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total dossiers</CardTitle>
                <CardDescription>Nombre total de dossiers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {statsLoading ? "..." : stats?.totalFiles || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Dossiers validés</CardTitle>
                <CardDescription>Dossiers ayant complété le processus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">
                  {statsLoading ? "..." : stats?.validatedFiles || 0}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {statsLoading || !stats
                    ? ""
                    : `${((stats.validatedFiles / stats.totalFiles) * 100).toFixed(1)}% du total`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Temps de traitement</CardTitle>
                <CardDescription>Temps moyen pour valider un dossier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-600">
                  {statsLoading
                    ? "..."
                    : `${stats?.averageProcessingTime.toFixed(1) || 0} jours`}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pipeline distribution chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribution des dossiers par étape</CardTitle>
                <CardDescription>
                  Nombre de dossiers à chaque étape du pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center h-80">
                    <p className="text-gray-500">Chargement des données...</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPipelineStagesData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {getPipelineStagesData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} dossiers`, ""]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly progress chart */}
            <Card>
              <CardHeader>
                <CardTitle>Progression mensuelle</CardTitle>
                <CardDescription>
                  Nombre de dossiers créés et validés par mois
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getMonthlyProgressData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="files" fill="#3b82f6" name="Dossiers créés" />
                      <Bar dataKey="validated" fill="#10b981" name="Dossiers validés" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Activity timeline chart */}
            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
                <CardDescription>
                  Nombre d'actions par jour sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="flex items-center justify-center h-80">
                    <p className="text-gray-500">Chargement des données...</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={getActivityData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#6366f1"
                          activeDot={{ r: 8 }}
                          name="Nombre d'actions"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Processing time distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribution des temps de traitement</CardTitle>
                <CardDescription>
                  Nombre de dossiers par durée de traitement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center h-80">
                    <p className="text-gray-500">Chargement des données...</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getProcessingTimeData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="value"
                          fill="#f59e0b"
                          name="Nombre de dossiers"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

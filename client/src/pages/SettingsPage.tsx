import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { pipelineStages } from "@shared/schema";

// Interface représentant une étape du pipeline
interface PipelineStep {
  id: string;
  name: string;
  key: string;
}

export default function SettingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // États des paramètres
  const [receiveEmails, setReceiveEmails] = useState(true);
  const [notifyNewDocuments, setNotifyNewDocuments] = useState(true);
  const [notifyStatusChanges, setNotifyStatusChanges] = useState(true);
  const [apiKey, setApiKey] = useState(""); // Pour la clé d'API Mistral

  // État pour les étapes du pipeline personnalisées
  const [customPipeline, setCustomPipeline] = useState<PipelineStep[]>([
    { id: "1", name: "Demande de dossier", key: "REQUEST" },
    { id: "2", name: "Dossier créé", key: "CREATED" },
    { id: "3", name: "En cours de vérification", key: "VERIFICATION" },
    { id: "4", name: "En traitement", key: "PROCESSING" },
    { id: "5", name: "Validé", key: "VALIDATED" }
  ]);

  // Méthodes de gestion du pipeline
  const handleAddPipelineStep = () => {
    const newId = String(customPipeline.length + 1);
    const newKey = `STAGE_${newId}`;
    setCustomPipeline([
      ...customPipeline,
      { id: newId, name: "Nouvelle étape", key: newKey }
    ]);
  };

  const handleUpdatePipelineStep = (id: string, updatedName: string) => {
    setCustomPipeline(
      customPipeline.map(step => 
        step.id === id ? { ...step, name: updatedName } : step
      )
    );
  };

  const handleRemovePipelineStep = (id: string) => {
    if (customPipeline.length <= 2) {
      toast({
        title: "Impossible de supprimer",
        description: "Vous devez avoir au moins deux étapes dans le pipeline.",
        variant: "destructive"
      });
      return;
    }

    setCustomPipeline(customPipeline.filter(step => step.id !== id));
  };

  const handleMoveStepUp = (id: string) => {
    const index = customPipeline.findIndex(step => step.id === id);
    if (index <= 0) return;

    const newPipeline = [...customPipeline];
    const temp = newPipeline[index];
    newPipeline[index] = newPipeline[index - 1];
    newPipeline[index - 1] = temp;

    setCustomPipeline(newPipeline);
  };

  const handleMoveStepDown = (id: string) => {
    const index = customPipeline.findIndex(step => step.id === id);
    if (index >= customPipeline.length - 1) return;

    const newPipeline = [...customPipeline];
    const temp = newPipeline[index];
    newPipeline[index] = newPipeline[index + 1];
    newPipeline[index + 1] = temp;

    setCustomPipeline(newPipeline);
  };

  const handleSavePipeline = async () => {
    setLoading(true);
    try {
      await apiRequest('/api/settings/pipeline', 'PUT', { 
        stages: customPipeline.map(step => ({
          key: step.key,
          name: step.name
        }))
      });

      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Pipeline sauvegardé",
        description: "Les étapes du pipeline ont été mises à jour avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSaveGeneralSettings = () => {
    setLoading(true);

    // Simulation de sauvegarde
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Paramètres sauvegardés",
        description: "Vos paramètres ont été mis à jour avec succès.",
      });
    }, 1000);
  };

  const handleSaveApiKey = () => {
    setLoading(true);

    // Simulation de sauvegarde
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Clé API sauvegardée",
        description: "Votre clé API a été mise à jour avec succès.",
      });
    }, 1000);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Paramètres"
          onToggleSidebar={handleToggleSidebar}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Paramètres du système</h1>
            <p className="text-gray-500">Gérez les paramètres de l'application</p>
          </div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="api">API & Intégrations</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres généraux</CardTitle>
                  <CardDescription>
                    Configurez les paramètres généraux de l'application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="institution">Nom de l'établissement</Label>
                    <Input id="institution" defaultValue="Centre de Formation d'Apprentis" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input id="address" defaultValue="123 Avenue de la Formation, 75001 Paris" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Email de contact</Label>
                    <Input id="contact" type="email" defaultValue="contact@cfa-exemple.fr" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveGeneralSettings} disabled={loading}>
                    {loading ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres de notifications</CardTitle>
                  <CardDescription>
                    Configurez quand et comment vous souhaitez être notifié
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications" className="text-base">Notifications par email</Label>
                      <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={receiveEmails}
                      onCheckedChange={setReceiveEmails}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="new-documents" className="text-base">Nouveaux documents</Label>
                      <p className="text-sm text-gray-500">Notification lors de l'ajout de nouveaux documents</p>
                    </div>
                    <Switch
                      id="new-documents"
                      checked={notifyNewDocuments}
                      onCheckedChange={setNotifyNewDocuments}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="status-changes" className="text-base">Changement de statut</Label>
                      <p className="text-sm text-gray-500">Notification lors des changements de statut des dossiers</p>
                    </div>
                    <Switch
                      id="status-changes"
                      checked={notifyStatusChanges}
                      onCheckedChange={setNotifyStatusChanges}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveGeneralSettings} disabled={loading}>
                    {loading ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="pipeline">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration du pipeline</CardTitle>
                  <CardDescription>
                    Personnalisez les étapes de traitement des dossiers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium">Étapes du pipeline</Label>
                      <Button 
                        onClick={handleAddPipelineStep}
                        size="sm"
                        className="h-8 gap-1"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Ajouter une étape
                      </Button>
                    </div>

                    <div className="border rounded-md">
                      {customPipeline.map((step, index) => (
                        <div 
                          key={step.id} 
                          className={`p-3 flex items-center justify-between ${index !== customPipeline.length - 1 ? 'border-b' : ''}`}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                              {index + 1}
                            </div>
                            <Input 
                              value={step.name}
                              onChange={(e) => handleUpdatePipelineStep(step.id, e.target.value)}
                              className="flex-1 max-w-[230px]"
                            />
                            <div className="text-xs text-gray-400 ml-2">{step.key}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleMoveStepUp(step.id)}
                              disabled={index === 0}
                              className="h-7 w-7"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>

                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleMoveStepDown(step.id)}
                              disabled={index === customPipeline.length - 1}
                              className="h-7 w-7"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>

                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRemovePipelineStep(step.id)}
                              className="h-7 w-7 text-destructive hover:text-destructive/80"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm text-gray-500">
                      Configurez les étapes par lesquelles passeront les dossiers dans votre système.
                      Ces étapes seront utilisées dans la vue pipeline et dans les formulaires.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSavePipeline} disabled={loading}>
                    {loading ? "Sauvegarde en cours..." : "Sauvegarder le pipeline"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="api">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres d'API et intégrations</CardTitle>
                  <CardDescription>
                    Gérez vos clés d'API et intégrations tierces
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="mistral-api">Clé API Mistral AI</Label>
                    <div className="flex space-x-2">
                      <Input 
                        id="mistral-api" 
                        type="password" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Saisissez votre clé API Mistral" 
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Utilisée pour l'extraction OCR des documents d'identité
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveApiKey} disabled={loading}>
                    {loading ? "Sauvegarde en cours..." : "Sauvegarder la clé API"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
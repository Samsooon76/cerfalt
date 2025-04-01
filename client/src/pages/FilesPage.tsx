import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { File } from "@/lib/types"; // Utilisation du type depuis lib/types au lieu de shared/schema
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import StatsCards from "@/components/StatsCards";
import Pipeline from "@/components/Pipeline";
import FileDetailModal from "@/components/FileDetailModal";
import DocumentUploadModal from "@/components/DocumentUploadModal";
import CreateFileModal from "@/components/CreateFileModal";
import CreateFileWizard from "@/components/CreateFileWizard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Fonction utilitaire pour afficher un badge selon le statut
function BadgeForStage({ stage }: { stage: string }) {
  const getStageInfo = (stage: string) => {
    switch (stage) {
      case "RECEPTION":
        return { label: "Réception", color: "bg-blue-100 text-blue-800" };
      case "VERIFICATION":
        return { label: "Vérification", color: "bg-yellow-100 text-yellow-800" };
      case "TRAITEMENT":
        return { label: "Traitement", color: "bg-purple-100 text-purple-800" };
      case "ATTENTE_SIGNATURE":
        return { label: "Attente signature", color: "bg-orange-100 text-orange-800" };
      case "VALIDE":
        return { label: "Validé", color: "bg-green-100 text-green-800" };
      case "REJETE":
        return { label: "Rejeté", color: "bg-red-100 text-red-800" };
      default:
        return { label: stage, color: "bg-gray-100 text-gray-800" };
    }
  };

  const { label, color } = getStageInfo(stage);
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>;
}

export default function FilesPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDocumentUploadModalOpen, setIsDocumentUploadModalOpen] = useState(false);
  const [isCreateFileModalOpen, setIsCreateFileModalOpen] = useState(false);
  const [isCreateFileWizardOpen, setIsCreateFileWizardOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline");
  
  const { toast } = useToast();

  const { data: stats = {
    totalFiles: 0,
    filesByStage: {},
    validatedFiles: 0,
    averageProcessingTime: 0
  }} = useQuery<any>({
    queryKey: ["/api/stats"],
  });
  
  const { data: files = [], isLoading: filesLoading } = useQuery<File[]>({
    queryKey: ["/api/files"],
  });
  
  const { data: apprentices = [] } = useQuery<any[]>({
    queryKey: ["/api/apprentices"],
  });
  
  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
  });
  
  const { data: mentors = [] } = useQuery<any[]>({
    queryKey: ["/api/mentors"],
  });

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleOpenFileDetail = (file: File) => {
    setSelectedFileId(file.id);
    setIsDetailModalOpen(true);
  };

  const handleCloseFileDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedFileId(null);
  };

  const handleOpenDocumentUpload = () => {
    setIsDocumentUploadModalOpen(true);
  };

  const handleCloseDocumentUpload = () => {
    setIsDocumentUploadModalOpen(false);
  };

  const handleOpenCreateFile = () => {
    setIsCreateFileModalOpen(true);
  };

  const handleCloseCreateFile = () => {
    setIsCreateFileModalOpen(false);
  };
  
  const handleOpenCreateFileWizard = () => {
    setIsCreateFileWizardOpen(true);
  };

  const handleCloseCreateFileWizard = () => {
    setIsCreateFileWizardOpen(false);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Dossiers"
          onToggleSidebar={handleToggleSidebar}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Suivi des dossiers</h1>
            <div className="flex space-x-2">
              <button
                onClick={handleOpenDocumentUpload}
                className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <i className="ri-upload-2-line mr-2"></i>
                Importer un document
              </button>
              
              <button
                onClick={handleOpenCreateFileWizard}
                className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <i className="ri-add-line mr-2"></i>
                Nouveau dossier
              </button>
            </div>
          </div>

          <StatsCards stats={stats} />

          <div className="mt-6">
            <Tabs defaultValue="pipeline" className="w-full" onValueChange={(value) => setViewMode(value as "pipeline" | "list")}>
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="pipeline">Vue Pipeline</TabsTrigger>
                  <TabsTrigger value="list">Liste des dossiers</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="pipeline" className="mt-0">
                <Pipeline onOpenFileDetail={handleOpenFileDetail} onNewFile={() => {
                  // Ouvrir le même menu déroulant que le bouton principal
                  const dropdownTrigger = document.querySelector("[data-radix-dropdown-trigger]");
                  if (dropdownTrigger) {
                    (dropdownTrigger as HTMLElement).click();
                  } else {
                    // Fallback si le menu déroulant n'est pas disponible
                    handleOpenCreateFile();
                  }
                }} />
              </TabsContent>
              
              <TabsContent value="list" className="mt-0">
                <div className="bg-white rounded-md shadow">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Alternant</TableHead>
                        <TableHead>Entreprise</TableHead>
                        <TableHead>Tuteur</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date de création</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                            Aucun dossier trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        files.map((file) => {
                          const apprentice = apprentices.find(a => a.id === file.apprenticeId);
                          const company = companies.find(c => c.id === file.companyId);
                          const mentor = mentors.find(m => m.id === file.mentorId);
                          
                          return (
                            <TableRow key={file.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleOpenFileDetail(file)}>
                              <TableCell>{file.id}</TableCell>
                              <TableCell>{apprentice ? `${apprentice.firstName} ${apprentice.lastName}` : 'N/A'}</TableCell>
                              <TableCell>{company ? company.name : 'N/A'}</TableCell>
                              <TableCell>{mentor ? `${mentor.firstName} ${mentor.lastName}` : 'N/A'}</TableCell>
                              <TableCell>
                                <BadgeForStage stage={file.stage} />
                              </TableCell>
                              <TableCell>
                                {file.createdAt ? format(new Date(file.createdAt), 'dd MMMM yyyy', { locale: fr }) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <button className="text-primary hover:text-primary/80" onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenFileDetail(file);
                                }}>
                                  Détails
                                </button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Modals */}
          {selectedFileId && (
            <FileDetailModal
              isOpen={isDetailModalOpen}
              onClose={handleCloseFileDetail}
              fileId={selectedFileId}
            />
          )}

          <DocumentUploadModal
            isOpen={isDocumentUploadModalOpen}
            onClose={handleCloseDocumentUpload}
          />

          <CreateFileModal
            isOpen={isCreateFileModalOpen}
            onClose={handleCloseCreateFile}
          />
          
          <CreateFileWizard
            isOpen={isCreateFileWizardOpen}
            onClose={handleCloseCreateFileWizard}
          />
        </main>
      </div>
    </div>
  );
}
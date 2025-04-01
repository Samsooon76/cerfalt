import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Document, File, Apprentice } from "@/lib/types";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import DocumentUploadModal from "@/components/DocumentUploadModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function DocumentsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents data
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Fetch files data for document association
  const { data: files } = useQuery<File[]>({
    queryKey: ["/api/files"],
  });

  // Fetch apprentices data for displaying names
  const { data: apprentices } = useQuery<Apprentice[]>({
    queryKey: ["/api/apprentices"],
  });

  // Delete document mutation
  const deleteDocument = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/documents/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document.",
        variant: "destructive",
      });
    },
  });

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedDocument(null);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      deleteDocument.mutate(id);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return new Intl.DateTimeFormat("fr-FR").format(date);
  };

  // Get apprentice name for a document
  const getApprenticeName = (document: Document) => {
    if (!files || !apprentices) return "-";
    
    const file = files.find(f => f.id === document.fileId);
    if (!file) return "-";
    
    const apprentice = apprentices.find(a => a.id === file.apprenticeId);
    if (!apprentice) return "-";
    
    return `${apprentice.firstName} ${apprentice.lastName}`;
  };

  // Helper function to determine document icon based on file type
  const getDocumentIcon = (docType: string, name: string) => {
    if (name.endsWith(".pdf")) return "ri-file-pdf-line text-red-500";
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "ri-file-excel-line text-green-500";
    if (name.endsWith(".docx") || name.endsWith(".doc")) return "ri-file-word-line text-purple-500";
    return "ri-file-text-line text-blue-500";
  };

  // Helper function to determine background color for icon container
  const getIconBgColor = (docType: string, name: string) => {
    if (name.endsWith(".pdf")) return "bg-red-100";
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "bg-green-100";
    if (name.endsWith(".docx") || name.endsWith(".doc")) return "bg-purple-100";
    return "bg-blue-100";
  };

  // Get document type label
  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "cerfa":
        return "Cerfa 10103*13";
      case "id":
        return "Pièce d'identité";
      case "passport":
        return "Passeport";
      case "certificate":
        return "Attestation de formation";
      default:
        return "Autre";
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Documents"
          onToggleSidebar={handleToggleSidebar}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Gestion des documents</h1>
            <Button onClick={handleOpenUploadModal}>
              <i className="ri-upload-line mr-2"></i>
              Importer un document
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Liste des documents</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-20 text-center">
                  <p className="text-gray-500">Chargement des documents...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Alternant</TableHead>
                      <TableHead>Date d'importation</TableHead>
                      <TableHead>OCR</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents && documents.length > 0 ? (
                      documents.map((document) => (
                        <TableRow key={document.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded flex items-center justify-center ${getIconBgColor(document.type, document.name)} mr-3`}>
                                <i className={getDocumentIcon(document.type, document.name)}></i>
                              </div>
                              <span className="font-medium">{document.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getDocumentTypeLabel(document.type)}</TableCell>
                          <TableCell>{getApprenticeName(document)}</TableCell>
                          <TableCell>{formatDate(document.uploadedAt)}</TableCell>
                          <TableCell>
                            {document.extractedData ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <i className="ri-check-line mr-1"></i> 
                                Extrait
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <i className="ri-close-line mr-1"></i>
                                Non extrait
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDocument(document)}
                              >
                                <i className="ri-eye-line"></i>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                              >
                                <i className="ri-download-line"></i>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(document.id)}
                              >
                                <i className="ri-delete-bin-line"></i>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10">
                          Aucun document disponible
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Document Upload Modal */}
          <DocumentUploadModal
            isOpen={isUploadModalOpen}
            onClose={handleCloseUploadModal}
          />

          {/* Document View Modal */}
          {selectedDocument && (
            <Dialog open={isViewModalOpen} onOpenChange={handleCloseViewModal}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{selectedDocument.name}</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                  <p className="text-gray-500 mb-4">
                    Ce document est associé au dossier de{" "}
                    <span className="font-medium text-gray-800">{getApprenticeName(selectedDocument)}</span>
                  </p>

                  <div className="bg-gray-100 p-6 rounded-md flex flex-col items-center justify-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getIconBgColor(selectedDocument.type, selectedDocument.name)} mb-3`}>
                      <i className={`${getDocumentIcon(selectedDocument.type, selectedDocument.name)} text-2xl`}></i>
                    </div>
                    <p className="text-gray-700 font-medium">{selectedDocument.name}</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {formatDate(selectedDocument.uploadedAt)}
                    </p>
                    <p className="mt-4 text-gray-500 text-sm">
                      Prévisualisation non disponible. Cliquez sur le bouton ci-dessous pour télécharger le document.
                    </p>
                  </div>

                  {selectedDocument.extractedData && (
                    <div className="mt-4">
                      <h3 className="font-medium text-gray-800 mb-2">Données extraites (OCR)</h3>
                      <div className="bg-gray-100 p-3 rounded-md overflow-auto max-h-40">
                        <pre className="text-xs text-gray-600">{selectedDocument.extractedData}</pre>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseViewModal}>
                    Fermer
                  </Button>
                  <Button>
                    <i className="ri-download-line mr-2"></i>
                    Télécharger
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </main>
      </div>
    </div>
  );
}

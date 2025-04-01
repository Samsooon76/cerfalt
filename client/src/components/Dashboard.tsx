import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "./Header";
import Sidebar from "./Sidebar";
import StatsCards from "./StatsCards";
import Pipeline from "./Pipeline";
import RecentDocuments from "./RecentDocuments";
import RecentActivity from "./RecentActivity";
import DocumentUploadModal from "./DocumentUploadModal";
import FileDetailModal from "./FileDetailModal";
import { File } from "@/lib/types";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDocumentUploadModalOpen, setIsDocumentUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileDetailModalOpen, setIsFileDetailModalOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleOpenDocumentUploadModal = () => {
    setIsDocumentUploadModalOpen(true);
  };

  const handleCloseDocumentUploadModal = () => {
    setIsDocumentUploadModalOpen(false);
  };

  const handleOpenFileDetailModal = (file: File) => {
    setSelectedFile(file);
    setIsFileDetailModalOpen(true);
  };

  const handleCloseFileDetailModal = () => {
    setIsFileDetailModalOpen(false);
    setSelectedFile(null);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Tableau de bord"
          onToggleSidebar={handleToggleSidebar}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse h-32">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <StatsCards stats={stats} />
          )}

          <Pipeline onOpenFileDetail={handleOpenFileDetailModal} onNewFile={handleOpenDocumentUploadModal} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <RecentDocuments />
            <RecentActivity />
          </div>
        </main>
      </div>

      <DocumentUploadModal 
        isOpen={isDocumentUploadModalOpen}
        onClose={handleCloseDocumentUploadModal}
      />

      {selectedFile && (
        <FileDetailModal
          isOpen={isFileDetailModalOpen}
          onClose={handleCloseFileDetailModal}
          fileId={selectedFile.id}
        />
      )}
    </div>
  );
}

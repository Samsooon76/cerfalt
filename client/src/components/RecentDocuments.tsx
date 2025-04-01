import { useQuery } from "@tanstack/react-query";
import { Document } from "@/lib/types";

export default function RecentDocuments() {
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"]
  });

  // Filter and sort documents to get the most recent ones
  const recentDocuments = documents
    ? documents
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .slice(0, 4)
    : [];

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Ajouté aujourd'hui";
    if (diffDays === 1) return "Ajouté hier";
    return `Ajouté il y a ${diffDays} jours`;
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

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b border-gray-200 p-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">Documents récents</h3>
        <button className="text-sm text-primary-600 hover:text-primary-700">Voir tout</button>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-center p-2 animate-pulse">
                <div className="w-10 h-10 rounded bg-gray-200 mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {recentDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center p-2 hover:bg-gray-50 rounded-md">
                <div
                  className={`w-10 h-10 rounded flex items-center justify-center ${getIconBgColor(
                    doc.type,
                    doc.name
                  )} mr-3`}
                >
                  <i className={`${getDocumentIcon(doc.type, doc.name)} text-xl`}></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                  <p className="text-xs text-gray-500">{formatDate(doc.uploadedAt)}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <i className="ri-eye-line"></i>
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <i className="ri-download-line"></i>
                  </button>
                </div>
              </div>
            ))}

            {recentDocuments.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500">Aucun document disponible</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

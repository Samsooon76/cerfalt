import { useState, useEffect } from "react";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PipelineStage, File } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface PipelineProps {
  onOpenFileDetail: (file: File) => void;
  onNewFile: () => void;
}

interface PipelineCard {
  id: number;
  title: string;
  subtitle: string;
  company: string;
  date: string;
  stage: PipelineStage;
}

const stageTitles: Record<PipelineStage, string> = {
  REQUEST: "Demande de dossier",
  CREATED: "Dossier créé",
  VERIFICATION: "En cours de vérification",
  PROCESSING: "En traitement",
  VALIDATED: "Validé",
};

const stageBorderColors: Record<PipelineStage, string> = {
  REQUEST: "border-gray-400",
  CREATED: "border-blue-400",
  VERIFICATION: "border-yellow-400",
  PROCESSING: "border-purple-400",
  VALIDATED: "border-green-400",
};

export default function Pipeline({ onOpenFileDetail, onNewFile }: PipelineProps) {
  const { toast } = useToast();
  const [draggedItem, setDraggedItem] = useState<PipelineCard | null>(null);
  const [pipelineCards, setPipelineCards] = useState<Record<PipelineStage, PipelineCard[]>>({
    REQUEST: [],
    CREATED: [],
    VERIFICATION: [],
    PROCESSING: [],
    VALIDATED: [],
  });

  // Fetch files data
  const { data: files, isLoading: filesLoading } = useQuery<File[]>({
    queryKey: ["/api/files"]
  });

  // Fetch apprentices data
  const { data: apprentices, isLoading: apprenticesLoading } = useQuery({
    queryKey: ["/api/apprentices"]
  });

  // Fetch companies data
  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ["/api/companies"]
  });

  // Update file stage mutation
  const updateFileStage = useMutation({
    mutationFn: async ({ fileId, stage }: { fileId: number; stage: PipelineStage }) => {
      const response = await apiRequest(`/api/files/${fileId}/stage`, "PUT", { stage });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate files query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut du dossier a été mis à jour avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut du dossier.",
        variant: "destructive",
      });
    },
  });

  // Process files data when it's loaded
  useEffect(() => {
    if (!files || !apprentices || !companies) return;

    const cardsByStage: Record<PipelineStage, PipelineCard[]> = {
      REQUEST: [],
      CREATED: [],
      VERIFICATION: [],
      PROCESSING: [],
      VALIDATED: [],
    };

    files.forEach((file) => {
      const apprentice = apprentices.find((a) => a.id === file.apprenticeId);
      const company = companies.find((c) => c.id === file.companyId);

      if (apprentice && company) {
        const card: PipelineCard = {
          id: file.id,
          title: `${apprentice.firstName} ${apprentice.lastName}`,
          subtitle: apprentice.education || "",
          company: company.name,
          date: formatDate(file.updatedAt),
          stage: file.stage as PipelineStage,
        };

        if (cardsByStage[file.stage as PipelineStage]) {
          cardsByStage[file.stage as PipelineStage].push(card);
        }
      }
    });

    setPipelineCards(cardsByStage);
  }, [files, apprentices, companies]);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "aujourd'hui";
    if (diffDays === 1) return "hier";
    if (diffDays < 7) return `il y a ${diffDays}j`;
    
    return new Intl.DateTimeFormat("fr-FR").format(date);
  };

  // Drag and drop handlers
  const handleDragStart = (card: PipelineCard) => {
    setDraggedItem(card);
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.currentTarget.classList.add("bg-gray-100");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("bg-gray-100");
  };

  const handleDrop = async (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-gray-100");

    if (!draggedItem) return;

    // Don't do anything if dropping in the same column
    if (draggedItem.stage === targetStage) return;

    // Find the file we're moving
    const fileToUpdate = files?.find(f => f.id === draggedItem.id);
    if (!fileToUpdate) return;

    // Update the file stage
    await updateFileStage.mutateAsync({
      fileId: draggedItem.id,
      stage: targetStage
    });

    // Update local state optimistically
    setPipelineCards(prev => {
      const newCards = { ...prev };
      
      // Remove from old column
      newCards[draggedItem.stage] = newCards[draggedItem.stage].filter(
        card => card.id !== draggedItem.id
      );
      
      // Add to new column
      newCards[targetStage] = [
        ...newCards[targetStage],
        { ...draggedItem, stage: targetStage }
      ];
      
      return newCards;
    });

    setDraggedItem(null);
  };

  const isLoading = filesLoading || apprenticesLoading || companiesLoading;

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="border-b border-gray-200 p-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">Pipeline des dossiers</h3>
        <div className="flex items-center space-x-2">
          <button className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
            <i className="ri-filter-line mr-1.5"></i>
            Filtrer
          </button>
          <button className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
            <i className="ri-sort-desc mr-1.5"></i>
            Trier
          </button>
          <button 
            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm flex items-center"
            onClick={onNewFile}
          >
            <i className="ri-add-line mr-1.5"></i>
            Nouveau dossier
          </button>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        {isLoading ? (
          <div className="flex space-x-4 min-w-max">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="pipeline-column bg-gray-50 rounded-lg p-3 flex-shrink-0 w-72 h-96 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, cardIndex) => (
                    <div key={cardIndex} className="h-24 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex space-x-4 min-w-max">
            {Object.entries(pipelineCards).map(([stage, cards]) => (
              <div
                key={stage}
                className="pipeline-column bg-gray-50 rounded-lg p-3 flex-shrink-0 min-w-72"
                onDragOver={(e) => handleDragOver(e, stage as PipelineStage)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage as PipelineStage)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700">{stageTitles[stage as PipelineStage]}</h4>
                  <span className="bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">{cards.length}</span>
                </div>

                <div className="space-y-3">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className={`bg-white rounded-md shadow-sm p-3 draggable-card border-l-4 ${stageBorderColors[card.stage]} cursor-pointer`}
                      draggable
                      onDragStart={() => handleDragStart(card)}
                      onClick={() => {
                        const file = files?.find(f => f.id === card.id);
                        if (file) onOpenFileDetail(file);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <h5 className="font-medium text-gray-800">{card.title}</h5>
                        <span className="text-xs text-gray-500">{card.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{card.subtitle}</p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <i className="ri-building-line mr-1"></i>
                        <span>{card.company}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Access the query client for invalidation
const queryClient = new QueryClient();

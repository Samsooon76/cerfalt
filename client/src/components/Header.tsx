import { useState, useEffect, useRef } from "react";
import { Search, Bell, HelpCircle, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: number;
  type: "apprentice" | "company" | "mentor" | "file" | "document";
  title: string;
  subtitle?: string;
  icon?: string;
}

interface HeaderProps {
  title: string;
  onToggleSidebar: () => void;
}

export default function Header({ title, onToggleSidebar }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const [_, setLocation] = useLocation();

  // Récupérer les données pour la recherche
  const { data: apprentices = [] } = useQuery<any[]>({
    queryKey: ["/api/apprentices"],
    enabled: searchQuery.length > 2
  });
  
  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
    enabled: searchQuery.length > 2
  });
  
  const { data: mentors = [] } = useQuery<any[]>({
    queryKey: ["/api/mentors"],
    enabled: searchQuery.length > 2
  });
  
  const { data: files = [] } = useQuery<any[]>({
    queryKey: ["/api/files"],
    enabled: searchQuery.length > 2
  });
  
  const { data: documents = [] } = useQuery<any[]>({
    queryKey: ["/api/documents"],
    enabled: searchQuery.length > 2
  });

  // Filtrer les résultats en fonction de la recherche
  const filteredResults: SearchResult[] = searchQuery.length > 2 
    ? [
        ...apprentices
          .filter(a => 
            a.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
            a.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(a => ({
            id: a.id,
            type: "apprentice" as const,
            title: `${a.firstName} ${a.lastName}`,
            subtitle: a.email || "Alternant",
            icon: "👤"
          })),
        ...companies
          .filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (c.siret && c.siret.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .map(c => ({
            id: c.id,
            type: "company" as const,
            title: c.name,
            subtitle: c.siret || "Entreprise",
            icon: "🏢"
          })),
        ...mentors
          .filter(m => 
            m.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
            m.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(m => ({
            id: m.id,
            type: "mentor" as const,
            title: `${m.firstName} ${m.lastName}`,
            subtitle: m.position || "Tuteur",
            icon: "👨‍💼"
          })),
        ...files
          .filter(f => 
            f.title && f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(f => ({
            id: f.id,
            type: "file" as const,
            title: f.title || `Dossier #${f.id}`,
            subtitle: f.description || `Étape: ${f.stage}`,
            icon: "📁"
          })),
        ...documents
          .filter(d => 
            d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            d.type.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(d => ({
            id: d.id,
            type: "document" as const,
            title: d.name,
            subtitle: d.type || "Document",
            icon: "📄"
          }))
      ]
    : [];

  // Gérer la navigation vers les résultats
  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchQuery("");
    
    switch (result.type) {
      case "apprentice":
        setLocation("/apprentices");
        break;
      case "company":
        setLocation("/companies");
        break;
      case "mentor":
        setLocation("/mentors");
        break;
      case "file":
        setLocation("/files");
        break;
      case "document":
        setLocation("/documents");
        break;
    }
  };

  // Fermer les résultats lorsqu'on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current && 
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Montrer les résultats lorsqu'on tape dans la recherche
  useEffect(() => {
    if (searchQuery.length > 2) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [searchQuery]);

  // Regrouper les résultats par type
  const groupedResults = filteredResults.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  // Traduire les types pour l'affichage
  const typeTranslations = {
    apprentice: "Alternants",
    company: "Entreprises",
    mentor: "Tuteurs",
    file: "Dossiers",
    document: "Documents",
  };

  return (
    <header className="bg-white border-b border-gray-200 flex items-center justify-between p-4">
      <div className="flex items-center">
        <button
          className="p-1 mr-4 rounded-md hover:bg-gray-100 lg:hidden"
          onClick={onToggleSidebar}
        >
          <i className="ri-menu-line text-xl text-gray-500"></i>
        </button>
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher..."
              className="pl-9 pr-9 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length > 2 && setShowResults(true)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-1"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {showResults && (
            <div 
              ref={searchResultsRef}
              className="absolute z-50 top-full mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden"
            >
              <div className="max-h-80 overflow-y-auto">
                {Object.keys(groupedResults).length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Aucun résultat trouvé pour "{searchQuery}"
                  </div>
                ) : (
                  Object.entries(groupedResults).map(([type, results]) => (
                    <div key={type}>
                      <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                        {typeTranslations[type as keyof typeof typeTranslations]}
                      </div>
                      <div>
                        {results.map((result) => (
                          <button
                            key={`${result.type}-${result.id}`}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                            onClick={() => handleResultClick(result)}
                          >
                            <div className="flex items-center">
                              <span className="mr-2">{result.icon}</span>
                              <div>
                                <div className="text-sm font-medium text-gray-800">{result.title}</div>
                                <div className="text-xs text-gray-500">{result.subtitle}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button className="relative p-2 rounded-full hover:bg-gray-100">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </button>

        <button className="p-2 rounded-full hover:bg-gray-100">
          <HelpCircle className="h-5 w-5 text-gray-500" />
        </button>
      </div>
    </header>
  );
}

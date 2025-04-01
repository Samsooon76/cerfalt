import { Link, useLocation } from "wouter";

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const [location] = useLocation();

  if (!isOpen) return null;

  const isActive = (path: string) => {
    return location === path;
  };

  const linkClass = (path: string) => {
    return `flex items-center px-3 py-2 rounded-md ${
      isActive(path)
        ? "bg-primary-50 text-primary-600 font-medium"
        : "text-gray-700 hover:bg-gray-100"
    }`;
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800">AlterManager</h1>
        <p className="text-xs text-gray-500 mt-1">Gestion des alternants</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link href="/" className={linkClass("/")}>
          <i className="ri-dashboard-line mr-3 text-lg"></i>
          <span>Tableau de bord</span>
        </Link>
        <Link href="/files" className={linkClass("/files")}>
          <i className="ri-file-list-line mr-3 text-lg"></i>
          <span>Dossiers</span>
        </Link>
        <Link href="/documents" className={linkClass("/documents")}>
          <i className="ri-folder-line mr-3 text-lg"></i>
          <span>Documents</span>
        </Link>
        <Link href="/apprentices" className={linkClass("/apprentices")}>
          <i className="ri-user-line mr-3 text-lg"></i>
          <span>Alternants</span>
        </Link>
        <Link href="/companies" className={linkClass("/companies")}>
          <i className="ri-building-line mr-3 text-lg"></i>
          <span>Entreprises</span>
        </Link>
        <Link href="/mentors" className={linkClass("/mentors")}>
          <i className="ri-user-settings-line mr-3 text-lg"></i>
          <span>Maîtres d'alternance</span>
        </Link>
        <Link href="/reports" className={linkClass("/reports")}>
          <i className="ri-bar-chart-line mr-3 text-lg"></i>
          <span>Rapports</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Link href="/settings" className={linkClass("/settings")}>
          <i className="ri-settings-line mr-3 text-lg"></i>
          <span>Paramètres</span>
        </Link>
        <div className="flex items-center mt-4 px-3 py-2">
          <img
            src="https://randomuser.me/api/portraits/women/44.jpg"
            alt="Photo de profil"
            className="w-8 h-8 rounded-full mr-3"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">Claire Martin</p>
            <p className="text-xs text-gray-500">Gestionnaire</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

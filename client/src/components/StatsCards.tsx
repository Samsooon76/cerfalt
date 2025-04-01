type StatsProps = {
  stats?: {
    totalFiles: number;
    filesByStage: Record<string, number>;
    validatedFiles: number;
    averageProcessingTime: number;
  };
};

export default function StatsCards({ stats }: StatsProps) {
  if (!stats) {
    return <div>Loading stats...</div>;
  }

  const { totalFiles, filesByStage, validatedFiles, averageProcessingTime } = stats;
  const filesInVerification = filesByStage.VERIFICATION || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Total dossiers */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total dossiers</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">{totalFiles}</p>
          </div>
          <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center">
            <i className="ri-file-list-3-line text-xl text-primary-500"></i>
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <span className="text-success-500 text-sm flex items-center">
            <i className="ri-arrow-up-line mr-1"></i> 12%
          </span>
          <span className="text-xs text-gray-500 ml-2">Depuis le mois dernier</span>
        </div>
      </div>

      {/* En cours de vérification */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">En cours de vérification</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">{filesInVerification}</p>
          </div>
          <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center">
            <i className="ri-time-line text-xl text-yellow-500"></i>
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <span className="text-danger-500 text-sm flex items-center">
            <i className="ri-arrow-up-line mr-1"></i> 5%
          </span>
          <span className="text-xs text-gray-500 ml-2">Depuis le mois dernier</span>
        </div>
      </div>

      {/* Dossiers validés */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Dossiers validés</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">{validatedFiles}</p>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
            <i className="ri-checkbox-circle-line text-xl text-green-500"></i>
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <span className="text-success-500 text-sm flex items-center">
            <i className="ri-arrow-up-line mr-1"></i> 18%
          </span>
          <span className="text-xs text-gray-500 ml-2">Depuis le mois dernier</span>
        </div>
      </div>

      {/* Temps moyen de traitement */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Temps moyen de traitement</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">
              {averageProcessingTime.toFixed(1)} jours
            </p>
          </div>
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <i className="ri-timer-line text-xl text-gray-500"></i>
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <span className="text-success-500 text-sm flex items-center">
            <i className="ri-arrow-down-line mr-1"></i> 8%
          </span>
          <span className="text-xs text-gray-500 ml-2">Depuis le mois dernier</span>
        </div>
      </div>
    </div>
  );
}

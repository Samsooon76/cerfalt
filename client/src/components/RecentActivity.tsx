import { useQuery } from "@tanstack/react-query";
import { Activity } from "@/lib/types";

export default function RecentActivity() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"]
  });

  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Aujourd'hui, ${date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
      })}`;
    }
    if (diffDays === 1) return "Hier";
    return new Intl.DateTimeFormat("fr-FR").format(date);
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "CREATE":
        return "ri-file-add-line text-primary-600";
      case "UPDATE":
      case "STAGE_CHANGE":
        return "ri-edit-line text-yellow-600";
      case "DOCUMENT_UPLOAD":
        return "ri-upload-line text-blue-600";
      case "COMMENT":
        return "ri-chat-1-line text-indigo-600";
      case "VALIDATED":
        return "ri-check-line text-green-600";
      default:
        return "ri-file-list-line text-gray-600";
    }
  };

  const getActivityIconBg = (activityType: string) => {
    switch (activityType) {
      case "CREATE":
        return "bg-primary-100";
      case "UPDATE":
      case "STAGE_CHANGE":
        return "bg-yellow-100";
      case "DOCUMENT_UPLOAD":
        return "bg-blue-100";
      case "COMMENT":
        return "bg-indigo-100";
      case "VALIDATED":
        return "bg-green-100";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b border-gray-200 p-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">Activités récentes</h3>
        <button className="text-sm text-primary-600 hover:text-primary-700">Voir tout</button>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex animate-pulse">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200"></div>
                  <div className="h-full w-0.5 bg-gray-200 mx-auto mt-2"></div>
                </div>
                <div className="flex-1 pb-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {activities?.map((activity, index) => (
              <div key={activity.id} className="flex">
                <div className="flex-shrink-0 mr-3">
                  <div
                    className={`w-9 h-9 rounded-full ${getActivityIconBg(
                      activity.activityType
                    )} flex items-center justify-center`}
                  >
                    <i className={getActivityIcon(activity.activityType)}></i>
                  </div>
                  {index < (activities?.length || 0) - 1 && (
                    <div className="h-full w-0.5 bg-gray-200 mx-auto mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm">
                    <span className="font-medium text-gray-800">{activity.user.fullName}</span>{" "}
                    <span className="text-gray-600">{activity.description}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatActivityDate(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}

            {activities?.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500">Aucune activité récente</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

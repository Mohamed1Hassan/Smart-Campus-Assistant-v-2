interface Announcement {
  text: string;
}

interface AnnouncementsCardProps {
  announcements: Announcement[];
}

export default function AnnouncementsCard({
  announcements,
}: AnnouncementsCardProps) {
  return (
    <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-textDark">
          Recent Announcements
        </h3>
      </div>
      <div className="space-y-3">
        {announcements.map((announcement, index) => (
          <div
            key={index}
            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-700 dark:text-textDark hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors duration-200"
          >
            {announcement.text}
          </div>
        ))}
      </div>
      <button className="w-full mt-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
        View all
      </button>
    </div>
  );
}

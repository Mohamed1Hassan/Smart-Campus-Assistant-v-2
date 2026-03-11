interface UpcomingExamCardProps {
  title: string;
  date: string;
}

export default function UpcomingExamCard({
  title,
  date,
}: UpcomingExamCardProps) {
  return (
    <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
      <h3 className="text-sm font-medium text-gray-600 dark:text-mutedDark mb-3">
        Upcoming Exam
      </h3>
      <h4 className="text-base font-semibold text-gray-900 dark:text-textDark mb-1">
        {title}
      </h4>
      <p className="text-sm text-gray-600 dark:text-mutedDark">{date}</p>
    </div>
  );
}

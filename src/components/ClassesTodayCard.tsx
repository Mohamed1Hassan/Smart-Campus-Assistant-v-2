interface ClassesTodayCardProps {
  count: number;
}

export default function ClassesTodayCard({ count }: ClassesTodayCardProps) {
  return (
    <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
      <h3 className="text-sm font-medium text-gray-600 dark:text-mutedDark mb-2">
        Classes Today
      </h3>
      <div className="text-5xl font-bold text-gray-900 dark:text-textDark">
        {count}
      </div>
    </div>
  );
}

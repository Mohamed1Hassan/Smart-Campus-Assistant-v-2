interface ScheduleClassCardProps {
  course: string;
  time: string;
  instructor: string;
  room?: string;
  color: string;
}

export default function ScheduleClassCard({
  course,
  time,
  instructor,
  room,
  color,
}: ScheduleClassCardProps) {
  return (
    <div
      className={`${color} text-white rounded-lg p-3 mb-2 cursor-pointer hover:opacity-90 transition-opacity`}
    >
      <h3 className="font-semibold text-sm leading-tight mb-1">{course}</h3>
      <p className="text-xs opacity-95 mb-0.5">{time}</p>
      <p className="text-xs opacity-95">
        {instructor}
        {room && ` · ${room}`}
      </p>
    </div>
  );
}

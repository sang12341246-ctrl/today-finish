
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface HeatmapProps {
    logs: { date: string; hasImage: boolean }[];
    onDateClick?: (date: string) => void;
}

export function Heatmap({ logs, onDateClick }: HeatmapProps) {
    const today = new Date();
    const startDate = subDays(today, 29); // Last 30 days
    const days = eachDayOfInterval({ start: startDate, end: today });

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">최근 30일 열정 온도 🔥</h3>
            <div className="grid grid-cols-10 gap-2">
                {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const log = logs.find(l => l.date === dateStr);
                    const isDone = !!log;
                    const hasImage = log?.hasImage;

                    return (
                        <div
                            key={dateStr}
                            onClick={() => onDateClick?.(dateStr)}
                            className={`
                                aspect-square rounded-md cursor-pointer transition-transform hover:scale-110 relative group
                                ${isDone ? 'bg-green-500 shadow-sm' : 'bg-gray-100'}
                            `}
                            title={`${dateStr} ${isDone ? '완료!' : ''}`}
                        >
                            {/* Optional: Add a small indicator for photo */}
                            {hasImage && (
                                <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full m-0.5 shadow-sm" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

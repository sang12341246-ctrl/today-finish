
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
            <div className="grid grid-cols-10 gap-2 mt-2">
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
                                aspect-square rounded-md cursor-pointer transition-all duration-200 
                                hover:scale-125 hover:z-10 relative group hover:shadow-md
                                ${isDone ? 'bg-green-500 shadow-sm' : 'bg-gray-100'}
                            `}
                        >
                            {/* Optional: Add a small indicator for photo */}
                            {hasImage && (
                                <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full m-0.5 shadow-sm" />
                            )}

                            {/* Custom Tooltip on Hover */}
                            <div className="
                                absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                                hidden group-hover:flex flex-col items-center
                                z-20 pointer-events-none
                            ">
                                <div className="bg-gray-900 text-white text-xs whitespace-nowrap px-2 py-1 rounded shadow-lg">
                                    {format(day, 'M월 d일')} {isDone ? '🔥' : '🫙'}
                                </div>
                                <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

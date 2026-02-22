'use client';


import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';

interface CalendarProps {
    currentDate?: Date;
    markedDates: string[]; // 'YYYY-MM-DD'
    logs?: { study_date: string; image_url: string | null }[];
}

export function Calendar({ currentDate = new Date(), markedDates, logs, onDateClick }: CalendarProps & { onDateClick?: (date: string) => void }) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Weekday headers (Sun, Mon, Tue...) - In Korean
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    // Fill in empty days at start of month
    const startDayIndex = getDay(monthStart);
    const emptyDays = Array.from({ length: startDayIndex });

    return (
        <div className="w-full max-w-sm mx-auto bg-white p-4 rounded-3xl shadow-lg border border-gray-100">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                    {format(currentDate, 'yyyy년 M월')}
                </h2>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDays.map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {emptyDays.map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}
                {daysInMonth.map((day) => {
                    const formattedDate = format(day, 'yyyy-MM-dd');
                    const log = logs?.find(l => l.study_date === formattedDate);
                    const isMarked = markedDates.includes(formattedDate);
                    const hasImage = !!log?.image_url;

                    return (
                        <button
                            key={formattedDate}
                            onClick={() => onDateClick?.(formattedDate)}
                            className="aspect-square flex flex-col items-center justify-center relative hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <span className={`z-10 text-sm font-medium ${isMarked ? 'text-white' : 'text-gray-800'}`}>
                                {format(day, 'd')}
                            </span>
                            {isMarked ? (
                                <div className="absolute inset-0 m-1 bg-toss-blue rounded-full" />
                            ) : (
                                <div className="absolute bottom-2 w-1 h-1 bg-gray-200 rounded-full" />
                            )}
                            {hasImage && (
                                <div className="absolute -top-1 -right-1 z-20 bg-white rounded-full shadow-sm p-0.5 border border-gray-100 animate-in fade-in zoom-in duration-300">
                                    <span className="text-[10px]">📸</span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { PremiumHomeworkModal } from './PremiumHomeworkModal';
import { supabase } from '@/lib/supabase';

interface Homework {
    id: string;
    student_name: string;
    image_urls: string[];
    study_date: string;
    created_at: string;
    description?: string;
    feedback_count?: number;
}

interface TeacherDashboardGridProps {
    homeworks: Homework[];
}

export function TeacherDashboardGrid({ homeworks }: TeacherDashboardGridProps) {
    const [selectedHw, setSelectedHw] = useState<Homework | null>(null);
    const [processedHws, setProcessedHws] = useState<Homework[]>([]);

    useEffect(() => {
        const fetchFeedbackCounts = async () => {
            // Get all homework IDs
            const hIds = homeworks.map(h => h.id);
            if (hIds.length === 0) {
                setProcessedHws([]);
                return;
            }

            // Fetch feedback for these homeworks
            const { data: feedbackData } = await supabase
                .from('premium_feedback')
                .select('homework_id')
                .in('homework_id', hIds);

            const newHws = homeworks.map(hw => ({
                ...hw,
                feedback_count: feedbackData?.filter(f => f.homework_id === hw.id).length || 0
            }));

            setProcessedHws(newHws);
        };

        fetchFeedbackCounts();
    }, [homeworks]);

    // Filter to get the latest homework per student (in case they submit multiple times today)
    const uniqueStudents = processedHws.reduce((acc, curr) => {
        if (!acc.some(h => h.student_name === curr.student_name)) {
            acc.push(curr);
        }
        return acc;
    }, [] as Homework[]);

    if (uniqueStudents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500 font-medium text-lg text-center">
                    아직 숙제를 제출한 학생이 없어요.<br />
                    <span className="text-sm">실시간으로 업데이트 대기 중... ⏳</span>
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 w-full">
                {uniqueStudents.map((hw) => (
                    <div
                        key={hw.id}
                        className="relative bg-white border border-gray-100 rounded-3xl p-4 flex flex-col items-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer animate-in zoom-in slide-in-from-bottom-4 duration-500 group"
                        onClick={() => setSelectedHw(hw)}
                    >
                        {/* Status label / checkmark */}
                        <div className={`
                            absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-lg z-10 transition-transform group-hover:scale-110
                            ${(hw.feedback_count || 0) > 0
                                ? 'bg-green-500 text-white ring-4 ring-green-100'
                                : 'bg-gray-200 text-gray-500 ring-4 ring-gray-100'}
                        `}>
                            {(hw.feedback_count || 0) > 0 ? '✓' : '?'}
                        </div>

                        {/* Thumbnail Container */}
                        <div className="w-full aspect-square rounded-2xl bg-gray-50 overflow-hidden mb-4 border border-gray-50 relative">
                            {hw.image_urls && hw.image_urls.length > 0 ? (
                                <>
                                    <img
                                        src={hw.image_urls[0]}
                                        alt={`${hw.student_name}`}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    {hw.image_urls.length > 1 && (
                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur-sm">
                                            +{hw.image_urls.length - 1}장
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    No Image
                                </div>
                            )}
                        </div>

                        {/* Student Name & Meta */}
                        <div className="text-center w-full">
                            <p className="font-extrabold text-gray-900 text-base mb-1 truncate">{hw.student_name}</p>
                            <div className="flex items-center justify-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                                    ${(hw.feedback_count || 0) > 0 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}
                                `}>
                                    {(hw.feedback_count || 0) > 0 ? '피드백 완료' : '검사 전'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedHw && (
                <PremiumHomeworkModal
                    homework={selectedHw}
                    onClose={() => setSelectedHw(null)}
                />
            )}
        </>
    );
}

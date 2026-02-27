import { useState, useEffect } from 'react';
import { PremiumHomeworkModal } from './PremiumHomeworkModal';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

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
    groupId: string;
}

export function TeacherDashboardGrid({ homeworks, groupId }: TeacherDashboardGridProps) {
    const [selectedHw, setSelectedHw] = useState<Homework | null>(null);
    const [processedHws, setProcessedHws] = useState<Homework[]>([]);
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [weeklyStats, setWeeklyStats] = useState<Record<string, number>>({});

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

        const fetchWeeklyStats = async () => {
            if (!groupId) return;

            // Calculate Monday to Sunday of the current week in KST
            const today = new Date();
            const kstTime = new Date(today.getTime() + 9 * 60 * 60 * 1000);
            const dayOfWeek = kstTime.getDay(); // 0 is Sunday, 1 is Monday
            const diffToMonday = kstTime.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);

            const monday = new Date(kstTime);
            monday.setDate(diffToMonday);
            monday.setHours(0, 0, 0, 0);
            const mondayStr = monday.toISOString().split('T')[0];

            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            const sundayStr = sunday.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('premium_homeworks')
                .select('student_name, study_date')
                .eq('group_id', groupId)
                .gte('study_date', mondayStr)
                .lte('study_date', sundayStr);

            if (error) {
                console.error("Error fetching weekly stats:", error);
                return;
            }

            // Count unique days per student this week
            const stats: Record<string, Set<string>> = {};
            data?.forEach(row => {
                if (!stats[row.student_name]) {
                    stats[row.student_name] = new Set();
                }
                stats[row.student_name].add(row.study_date);
            });

            const finalStats: Record<string, number> = {};
            Object.keys(stats).forEach(name => {
                finalStats[name] = stats[name].size;
            });

            setWeeklyStats(finalStats);
        };

        fetchFeedbackCounts();
        fetchWeeklyStats();
    }, [homeworks, groupId]);

    // Filter to get the latest homework per student (in case they submit multiple times today)
    const uniqueStudents = processedHws.reduce((acc, curr) => {
        if (!acc.some(h => h.student_name === curr.student_name)) {
            acc.push(curr);
        }
        return acc;
    }, [] as Homework[]);

    const displayedStudents = showUnreadOnly
        ? uniqueStudents.filter(hw => (hw.feedback_count || 0) === 0)
        : uniqueStudents;

    if (uniqueStudents.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-24 px-6 bg-white rounded-[2rem] border-2 border-dashed border-gray-200"
            >
                <div className="text-7xl mb-6 animate-bounce">
                    😴
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">아직 빈둥빈둥..</h3>
                <p className="text-gray-500 font-medium text-lg text-center">
                    아직 숙제를 제출한 학생이 없어요.<br />
                    <span className="text-sm text-gray-400 mt-2 block">실시간으로 업데이트 대기 중... ⏳</span>
                </p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-end pr-2">
                <label className="flex items-center gap-3 cursor-pointer group bg-gray-50 px-4 py-2 rounded-full border border-gray-100 hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-bold text-gray-700 select-none group-hover:text-toss-blue transition-colors">
                        ✅ 안 읽은 숙제만 보기
                    </span>
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={showUnreadOnly}
                            onChange={(e) => setShowUnreadOnly(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-toss-blue"></div>
                    </div>
                </label>
            </div>

            {displayedStudents.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-20 bg-blue-50/50 rounded-[2rem] border border-blue-100"
                >
                    <div className="text-7xl mb-6">
                        🎉
                    </div>
                    <h3 className="text-2xl font-extrabold text-toss-blue mb-2">짝짝짝! 모두 다 봤어요!</h3>
                    <p className="text-blue-600/70 font-medium text-lg text-center">
                        모든 학생의 숙제 검사를 완료했어요. 선생님 최고! 👍
                    </p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 w-full">
                    {displayedStudents.map((hw, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            key={hw.id}
                            className="relative bg-white border border-gray-100 rounded-[1.5rem] p-4 flex flex-col items-center shadow-sm hover:shadow-2xl hover:shadow-toss-blue/10 hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
                            onClick={() => setSelectedHw(hw)}
                        >
                            {/* Status label / checkmark */}
                            <div className={`
                            absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-lg z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12
                            ${(hw.feedback_count || 0) > 0
                                    ? 'bg-green-500 text-white ring-4 ring-green-50'
                                    : 'bg-orange-500 text-white ring-4 ring-orange-50 animate-pulse'}
                        `}>
                                {(hw.feedback_count || 0) > 0 ? '✓' : '!'}
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
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                        {hw.image_urls.length > 1 && (
                                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-md shadow-sm">
                                                +{hw.image_urls.length - 1}장
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/80">
                                        <span className="text-2xl mb-1">📝</span>
                                        <span className="text-xs font-bold">글만 작성함</span>
                                    </div>
                                )}
                            </div>

                            {/* Student Name & Meta */}
                            <div className="text-center w-full mt-auto">
                                <p className="font-extrabold text-gray-900 text-base mb-2 truncate group-hover:text-toss-blue transition-colors">{hw.student_name}</p>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className={`text-[11px] px-3 py-1 rounded-full font-bold shadow-sm transition-colors
                                        ${(hw.feedback_count || 0) > 0 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}
                                    `}>
                                            {(hw.feedback_count || 0) > 0 ? '검사완료' : '검사 대기중'}
                                        </span>
                                    </div>

                                    {/* Weekly Statistics Bar */}
                                    <div className="w-full bg-gray-50 p-2 rounded-xl border border-gray-100 mt-1">
                                        <div className="flex justify-between items-center mb-1 px-1">
                                            <span className="text-[10px] font-bold text-gray-500">이번 주 성공률</span>
                                            <span className="text-[10px] font-extrabold text-toss-blue">{weeklyStats[hw.student_name] || 1}/7일</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-toss-blue transition-all duration-1000 ease-out rounded-full"
                                                style={{ width: `${Math.min(((weeklyStats[hw.student_name] || 1) / 7) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {selectedHw && (
                <PremiumHomeworkModal
                    homework={selectedHw}
                    onClose={() => setSelectedHw(null)}
                />
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, subDays, parseISO } from 'date-fns';
import { Calendar } from '@/components/Calendar';
import { Heatmap } from '@/components/Heatmap';
import { PhotoModal } from '@/components/PhotoModal';
import { supabase } from '@/lib/supabase';

export default function ParentPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<{ study_date: string; image_url: string | null }[]>([]);
    const [loading, setLoading] = useState(true);
    const [familyCode, setFamilyCode] = useState('');
    const [streak, setStreak] = useState(0);
    const [selectedImage, setSelectedImage] = useState<{ src: string; date: string } | null>(null);

    useEffect(() => {
        const code = localStorage.getItem('family_code');
        if (!code) {
            alert('가족 암호가 필요해요!');
            router.push('/');
            return;
        }
        setFamilyCode(code);

        const fetchRecords = async (familyCode: string) => {
            const { data, error } = await supabase
                .from('study_logs')
                .select('study_date, image_url')
                .eq('family_code', familyCode)
                .order('study_date', { ascending: false });

            if (error) {
                console.error('Error fetching records:', error);
                alert('데이터를 불러오는데 실패했어요.');
            } else if (data) {
                setLogs(data);
                calculateStreak(data);
            }
            setLoading(false);
        };

        fetchRecords(code);
    }, [router]);

    function calculateStreak(data: { study_date: string }[]) {
        if (!data.length) return;

        const uniqueDates = Array.from(new Set(data.map(d => d.study_date))).sort((a, b) => b.localeCompare(a));
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');
        const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

        let currentStreak = 0;
        let checkDate = today;

        // Check if the most recent study was today or yesterday
        // If the last study was older than yesterday, streak is broken (0)
        // However, if we are calculating "current streak", we usually include today if done, or yesterday if done.

        // Simpler approach:
        // 1. Check if today is done. If yes, start checking from today backwards.
        // 2. If today is NOT done, check if yesterday is done. If yes, start checking from yesterday backwards.
        // 3. If neither, streak is 0.

        const isTodayDone = uniqueDates.includes(todayStr);
        const isYesterdayDone = uniqueDates.includes(yesterdayStr);

        let startDateStr = '';

        if (isTodayDone) {
            startDateStr = todayStr;
        } else if (isYesterdayDone) {
            startDateStr = yesterdayStr;
        } else {
            setStreak(0);
            return;
        }

        currentStreak = 1;
        checkDate = parseISO(startDateStr);

        // Iterate backwards
        // (Since dates are sorted desc, we could just iterate the array, but explicit date checking is safer against gaps)

        // Let's use the sorted array approach for efficiency
        let currentIndex = uniqueDates.indexOf(startDateStr);

        while (currentIndex !== -1 && currentIndex + 1 < uniqueDates.length) {
            const nextDateStr = uniqueDates[currentIndex + 1];
            const expectedNextDate = subDays(checkDate, 1);
            const expectedNextDateStr = format(expectedNextDate, 'yyyy-MM-dd');

            if (nextDateStr === expectedNextDateStr) {
                currentStreak++;
                checkDate = expectedNextDate;
                currentIndex++;
            } else {
                break;
            }
        }

        setStreak(currentStreak);
    };

    const handleDateClick = (date: string) => {
        const log = logs.find(l => l.study_date === date);
        if (log?.image_url) {
            setSelectedImage({ src: log.image_url, date });
        }
    };

    if (loading) return null;

    const markedDates = logs.map(l => l.study_date);

    const getStreakMessage = (current: number) => {
        if (current === 0) return '오늘부터 바로 시작해볼까요? 🚀';
        if (current === 1) return '시작이 반이에요! 화이팅! 💪';
        if (current === 2) return '이틀 연속! 훌륭해요! ✨';
        if (current === 3) return '작심삼일 극복! 대단해요! 🎉';
        if (current < 7) return '꾸준함의 힘을 믿어요! 👍';
        if (current < 30) return '완벽한 습관이 되었네요! 🔥';
        return '전설적인 꾸준함입니다! 👑';
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-6 bg-gray-50">
            <div className="w-full max-w-md space-y-6">
                <div className="flex items-center justify-between pt-4">
                    <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium">
                        &larr; 메인으로
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">학습 기록</h1>
                    <button
                        onClick={() => {
                            if (confirm('가족 암호를 초기화하고 로그아웃 하시겠습니까?')) {
                                localStorage.removeItem('family_code');
                                router.push('/');
                            }
                        }}
                        className="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors"
                    >
                        암호 초기화 🔄
                    </button>
                </div>

                <div className="text-center space-y-4">
                    <div className="inline-block px-4 py-1 bg-white rounded-full shadow-sm border border-gray-100 text-sm text-gray-500 mb-2">
                        가족 암호: {familyCode}
                    </div>

                    <div className="bg-gradient-to-br from-toss-blue to-blue-600 rounded-3xl p-6 text-white shadow-xl transform transition-transform hover:scale-[1.02]">
                        <h2 className="text-lg font-medium opacity-90 mb-1">
                            현재 연속 공부일 🔥
                        </h2>
                        <p className="text-5xl font-extrabold tracking-tight">
                            {streak}일째
                        </p>
                        <p className="text-sm mt-3 opacity-80 font-medium">
                            {getStreakMessage(streak)}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <Heatmap
                        logs={logs.map(l => ({ date: l.study_date, hasImage: !!l.image_url }))}
                        onDateClick={handleDateClick}
                    />
                </div>

                {/* Recent Photo Section */}
                {logs.find(l => l.image_url) && (
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                📸 최근 인증 사진
                            </h3>
                            <span className="text-xs text-gray-400">
                                {logs.find(l => l.image_url)?.study_date}
                            </span>
                        </div>
                        <div
                            className="relative aspect-video w-full bg-gray-50 rounded-2xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity border border-gray-50"
                            onClick={() => {
                                const latest = logs.find(l => l.image_url);
                                if (latest?.image_url) {
                                    setSelectedImage({ src: latest.image_url, date: latest.study_date });
                                }
                            }}
                        >
                            <img
                                src={logs.find(l => l.image_url)?.image_url || ''}
                                alt="공부 인증 사진"
                                className="object-cover w-full h-full"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                    </div>
                )}

                <div className="shadow-xl rounded-3xl overflow-hidden bg-white">
                    <Calendar markedDates={markedDates} logs={logs} onDateClick={handleDateClick} />
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-toss-blue font-bold">
                            {markedDates.length}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">이번 달 공부한 날</p>
                            <p className="text-sm text-gray-400">꾸준히 하고 있어요!</p>
                        </div>
                    </div>
                    <Link href="/student">
                        <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                            학생 화면 보기
                        </button>
                    </Link>
                </div>
            </div>

            {selectedImage && (
                <PhotoModal
                    src={selectedImage.src}
                    date={selectedImage.date}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </main>
    );
}

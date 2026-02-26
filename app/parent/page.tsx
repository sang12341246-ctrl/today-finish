'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, subDays, parseISO } from 'date-fns';
import { Calendar } from '@/components/Calendar';
import { Heatmap } from '@/components/Heatmap';
import { PhotoModal } from '@/components/PhotoModal';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function ParentPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<{ id: string; study_date: string; image_url: string | null; student_name?: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [roomName, setRoomName] = useState('');

    // 필터링 상태 추가
    const [selectedStudent, setSelectedStudent] = useState<string>('all');

    const [selectedImage, setSelectedImage] = useState<{ id: string; src: string; date: string; studentName?: string } | null>(null);

    useEffect(() => {
        const savedRoom = localStorage.getItem('premium_group_name');
        if (!savedRoom) {
            toast.error('입장 정보가 없습니다. 다시 로그인해주세요!');
            router.push('/');
            return;
        }
        setRoomName(savedRoom);

        const fetchRecords = async (room: string) => {
            const { data, error } = await supabase
                .from('study_logs')
                .select('id, study_date, image_url, student_name')
                .eq('room_name', room)
                .order('study_date', { ascending: false });

            if (error) {
                console.error('Error fetching records:', error);
                toast.error('데이터를 불러오는데 실패했어요.');
            } else if (data) {
                setLogs(data);
            }
            setLoading(false);
        };

        fetchRecords(savedRoom);
    }, [router]);

    // Derived State: 학생 목록 추출
    const students = useMemo(() => {
        const names = logs.map(l => l.student_name).filter(Boolean) as string[];
        return Array.from(new Set(names)).sort();
    }, [logs]);

    // Derived State: 선택된 학생의 로그 필터링
    const filteredLogs = useMemo(() => {
        if (selectedStudent === 'all') return logs;
        return logs.filter(log => log.student_name === selectedStudent);
    }, [logs, selectedStudent]);

    // Derived State: 스트릭 계산 (필터링된 로그 기반)
    const streak = useMemo(() => {
        if (!filteredLogs.length) return 0;

        const uniqueDates = Array.from(new Set(filteredLogs.map(d => d.study_date))).sort((a, b) => b.localeCompare(a));
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');
        const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

        let currentStreak = 0;
        let checkDate = today;

        const isTodayDone = uniqueDates.includes(todayStr);
        const isYesterdayDone = uniqueDates.includes(yesterdayStr);

        let startDateStr = '';

        if (isTodayDone) {
            startDateStr = todayStr;
        } else if (isYesterdayDone) {
            startDateStr = yesterdayStr;
        } else {
            return 0;
        }

        currentStreak = 1;
        checkDate = parseISO(startDateStr);

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

        return currentStreak;
    }, [filteredLogs]);

    const handleDateClick = (date: string) => {
        // 날짜 클릭 시 해당 날짜의 첫 번째 (또는 가장 최신) 사진 모달 표시
        const log = filteredLogs.find(l => l.study_date === date);
        if (log?.image_url) {
            setSelectedImage({ id: log.id, src: log.image_url, date, studentName: log.student_name });
        }
    };

    if (loading) return null;

    const markedDates = Array.from(new Set(filteredLogs.map(l => l.study_date)));

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
                            if (confirm('접속 정보를 초기화하고 메인으로 돌아가시겠습니까?')) {
                                localStorage.removeItem('premium_group_name');
                                localStorage.removeItem('premium_group_id');
                                localStorage.removeItem('premium_student_name');
                                router.push('/');
                            }
                        }}
                        className="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors"
                    >
                        로그아웃 🔄
                    </button>
                </div>

                <div className="text-center space-y-4">
                    <div className="flex flex-col items-center gap-3">
                        <div className="inline-flex px-4 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-sm text-gray-500">
                            🏫 방 이름: <span className="font-bold text-gray-800 ml-1">{roomName}</span>
                        </div>

                        {/* 학생 필터링 드롭다운 */}
                        <div className="relative w-full max-w-[200px] animate-in fade-in slide-in-from-top-2">
                            <select
                                value={selectedStudent}
                                onChange={(e) => setSelectedStudent(e.target.value)}
                                className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 px-4 pr-10 rounded-xl leading-tight focus:outline-none focus:ring-2 focus:ring-toss-blue focus:border-toss-blue font-medium shadow-sm cursor-pointer transition-all"
                            >
                                <option value="all">👨‍👩‍👧‍👦 전체 학생 모아보기</option>
                                {students.map(student => (
                                    <option key={student} value={student}>
                                        👤 {student} 기록만 보기
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-toss-blue to-blue-600 rounded-3xl p-6 text-white shadow-xl transform transition-transform hover:scale-[1.02]">
                        <h2 className="text-lg font-medium opacity-90 mb-1">
                            {selectedStudent === 'all' ? '우리가족/학급 연속 공부일 🔥' : `${selectedStudent} 최고 연속 기록 🔥`}
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
                        logs={filteredLogs.map(l => ({ date: l.study_date, hasImage: !!l.image_url }))}
                        onDateClick={handleDateClick}
                    />
                </div>

                {/* Recent Photo Section */}
                {filteredLogs.find(l => l.image_url) && (
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                📸 최근 인증 사진
                            </h3>
                            <span className="text-xs text-gray-400">
                                {filteredLogs.find(l => l.image_url)?.study_date}
                                {filteredLogs.find(l => l.image_url)?.student_name ? ` (${filteredLogs.find(l => l.image_url)?.student_name})` : ''}
                            </span>
                        </div>
                        <div
                            className="relative aspect-video w-full bg-gray-50 rounded-2xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity border border-gray-50 flex items-center justify-center"
                            onClick={() => {
                                const latest = filteredLogs.find(l => l.image_url);
                                if (latest?.image_url) {
                                    setSelectedImage({ id: latest.id, src: latest.image_url, date: latest.study_date, studentName: latest.student_name });
                                }
                            }}
                        >
                            {filteredLogs.find(l => l.image_url)?.image_url === 'deleted' ? (
                                <div className="text-center p-4">
                                    <span className="text-3xl mb-1 block">💣</span>
                                    <p className="text-xs font-bold text-gray-500">자동 삭제됨</p>
                                </div>
                            ) : (
                                <img
                                    src={filteredLogs.find(l => l.image_url)?.image_url || ''}
                                    alt="공부 인증 사진"
                                    className="object-cover w-full h-full"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                    </div>
                )}

                <div className="shadow-xl rounded-3xl overflow-hidden bg-white">
                    <Calendar markedDates={markedDates} logs={filteredLogs} onDateClick={handleDateClick} />
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-toss-blue font-bold">
                            {markedDates.length}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">
                                {selectedStudent === 'all' ? '이번 달 함께 공부한 날' : '이번 달 출석일'}
                            </p>
                            <p className="text-sm text-gray-400">꾸준히 하고 있어요!</p>
                        </div>
                    </div>
                </div>
            </div>

            {selectedImage && (
                <PhotoModal
                    src={selectedImage.src}
                    date={selectedImage.date}
                    studentName={selectedImage.studentName}
                    logId={selectedImage.id}
                    onClose={() => setSelectedImage(null)}
                    onImagesDeleted={() => {
                        setLogs(prev => prev.map(l => l.id === selectedImage.id ? { ...l, image_url: 'deleted' } : l));
                        setSelectedImage(prev => prev ? { ...prev, src: 'deleted' } : null);
                    }}
                />
            )}
        </main>
    );
}

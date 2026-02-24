'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { triggerSimpleConfetti, triggerConfetti } from '@/lib/confetti';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function StudentPage() {
    const router = useRouter();
    const [isFinished, setIsFinished] = useState(false);
    const [loading, setLoading] = useState(true);

    // SaaS 전환: familyCode 대신 roomName과 studentName 명확히 사용
    const [roomName, setRoomName] = useState('');
    const [studentName, setStudentName] = useState('');

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        // 기존 그룹/학생 정보 확인
        const savedRoom = localStorage.getItem('premium_group_name');
        const savedStudent = localStorage.getItem('premium_student_name');

        if (!savedRoom || !savedStudent) {
            toast.error('입장 정보가 없습니다. 다시 로그인해주세요!');
            router.push('/');
            return;
        }

        setRoomName(savedRoom);
        setStudentName(savedStudent);

        const checkStatus = async (room: string, student: string) => {
            const today = format(new Date(), 'yyyy-MM-dd');

            // 내 방(room_name)과 내 이름(student_name)으로 내 기록만 가져옴
            const { data: allData, error } = await supabase
                .from('study_logs')
                .select('study_date')
                .eq('room_name', room)
                .eq('student_name', student)
                .order('study_date', { ascending: false });

            if (error) {
                console.error(error);
            }

            if (allData && allData.length > 0) {
                const todayDone = allData.some(log => log.study_date === today);
                if (todayDone) setIsFinished(true);

                // Calculate Streak
                const uniqueDates = Array.from(new Set(allData.map(d => d.study_date)));
                const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

                let currentStreak = 0;
                let tDate = new Date();

                if (uniqueDates.includes(today)) {
                    currentStreak = 1;
                } else if (uniqueDates.includes(yesterday)) {
                    currentStreak = 1;
                    tDate = new Date(Date.now() - 86400000);
                }

                if (currentStreak > 0) {
                    const checkDateStr = format(tDate, 'yyyy-MM-dd');
                    let currentIndex = uniqueDates.indexOf(checkDateStr);

                    while (currentIndex !== -1 && currentIndex + 1 < uniqueDates.length) {
                        const checkDateObj = new Date(tDate);
                        checkDateObj.setDate(checkDateObj.getDate() - 1);
                        const expectedPrevDateStr = format(checkDateObj, 'yyyy-MM-dd');

                        if (uniqueDates[currentIndex + 1] === expectedPrevDateStr) {
                            currentStreak++;
                            tDate = checkDateObj;
                            currentIndex++;
                        } else {
                            break;
                        }
                    }
                }
                setStreak(currentStreak);
            }
            setLoading(false);
        };

        checkStatus(savedRoom, savedStudent);
    }, [router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleFinish = async () => {
        if (isFinished) return;

        setUploading(true);

        try {
            let publicUrl = null;

            // 1. Upload Photo if selected
            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                // Use English, numeric, and timestamp only for safe storage path
                const filePath = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('study-photos')
                    .upload(filePath, selectedFile);

                if (uploadError) {
                    throw uploadError;
                }

                const { data: urlData } = supabase.storage
                    .from('study-photos')
                    .getPublicUrl(filePath);

                publicUrl = urlData.publicUrl;
            }

            // 2. Insert Log
            const today = format(new Date(), 'yyyy-MM-dd');
            const { error: dbError } = await supabase
                .from('study_logs')
                .insert([
                    {
                        room_name: roomName,
                        student_name: studentName,
                        study_date: today,
                        image_url: publicUrl
                    }
                ]);

            if (dbError) throw dbError;

            // 3. Success UI
            triggerConfetti();
            triggerSimpleConfetti();
            setIsFinished(true);
            setStreak(prev => prev === 0 ? 1 : prev + 1); // Optimistically update streak

        } catch (error) {
            console.error('Error:', error);
            toast.error('오류가 발생했어요. 다시 시도해주세요.');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return null;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-white">
            <div className="absolute top-6 left-6">
                <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium hover:-translate-x-1 transition-transform">
                    &larr; 뒤로가기
                </Link>
            </div>

            <div className="absolute top-6 right-6">
                <button
                    onClick={() => {
                        if (confirm('접속 정보를 초기화하고 메인으로 돌아가시겠습니까?')) {
                            localStorage.removeItem('premium_group_name');
                            localStorage.removeItem('premium_student_name');
                            localStorage.removeItem('premium_group_id');
                            router.push('/');
                        }
                    }}
                    className="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors"
                >
                    로그아웃 🔄
                </button>
            </div>

            <div className="flex flex-col items-center gap-8 animate-in zoom-in duration-500 w-full max-w-sm">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900 drop-shadow-sm">
                        {isFinished ? "수고했어요! 🎉" : "오늘 공부 끝?"}
                    </h1>
                    <p className="text-gray-500">
                        {isFinished
                            ? "오늘 목표를 달성했어요. 내일도 화이팅!"
                            : "공부를 마쳤다면 버튼을 꾹 눌러주세요."}
                    </p>
                    <div className="mt-3 flex gap-2 justify-center">
                        <span className="text-sm text-toss-blue font-medium bg-blue-50 py-1.5 px-4 rounded-full shadow-sm">
                            🏫 {roomName}
                        </span>
                        <span className="text-sm text-green-700 font-medium bg-green-50 py-1.5 px-4 rounded-full shadow-sm">
                            👤 {studentName}
                        </span>
                    </div>
                </div>

                {/* Student Dashboard (Streak) */}
                {streak > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 rounded-2xl w-full border border-blue-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 font-medium">나의 기록 현황</span>
                            <span className="text-toss-blue font-bold flex items-center gap-1">
                                🔥 현재 <span className="text-xl">{streak}</span>일째 달성 중!
                            </span>
                        </div>
                    </div>
                )}

                {!isFinished && (
                    <div className="w-full">
                        <label
                            htmlFor="photo-upload"
                            className={`
                                block w-full p-4 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors
                                ${selectedFile ? 'border-toss-blue bg-blue-50 text-toss-blue' : 'border-gray-300 hover:border-gray-400 text-gray-500'}
                            `}
                        >
                            {selectedFile ? (
                                <span className="font-medium truncate block">📸 {selectedFile.name}</span>
                            ) : (
                                <span>📸 사진 첨부하기 (선택)</span>
                            )}
                            <input
                                id="photo-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                )}

                <div className="relative group">
                    <button
                        onClick={handleFinish}
                        disabled={isFinished || uploading}
                        className={`
                            w-64 h-64 rounded-full text-3xl font-bold shadow-2xl transition-all duration-300 transform
                            flex flex-col items-center justify-center gap-2
                            ${isFinished
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed scale-95'
                                : 'bg-toss-blue text-white hover:bg-toss-blue-hover hover:scale-105 hover:-translate-y-1 active:scale-90 active:translate-y-2 shadow-blue-500/40 ring-4 ring-blue-100 group-hover:shadow-[0_20px_50px_rgba(49,_130,_246,_0.5)]'}
                            ${uploading ? 'cursor-wait opacity-80' : ''}
                        `}
                    >
                        {uploading ? (
                            <>
                                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-2" />
                                <span className="text-lg">사진 올리는 중...</span>
                            </>
                        ) : (
                            isFinished ? "완료됨" : "오늘 공부 끝!"
                        )}
                    </button>
                    {!isFinished && !uploading && (
                        <div className="absolute -inset-4 bg-toss-blue/20 rounded-full blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                </div>

                {isFinished && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Link href="/group">
                            <span className="text-sm text-gray-400 hover:text-gray-600 underline decoration-gray-300 hover:decoration-gray-400 underline-offset-4 transition-colors">
                                단체방으로 돌아가기
                            </span>
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}

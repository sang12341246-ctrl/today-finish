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
    const [familyCode, setFamilyCode] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        const code = localStorage.getItem('family_code');
        if (!code) {
            toast.error('가족 암호가 필요해요!');
            router.push('/');
            return;
        }
        setFamilyCode(code);

        const checkStatus = async (familyCode: string) => {
            const today = format(new Date(), 'yyyy-MM-dd');

            const { data: allData } = await supabase
                .from('study_logs')
                .select('study_date')
                .eq('family_code', familyCode)
                .order('study_date', { ascending: false });

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

        checkStatus(code);
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
                        family_code: familyCode,
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
                    <p className="text-sm text-toss-blue font-medium bg-blue-50 py-1.5 px-4 rounded-full inline-block mt-2 shadow-sm">
                        가족 암호: {familyCode}
                    </p>
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
                        <Link href="/parent">
                            <span className="text-sm text-gray-400 hover:text-gray-600 underline decoration-gray-300 hover:decoration-gray-400 underline-offset-4 transition-colors">
                                달력 확인하러 가기
                            </span>
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}

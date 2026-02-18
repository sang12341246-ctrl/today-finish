'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { triggerSimpleConfetti, triggerConfetti } from '@/lib/confetti';
import { supabase } from '@/lib/supabase';

export default function StudentPage() {
    const router = useRouter();
    const [isFinished, setIsFinished] = useState(false);
    const [loading, setLoading] = useState(true);
    const [familyCode, setFamilyCode] = useState('');

    useEffect(() => {
        const code = localStorage.getItem('family_code');
        if (!code) {
            alert('가족 암호가 필요해요!');
            router.push('/');
            return;
        }
        setFamilyCode(code);
        checkStatus(code);
    }, []);

    const checkStatus = async (code: string) => {
        const today = format(new Date(), 'yyyy-MM-dd');

        const { data } = await supabase
            .from('study_logs')
            .select('*')
            .eq('family_code', code)
            .eq('study_date', today)
            .single();

        if (data) {
            setIsFinished(true);
        }
        setLoading(false);
    };

    const handleFinish = async () => {
        if (isFinished) return;

        // Trigger confetti immediately for better UX
        triggerConfetti();
        triggerSimpleConfetti();
        setIsFinished(true);

        const today = format(new Date(), 'yyyy-MM-dd');

        // Save to Supabase
        const { error } = await supabase
            .from('study_logs')
            .insert([
                { family_code: familyCode, study_date: today }
            ]);

        if (error) {
            console.error('Error saving log:', error);
            alert('저장에 실패했어요 ㅠㅠ 다시 시도해주세요.');
            setIsFinished(false); // Revert optimistic update
        }
    };

    if (loading) return null;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-white">
            <div className="absolute top-6 left-6">
                <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium">
                    &larr; 뒤로가기
                </Link>
            </div>

            <div className="flex flex-col items-center gap-12 animate-in zoom-in duration-300">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isFinished ? "수고했어요! 🎉" : "오늘 공부 끝?"}
                    </h1>
                    <p className="text-gray-500">
                        {isFinished
                            ? "오늘 목표를 달성했어요. 내일도 화이팅!"
                            : "공부를 마쳤다면 버튼을 꾹 눌러주세요."}
                    </p>
                    <p className="text-sm text-toss-blue font-medium bg-blue-50 py-1 px-3 rounded-full inline-block mt-2">
                        가족 암호: {familyCode}
                    </p>
                </div>

                <button
                    onClick={handleFinish}
                    disabled={isFinished}
                    className={`
            w-64 h-64 rounded-full text-3xl font-bold shadow-2xl transition-all duration-300 transform
            flex items-center justify-center
            ${isFinished
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed scale-95'
                            : 'bg-toss-blue text-white hover:bg-toss-blue-hover hover:scale-105 active:scale-95 shadow-blue-500/40 ring-4 ring-blue-100'}
          `}
                >
                    {isFinished ? "완료됨" : "오늘 공부 끝!"}
                </button>

                {isFinished && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Link href="/parent">
                            <span className="text-sm text-gray-400 underline decoration-gray-300 underline-offset-4">
                                달력 확인하러 가기
                            </span>
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}

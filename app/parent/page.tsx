'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/Calendar';
import { supabase } from '@/lib/supabase';

export default function ParentPage() {
    const router = useRouter();
    const [markedDates, setMarkedDates] = useState<string[]>([]);
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
        fetchRecords(code);
    }, []);

    const fetchRecords = async (code: string) => {
        const { data, error } = await supabase
            .from('study_logs')
            .select('study_date')
            .eq('family_code', code);

        if (error) {
            console.error('Error fetching records:', error);
            alert('데이터를 불러오는데 실패했어요.');
        } else if (data) {
            setMarkedDates(data.map(log => log.study_date));
        }
        setLoading(false);
    };

    if (loading) return null;

    return (
        <main className="flex min-h-screen flex-col items-center p-6 bg-gray-50">
            <div className="w-full max-w-md space-y-8">
                <div className="flex items-center justify-between pt-4">
                    <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium">
                        &larr; 메인으로
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">학습 기록</h1>
                    <div className="w-16" /> {/* Spacer for centering */}
                </div>

                <div className="text-center py-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        이번 달 학습 현황 📅
                    </h2>
                    <p className="text-gray-500">
                        파란색 동그라미가 있는 날은 공부를 완료한 날이에요.
                    </p>
                    <p className="text-sm text-toss-blue font-medium bg-blue-50 py-1 px-3 rounded-full inline-block mt-2">
                        가족 암호: {familyCode}
                    </p>
                </div>

                <div className="shadow-xl rounded-3xl overflow-hidden bg-white">
                    <Calendar markedDates={markedDates} />
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
                        <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">
                            학생 화면 보기
                        </button>
                    </Link>
                </div>
            </div>
        </main>
    );
}

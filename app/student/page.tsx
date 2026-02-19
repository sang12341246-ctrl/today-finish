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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const code = localStorage.getItem('family_code');
        if (!code) {
            alert('가족 암호가 필요해요!');
            router.push('/');
            return;
        }
        setFamilyCode(code);

        const checkStatus = async (familyCode: string) => {
            const today = format(new Date(), 'yyyy-MM-dd');

            const { data } = await supabase
                .from('study_logs')
                .select('*')
                .eq('family_code', familyCode)
                .eq('study_date', today)
                .single();

            if (data) {
                setIsFinished(true);
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

        } catch (error) {
            console.error('Error:', error);
            alert('오류가 발생했어요. 다시 시도해주세요.');
        } finally {
            setUploading(false);
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

            <div className="flex flex-col items-center gap-12 animate-in zoom-in duration-300 w-full max-w-sm">
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

                <button
                    onClick={handleFinish}
                    disabled={isFinished || uploading}
                    className={`
            w-64 h-64 rounded-full text-3xl font-bold shadow-2xl transition-all duration-300 transform
            flex flex-col items-center justify-center gap-2
            ${isFinished
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed scale-95'
                            : 'bg-toss-blue text-white hover:bg-toss-blue-hover hover:scale-105 active:scale-95 shadow-blue-500/40 ring-4 ring-blue-100'}
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

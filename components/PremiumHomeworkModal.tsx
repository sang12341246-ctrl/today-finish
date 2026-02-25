'use client';

import { useEffect, useState } from 'react';
import { TeacherFeedback } from './TeacherFeedback';

interface PremiumHomeworkModalProps {
    homework: {
        id: string;
        student_name: string;
        image_urls: string[];
        study_date: string;
        created_at: string;
        description?: string;
    } | null;
    onClose: () => void;
    onUpdate?: () => void; // 부모 컴포넌트의 데이터 리프레시 용도
}

export function PremiumHomeworkModal({ homework, onClose, onUpdate }: PremiumHomeworkModalProps) {
    const [currentImageIdx, setCurrentImageIdx] = useState(0);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!homework) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-10 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            {homework.student_name}의 숙제 📝
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            제출 시간: {new Date(homework.created_at).toLocaleString()}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Left: Image Gallery */}
                        <div className="space-y-4">
                            {homework.image_urls && homework.image_urls.length > 0 ? (
                                <>
                                    <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
                                        <img
                                            src={homework.image_urls[currentImageIdx]}
                                            alt="Homework"
                                            className="object-contain w-full h-full"
                                        />

                                        {homework.image_urls.length > 1 && (
                                            <>
                                                <button
                                                    onClick={() => setCurrentImageIdx((prev) => (prev > 0 ? prev - 1 : homework.image_urls.length - 1))}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors"
                                                >
                                                    &larr;
                                                </button>
                                                <button
                                                    onClick={() => setCurrentImageIdx((prev) => (prev < homework.image_urls.length - 1 ? prev + 1 : 0))}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors"
                                                >
                                                    &rarr;
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Thumbnails */}
                                    {homework.image_urls.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                            {homework.image_urls.map((url, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentImageIdx(idx)}
                                                    className={`
                                                        w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0
                                                        ${currentImageIdx === idx ? 'border-toss-blue scale-105 shadow-md' : 'border-transparent opacity-60'}
                                                    `}
                                                >
                                                    <img src={url} alt="thumb" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="aspect-square bg-gray-50 rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                                    <span className="text-4xl mb-3">💣</span>
                                    <h4 className="font-bold text-gray-700 mb-1">사진이 삭제되었습니다</h4>
                                    <p className="text-sm text-gray-400">데이터 비용 절감을 위해<br />검사 완료된 사진은 자동 파기됩니다.</p>
                                </div>
                            )}
                        </div>

                        {/* Right: Info & Feedback */}
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-inner">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">학생 설명</h3>
                                <p className="text-gray-800 leading-relaxed font-medium">
                                    {homework.description || "등록된 설명이 없습니다."}
                                </p>
                            </div>

                            {/* Teacher Feedback Component */}
                            <TeacherFeedback
                                homeworkId={homework.id}
                                imageUrls={homework.image_urls}
                                onClose={onClose}
                                onImagesDeleted={() => {
                                    if (onUpdate) onUpdate();
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Feedback {
    id: string;
    content: string;
    reaction_type: string;
    created_at: string;
}

interface TeacherFeedbackProps {
    homeworkId: string;
    imageUrls?: string[];
    onClose?: () => void;
    onImagesDeleted?: () => void;
}

const REACTION_TYPES = [
    { type: 'clap', emoji: '👏', label: '참 잘했어요' },
    { type: 'heart', emoji: '❤️', label: '멋져요' },
    { type: 'star', emoji: '⭐', label: '최고예요' },
    { type: 'check', emoji: '✅', label: '확인완료 (사진 삭제)' },
];

export function TeacherFeedback({ homeworkId, imageUrls, onClose, onImagesDeleted }: TeacherFeedbackProps) {
    const [comment, setComment] = useState('');
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
    const [showStamp, setShowStamp] = useState(false);
    const [stampEmoji, setStampEmoji] = useState<string | null>(null);

    useEffect(() => {
        async function fetchFeedbacks() {
            const { data } = await supabase
                .from('premium_feedback')
                .select('*')
                .eq('homework_id', homeworkId)
                .order('created_at', { ascending: true });

            if (data) setFeedbacks(data);
        }

        fetchFeedbacks();

        // Subscribe to feedback changes
        const channel = supabase
            .channel(`feedback:${homeworkId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'premium_feedback',
                    filter: `homework_id=eq.${homeworkId}`,
                },
                () => fetchFeedbacks()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [homeworkId]);

    const handleSubmit = async (reactionType?: string) => {
        if (!comment.trim() && !reactionType) return;

        setLoading(true);

        const rType = reactionType || selectedReaction;

        try {
            // 1. 피드백 남기기
            const { error: feedbackError } = await supabase
                .from('premium_feedback')
                .insert({
                    homework_id: homeworkId,
                    content: comment.trim(),
                    reaction_type: rType,
                });

            if (feedbackError) throw feedbackError;

            // 2. [가성비 폭파 시스템] 선생님 확인 시 사진 즉시 지우기
            // 이미지가 남아있을 때만 실행
            if (imageUrls && imageUrls.length > 0) {
                // 스토리지 파일 삭제를 위해 경로(Key) 추출
                const filePaths = imageUrls.map(url => {
                    const parts = url.split('/premium-photos/');
                    return parts.length > 1 ? parts[1] : null;
                }).filter(Boolean) as string[];

                if (filePaths.length > 0) {
                    await supabase.storage.from('premium-photos').remove(filePaths);
                }

                // DB의 image_urls를 빈 배열로 밀어버리고 확인 마킹 추가
                await supabase
                    .from('premium_homeworks')
                    .update({
                        image_urls: [],
                        description: `[선생님 확인 완료 - 비용 절감을 위해 사진이 자동 폭파되었습니다 💣]\n\n학생: `
                    })
                    .eq('id', homeworkId);

                if (onImagesDeleted) onImagesDeleted();
            }

            setComment('');
            setSelectedReaction(null);

            const emoji = REACTION_TYPES.find(r => r.type === rType)?.emoji || '✅';
            setStampEmoji(emoji);
            setShowStamp(true);
            toast.success('피드백 전송 및 사진 자동 비우기 완료! 🗑️');

            setTimeout(() => {
                setShowStamp(false);
                if (onClose) onClose();
            }, 1500);

        } catch (error) {
            console.error('Feedback & Delete error:', error);
            toast.error('오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 mt-6 border-t pt-6">
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">선생님 칭찬 한마디</h3>

                {/* Reactions Grid */}
                <div className="grid grid-cols-4 gap-2">
                    {REACTION_TYPES.map((reaction) => (
                        <button
                            key={reaction.type}
                            onClick={() => handleSubmit(reaction.type)}
                            disabled={loading}
                            className={`
                                flex flex-col items-center justify-center p-3 rounded-2xl border transition-all
                                ${loading ? 'opacity-50 cursor-wait' : 'hover:scale-105 active:scale-95'}
                                ${feedbacks.some(f => f.reaction_type === reaction.type)
                                    ? 'bg-blue-50 border-toss-blue text-toss-blue'
                                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}
                            `}
                        >
                            <span className="text-2xl mb-1">{reaction.emoji}</span>
                            <span className="text-[10px] font-bold">{reaction.label}</span>
                        </button>
                    ))}
                </div>

                {/* Comment Input */}
                <div className="relative group">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="이곳에 학생을 격려하는 메시지를 남겨주세요!"
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-toss-blue outline-none transition-all resize-none min-h-[80px]"
                        disabled={loading}
                    />
                    <button
                        onClick={() => handleSubmit()}
                        disabled={loading || !comment.trim()}
                        className="absolute bottom-3 right-3 bg-toss-blue text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-30 disabled:shadow-none transition-all"
                    >
                        등록
                    </button>
                </div>
            </div>

            {/* Feedback History */}
            {feedbacks.length > 0 && (
                <div className="space-y-3">
                    {feedbacks.map((f) => (
                        <div key={f.id} className="bg-blue-50/50 p-4 rounded-2xl border border-blue-50 flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                            {f.reaction_type && (
                                <span className="text-xl bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0">
                                    {REACTION_TYPES.find(r => r.type === f.reaction_type)?.emoji}
                                </span>
                            )}
                            <div className="flex-1">
                                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                                    {f.content || REACTION_TYPES.find(r => r.type === f.reaction_type)?.label}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    {new Date(f.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stamp Animation Overlay */}
            {showStamp && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] animate-in fade-in duration-300"></div>
                    <div className="relative animate-in zoom-in spin-in-12 duration-500 flex flex-col items-center">
                        <span className="text-9xl drop-shadow-2xl translate-y-4">
                            {stampEmoji}
                        </span>
                        <div className="text-3xl font-black text-rose-500 -rotate-12 border-4 border-rose-500 p-2 rounded-xl bg-white/60 backdrop-blur-sm -translate-y-8 shadow-xl">
                            참 잘했어요!
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

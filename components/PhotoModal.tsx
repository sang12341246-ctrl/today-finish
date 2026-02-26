import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface PhotoModalProps {
    src: string | null;
    date: string | null;
    studentName?: string;
    onClose: () => void;
    logId?: string | null; // 삭제를 위해 필요
    onImagesDeleted?: () => void;
}

export function PhotoModal({ src, date, studentName, onClose, logId, onImagesDeleted }: PhotoModalProps) {
    const [deleting, setDeleting] = useState(false);
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!src) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white p-2 rounded-2xl max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={onClose}
                        className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="text-center mb-2 mt-2">
                    <h3 className="text-lg font-bold text-gray-900">
                        {date}의 기록 📸
                    </h3>
                    {studentName && (
                        <p className="text-sm text-toss-blue font-medium mt-1">
                            👤 {studentName} 학생
                        </p>
                    )}
                </div>

                <div className="relative aspect-[3/4] w-full bg-gray-100 rounded-xl overflow-hidden">
                    {src === 'deleted' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center animate-in fade-in bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
                            <span className="text-4xl mb-3">💣</span>
                            <h4 className="font-bold text-gray-700 mb-1">사진이 삭제되었습니다</h4>
                            <p className="text-sm text-gray-400">데이터 비용 절감을 위해<br />검사 완료된 사진은 자동 파기됩니다.</p>
                        </div>
                    ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={src}
                            alt="Study proof"
                            className="object-contain w-full h-full"
                        />
                    )}
                </div>

                {src && src !== 'deleted' && logId && (
                    <div className="mt-4 flex justify-center">
                        <button
                            onClick={async () => {
                                if (!confirm('사진 확인을 완료하셨나요?\n비용 절감을 위해 이 사진을 서버에서 삭제합니다! 💣')) return;
                                setDeleting(true);
                                try {
                                    // 스토리지 삭제
                                    const parts = src.split('/study-photos/');
                                    const filePath = parts.length > 1 ? parts[1] : null;
                                    if (filePath) {
                                        await supabase.storage.from('study-photos').remove([filePath]);
                                    }
                                    // DB 마킹
                                    await supabase.from('study_logs').update({ image_url: 'deleted' }).eq('id', logId);

                                    toast.success('확인 완료! 스토리지 공간이 폭파(확보)되었습니다 🗑️');
                                    if (onImagesDeleted) onImagesDeleted();
                                    onClose();
                                } catch (error) {
                                    console.error('Delete error', error);
                                    toast.error('오류가 발생했습니다.');
                                } finally {
                                    setDeleting(false);
                                }
                            }}
                            disabled={deleting}
                            className="bg-toss-blue hover:bg-toss-blue-hover text-white px-6 py-3 rounded-xl font-bold w-full shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                        >
                            {deleting ? '폭파 중... 🚀' : '✅ 확인 완료 (사진 지우기)'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

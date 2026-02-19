
import { useEffect } from 'react';

interface PhotoModalProps {
    src: string | null;
    date: string | null;
    onClose: () => void;
}

export function PhotoModal({ src, date, onClose }: PhotoModalProps) {
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
                    <h3 className="text-lg font-bold text-gray-900">{date}의 기록 📸</h3>
                </div>

                <div className="relative aspect-[3/4] w-full bg-gray-100 rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={src}
                        alt="Study proof"
                        className="object-contain w-full h-full"
                    />
                </div>
            </div>
        </div>
    );
}

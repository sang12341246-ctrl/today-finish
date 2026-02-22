'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function FailContent() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');
    const message = searchParams.get('message');

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-2">
                    ✕
                </div>
                <h1 className="text-2xl font-bold text-gray-900">결제에 실패했습니다</h1>

                <div className="bg-gray-50 p-4 rounded-2xl text-left space-y-2">
                    <p className="text-sm text-gray-400 font-medium">에러 메시지</p>
                    <p className="text-gray-700 font-bold">{message || '알 수 없는 오류가 발생했습니다.'}</p>
                    {code && <p className="text-xs text-gray-400">에러 코드: {code}</p>}
                </div>

                <div className="space-y-3 pt-4">
                    <Link
                        href="/premium"
                        className="block w-full py-4 bg-toss-blue text-white font-bold rounded-xl hover:bg-blue-600 transition-colors"
                    >
                        다시 시도하기
                    </Link>
                    <Link
                        href="/"
                        className="block w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        홈으로 돌아가기
                    </Link>
                </div>
            </div>
        </main>
    );
}

export default function PaymentFailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <FailContent />
        </Suspense>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function GroupPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');

    const handleConfirm = () => {
        if (password === 'test') {
            router.push('/group/role-select');
        } else {
            alert('잘못된 비밀번호입니다.');
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
            <div className="text-center w-full max-w-md space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in zoom-in duration-500">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                    프리미엄 단체방 입장
                </h1>

                <div className="space-y-4 text-left">
                    <label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">
                        비밀번호 입력칸 🔒
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호를 입력하세요"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-toss-blue focus:ring-2 focus:ring-blue-100 outline-none transition-all text-lg font-medium bg-gray-50 mb-4"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirm();
                        }}
                    />
                    <Button
                        onClick={handleConfirm}
                        variant="primary"
                        fullWidth
                        className="text-xl py-6 rounded-3xl shadow-lg shadow-blue-500/20"
                    >
                        확인
                    </Button>
                </div>
            </div>
        </main>
    );
}

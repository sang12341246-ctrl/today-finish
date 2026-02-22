'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function GroupPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');

    const handleTeacherRole = () => {
        if (password.trim().length < 2) {
            alert('단체방 이름을 2글자 이상 입력해주세요! 🔒');
            return;
        }
        localStorage.setItem('premium_group_id', password.trim());
        localStorage.setItem('premium_group_name', password.trim());
        router.push('/group/teacher');
    };

    const handleStudentRole = () => {
        if (password.trim().length < 2) {
            alert('단체방 이름을 2글자 이상 입력해주세요! 🔒');
            return;
        }
        localStorage.setItem('premium_group_id', password.trim());
        localStorage.setItem('premium_group_name', password.trim());
        router.push('/group/role-select');
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
            <div className="absolute top-6 left-6">
                <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium hover:-translate-x-1 transition-transform">
                    &larr; 메인으로
                </Link>
            </div>

            <div className="text-center w-full max-w-md space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in zoom-in duration-500">
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 leading-tight">
                        단체방 입장
                    </h1>
                    <p className="text-gray-500 font-medium">우리 단체방 이름(또는 암호)을 입력해주세요.</p>
                </div>

                <div className="space-y-4 text-left">
                    <label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">
                        단체방 이름 (고유 암호) 🔑
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="예: hello1234"
                        className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:border-toss-blue focus:ring-2 focus:ring-blue-100 outline-none transition-all text-lg font-medium bg-gray-50"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleStudentRole();
                        }}
                    />
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <button
                        onClick={handleStudentRole}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl text-lg font-bold shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
                    >
                        학생 입장 👨‍🎓
                    </button>
                    <button
                        onClick={handleTeacherRole}
                        className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl text-lg font-bold shadow-sm transition-all hover:bg-gray-200 active:scale-[0.98]"
                    >
                        선생님 입장 👩‍🏫
                    </button>
                </div>
            </div>
        </main>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from "react-hot-toast";

type Role = 'student' | 'teacher';

export default function GroupPasswordPage() {
    const router = useRouter();
    const [role, setRole] = useState<Role>('student');
    const [password, setPassword] = useState('');
    const [studentName, setStudentName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEntry = () => {
        if (password.trim().length < 2) {
            toast.error('단체방 이름을 2글자 이상 입력해주세요! 🔒');
            return;
        }

        if (role === 'student' && !studentName.trim()) {
            toast.error('학생의 이름을 정확히 입력해주세요! 👤');
            return;
        }

        setLoading(true);

        // State update simulation with tiny timeout to prevent React sync render issues
        setTimeout(() => {
            localStorage.setItem('premium_group_id', password.trim());
            localStorage.setItem('premium_group_name', password.trim());

            if (role === 'student') {
                localStorage.setItem('premium_student_name', studentName.trim());
                toast.success(`${studentName} 학생, 환영합니다!`);
                router.push('/group/student');
            } else {
                toast.success('선생님, 환영합니다!');
                router.push('/group/teacher');
            }
        }, 100);
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
            <div className="absolute top-6 left-6">
                <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium hover:-translate-x-1 transition-transform inline-flex items-center gap-2">
                    <span className="text-xl">&larr;</span> 메인으로
                </Link>
            </div>

            <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 leading-tight">
                        단체방 입장
                    </h1>
                    <p className="text-gray-500 font-medium">우리 단체방 이름(또는 암호)을 입력해주세요.</p>
                </div>

                {/* Role Selection Tabs */}
                <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
                    <button
                        onClick={() => setRole('student')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${role === 'student'
                                ? 'bg-white text-toss-blue shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        👨‍🎓 학생
                    </button>
                    <button
                        onClick={() => setRole('teacher')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${role === 'teacher'
                                ? 'bg-white text-toss-blue shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        👩‍🏫 선생님
                    </button>
                </div>

                <div className="space-y-5">
                    {/* Common Group input */}
                    <div className="space-y-2 text-left">
                        <label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">
                            단체방 이름 (고유 암호) 🔑
                        </label>
                        <input
                            id="password"
                            type="text"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="예: hello1234"
                            className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-toss-blue focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-lg font-medium bg-gray-50 hover:bg-white"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && role === 'teacher') handleEntry();
                            }}
                        />
                    </div>

                    {/* Conditional Student Name input */}
                    {role === 'student' && (
                        <div className="space-y-2 text-left animate-in fade-in slide-in-from-top-2 duration-300">
                            <label htmlFor="studentName" className="text-sm font-bold text-gray-700 ml-1">
                                학생 이름 👤
                            </label>
                            <input
                                id="studentName"
                                type="text"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                placeholder="예: 홍길동"
                                className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-toss-blue focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-lg font-medium bg-gray-50 hover:bg-white"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleEntry();
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    <button
                        onClick={handleEntry}
                        disabled={loading}
                        className="w-full py-4 bg-toss-blue text-white rounded-2xl text-lg font-extrabold shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600 active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {loading ? '입장 중...' : `${role === 'student' ? '숙제하러 가기 🚀' : '채점하러 가기 🖍️'}`}
                    </button>
                </div>
            </div>
        </main>
    );
}

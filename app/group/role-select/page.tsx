'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RoleSelectPage() {
    const router = useRouter();
    const [groupName, setGroupName] = useState('');
    const [studentName, setStudentName] = useState('');

    useEffect(() => {
        const groupId = localStorage.getItem('premium_group_id');
        const name = localStorage.getItem('premium_group_name');
        const savedStudentName = localStorage.getItem('premium_student_name');

        if (!groupId) {
            router.push('/');
            return;
        }

        if (name) {
            setGroupName(name);
        }
        if (savedStudentName) {
            setStudentName(savedStudentName);
        }
    }, [router]);

    const handleStudentClick = () => {
        if (!studentName.trim()) {
            alert('학생 화면에 입장하려면 본인의 이름을 꼭 입력해주세요!');
            return;
        }
        localStorage.setItem('premium_student_name', studentName.trim());
        router.push('/group/student');
    };

    const handleTeacherClick = () => {
        router.push('/group/teacher');
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
            <div className="absolute top-6 left-6">
                <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium hover:-translate-x-1 transition-transform">
                    &larr; 메인으로
                </Link>
            </div>

            <div className="text-center max-w-md w-full space-y-10 animate-in fade-in zoom-in duration-500">
                <div className="space-y-4">
                    <div className="inline-block px-4 py-1.5 bg-blue-50 text-toss-blue font-bold rounded-full mb-2">
                        {groupName} 단체방
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 leading-tight">
                        학생 이름을 입력해주세요 📛
                    </h1>
                </div>

                {/* Name Input for Students */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-left space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="studentName" className="font-bold text-gray-700 ml-1">
                            보낼 사람 이름
                        </label>
                        <input
                            id="studentName"
                            type="text"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            placeholder="예: 홍길동"
                            className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:border-toss-blue focus:ring-2 focus:ring-blue-100 outline-none transition-all text-lg font-medium bg-gray-50"
                        />
                        <p className="text-xs text-gray-400 ml-1">
                            선생님께 보여질 이름이니 실명을 권장해요!
                        </p>
                    </div>

                    <button
                        onClick={handleStudentClick}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl text-lg font-bold shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] mt-2"
                    >
                        입장하기 📸
                    </button>

                    <button
                        onClick={() => router.push('/group')}
                        className="w-full py-3 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
                    >
                        다시 선택하기
                    </button>
                </div>
            </div>
        </main>
    );
}

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
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                        누구신가요?
                    </h1>
                </div>

                {/* Name Input for Students */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-left space-y-2">
                    <label htmlFor="studentName" className="font-bold text-gray-700 ml-1">
                        이름 (학생용) 📛
                    </label>
                    <input
                        id="studentName"
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="예: 홍길동"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-toss-blue focus:ring-2 focus:ring-blue-100 outline-none transition-all text-lg font-medium"
                    />
                    <p className="text-xs text-gray-400 ml-1">
                        학생이라면 실명이나 활동명을 꼭 남겨주세요!
                    </p>
                </div>

                <div className="flex flex-col gap-4 w-full">
                    <button
                        onClick={handleStudentClick}
                        className="flex items-center justify-between p-6 bg-white rounded-3xl shadow-sm hover:shadow-md border border-gray-100 transition-all group"
                    >
                        <div className="text-left">
                            <h2 className="text-2xl font-bold text-gray-800 mb-1 group-hover:text-toss-blue transition-colors">학생 👨‍🎓</h2>
                            <p className="text-sm text-gray-500 font-medium">숙제 사진 여러 장을 올릴래요</p>
                        </div>
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                            <span className="text-xl">📸</span>
                        </div>
                    </button>

                    <button
                        onClick={handleTeacherClick}
                        className="flex items-center justify-between p-6 bg-white rounded-3xl shadow-sm hover:shadow-md border border-gray-100 transition-all group"
                    >
                        <div className="text-left">
                            <h2 className="text-2xl font-bold text-gray-800 mb-1 group-hover:text-toss-blue transition-colors">선생님 👩‍🏫</h2>
                            <p className="text-sm text-gray-500 font-medium">우리 반 숙제 현황을 확인할래요</p>
                        </div>
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                            <span className="text-xl">📊</span>
                        </div>
                    </button>
                </div>
            </div>
        </main>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

type Role = 'student' | 'teacher';

export default function GroupPasswordPage() {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);

    const [role, setRole] = useState<Role>('student');
    const [roomName, setRoomName] = useState('');
    const [password, setPassword] = useState('');
    const [creatorName, setCreatorName] = useState('');
    const [studentName, setStudentName] = useState('');
    const [loading, setLoading] = useState(false);

    // Rate Limiting 상태
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
    const [remainingTime, setRemainingTime] = useState(0);

    // 컴포넌트 마운트 시 로컬스토리지 값 로드 (동기적 setState 방지)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedRoom = localStorage.getItem('premium_group_name');
            const savedPass = localStorage.getItem('premium_group_id');
            const savedStudent = localStorage.getItem('premium_student_name');

            if (savedRoom) setRoomName(savedRoom);
            if (savedPass) setPassword(savedPass);
            if (savedStudent) setStudentName(savedStudent);

            const savedLockout = localStorage.getItem("group_lockout_end");
            const savedAttempts = localStorage.getItem("group_failed_attempts");

            if (savedLockout) {
                const parsedLockout = parseInt(savedLockout, 10);
                if (parsedLockout > Date.now()) {
                    setLockoutEndTime(parsedLockout);
                } else {
                    localStorage.removeItem("group_lockout_end");
                    localStorage.removeItem("group_failed_attempts");
                }
            }

            if (savedAttempts) {
                setFailedAttempts(parseInt(savedAttempts, 10));
            }
        }
    }, []);

    // 타이머 훅: 의존성 배열 및 클린업 완벽 구성
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (lockoutEndTime) {
            const updateTimer = () => {
                const now = Date.now();
                const timeLeft = Math.ceil((lockoutEndTime - now) / 1000);

                if (timeLeft <= 0) {
                    setLockoutEndTime(null);
                    setRemainingTime(0);
                    setFailedAttempts(0);
                    localStorage.removeItem("group_lockout_end");
                    localStorage.removeItem("group_failed_attempts");
                } else {
                    setRemainingTime(timeLeft);
                }
            };

            updateTimer();
            timer = setInterval(updateTimer, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [lockoutEndTime]);

    // 방 만들기 로직
    const handleCreateRoom = async () => {
        if (!roomName.trim() || !password.trim() || !creatorName.trim()) {
            toast.error("단체방 이름, 암호, 선생님(개설자) 이름을 모두 입력해주세요!");
            return;
        }

        setLoading(true);
        try {
            const { data: existingRoom } = await supabase
                .from("rooms")
                .select("id")
                .eq("room_name", roomName.trim())
                .single();

            if (existingRoom) {
                toast.error("이미 존재하는 단체방 이름입니다! 다른 이름(예: OOO학원 O반)을 사용해주세요.");
                return;
            }

            const { error } = await supabase.from("rooms").insert([
                {
                    room_name: roomName.trim(),
                    password: password.trim(),
                    creator_name: creatorName.trim(),
                },
            ]);

            if (error) {
                console.error(error);
                toast.error("단체방 생성에 실패했습니다.");
                return;
            }

            toast.success("클래스(단체방) 생성이 완료되었습니다! 로그인해주세요.");
            setIsCreating(false);
        } catch (err) {
            console.error(err);
            toast.error("오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleEntry = async () => {
        // 이미 차단된 경우 무시
        if (lockoutEndTime) return;

        if (!roomName.trim() || !password.trim()) {
            toast.error('단체방 이름과 암호를 모두 입력해주세요! 🔒');
            return;
        }

        if (role === 'student' && !studentName.trim()) {
            toast.error('학생의 이름을 정확히 입력해주세요! 👤');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("rooms")
                .select("id, password")
                .eq("room_name", roomName.trim())
                .single();

            const isCorrect = data && data.password === password.trim();

            if (!isCorrect) {
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);
                localStorage.setItem("group_failed_attempts", newAttempts.toString());

                if (newAttempts >= 5) {
                    const unlockTime = Date.now() + 3 * 60 * 1000; // 3분
                    setLockoutEndTime(unlockTime);
                    localStorage.setItem("group_lockout_end", unlockTime.toString());
                    toast.error("5회 연속 실패하여 3분간 입력이 차단됩니다.");
                } else {
                    toast.error(`정보가 일치하지 않습니다. (실패 ${newAttempts}/5)`);
                }
                return;
            }

            // 성공 시 차단 정보 초기화
            setFailedAttempts(0);
            localStorage.removeItem("group_failed_attempts");
            localStorage.removeItem("group_lockout_end");

            localStorage.setItem('premium_group_id', password.trim());
            localStorage.setItem('premium_group_name', roomName.trim());

            if (role === 'student') {
                localStorage.setItem('premium_student_name', studentName.trim());
                toast.success(`${studentName} 학생, 단체방에 오신 걸 환영합니다!`);
                router.push('/group/student');
            } else {
                toast.success('선생님, 환영합니다!');
                router.push('/group/teacher');
            }
        } catch (err) {
            console.error(err);
            toast.error('서버 연결에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
            <div className="absolute top-6 left-6">
                <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium hover:-translate-x-1 transition-transform inline-flex items-center gap-2">
                    <span className="text-xl">&larr;</span> 메인으로
                </Link>
            </div>

            <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">

                {/* 상단 탭 전환버튼 (로그인 모드 / 방만들기 모드) */}
                <div className="flex bg-gray-100 p-1 rounded-xl w-full mb-8">
                    <button
                        onClick={() => setIsCreating(false)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isCreating ? "bg-white text-toss-blue shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        입장하기
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isCreating ? "bg-white text-toss-blue shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        새로운 단체방 개설
                    </button>
                </div>

                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 leading-tight">
                        {isCreating ? "신규 단체방 만들기" : "단체방 입장"}
                    </h1>
                    <p className="text-gray-500 font-medium">
                        {isCreating ? "학급이나 학원을 위한 새로운 방을 만드세요." : "우리 단체방 이름과 암호를 입력해주세요."}
                    </p>
                </div>

                {/* 차단 중일 때 나오는 경고 배너 */}
                {!isCreating && lockoutEndTime && remainingTime > 0 && (
                    <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center text-center animate-in fade-in">
                        <p className="text-red-600 font-bold mb-1">
                            보안을 위해 5회 이상 틀려 입력을 차단합니다.
                        </p>
                        <p className="text-red-500 text-sm font-medium">
                            잠시 후 다시 시도해 주세요. (남은 시간: {Math.floor(remainingTime / 60)}분 {remainingTime % 60}초)
                        </p>
                    </div>
                )}

                {/* Role Selection Tabs (로그인 모드일 때만 표시) */}
                {!isCreating && (
                    <div className="flex p-1 bg-gray-100 rounded-2xl mb-8 animate-in fade-in">
                        <button
                            onClick={() => setRole('student')}
                            disabled={!!lockoutEndTime}
                            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${role === 'student'
                                ? 'bg-white text-toss-blue shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                } disabled:opacity-50`}
                        >
                            👨‍🎓 학생
                        </button>
                        <button
                            onClick={() => setRole('teacher')}
                            disabled={!!lockoutEndTime}
                            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${role === 'teacher'
                                ? 'bg-white text-toss-blue shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                } disabled:opacity-50`}
                        >
                            👩‍🏫 선생님
                        </button>
                    </div>
                )}

                <div className="space-y-5">
                    {/* Common Group input - Room Name */}
                    <div className="space-y-2 text-left">
                        <label htmlFor="roomName" className="text-sm font-bold text-gray-700 ml-1">
                            단체방 이름 🏫
                        </label>
                        <input
                            id="roomName"
                            type="text"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            placeholder="예: OOO학원 중1반"
                            disabled={loading || (!isCreating && !!lockoutEndTime)}
                            className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-toss-blue focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-lg font-medium bg-gray-50 hover:bg-white disabled:bg-gray-100 disabled:text-gray-400"
                            onKeyDown={(e) => {
                                if (!isCreating && e.key === 'Enter' && role === 'teacher') handleEntry();
                            }}
                        />
                    </div>

                    {/* Common Group input - Password */}
                    <div className="space-y-2 text-left">
                        <label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">
                            단체방 암호 🔑
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={isCreating ? "시크릿 암호 설정" : "암호를 입력하세요"}
                            disabled={loading || (!isCreating && !!lockoutEndTime)}
                            className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-toss-blue focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-lg font-medium tracking-widest bg-gray-50 hover:bg-white disabled:bg-gray-100 disabled:text-gray-400"
                            onKeyDown={(e) => {
                                if (!isCreating && e.key === 'Enter' && role === 'teacher') handleEntry();
                            }}
                        />
                    </div>

                    {/* 3. 개설자 이름 (방 만들기 모드일 때만 표시) */}
                    {isCreating && (
                        <div className="space-y-2 text-left animate-in fade-in slide-in-from-top-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">
                                담당 선생님 이름 👩‍🏫
                            </label>
                            <input
                                type="text"
                                placeholder="예: 김선생님"
                                className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-toss-blue focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-lg font-medium bg-gray-50 hover:bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                value={creatorName}
                                onChange={(e) => setCreatorName(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    )}

                    {/* Conditional Student Name input (로그인 모드 + 학생 선택 시) */}
                    {!isCreating && role === 'student' && (
                        <div className="space-y-2 text-left animate-in fade-in slide-in-from-top-2 duration-300">
                            <label htmlFor="studentName" className="text-sm font-bold text-gray-700 ml-1">
                                내 이름 (학생) 👤
                            </label>
                            <input
                                id="studentName"
                                type="text"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                placeholder="예: 홍길동"
                                disabled={loading || !!lockoutEndTime}
                                className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-toss-blue focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-lg font-medium bg-gray-50 hover:bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleEntry();
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    {isCreating ? (
                        <button
                            onClick={handleCreateRoom}
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 text-white rounded-2xl text-lg font-extrabold shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {loading ? '생성 중...' : '새로운 단체방 개설 완료 🎉'}
                        </button>
                    ) : (
                        <button
                            onClick={handleEntry}
                            disabled={loading || !!lockoutEndTime}
                            className="w-full py-4 bg-toss-blue text-white rounded-2xl text-lg font-extrabold shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600 active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50 disabled:bg-gray-300 disabled:shadow-none"
                        >
                            {loading ? '입장 중...' : `${role === 'student' ? '숙제하러 가기 🚀' : '채점하러 가기 🖍️'}`}
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}

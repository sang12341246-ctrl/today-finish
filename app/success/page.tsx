"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SuccessPage() {
    const router = useRouter();
    const [groupName, setGroupName] = useState("");
    const [groupPassword, setGroupPassword] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Generate a secure random ID for the group if we don't rely solely on DB auto-increment
    const handleCreateGroup = async () => {
        if (!groupName.trim() || !groupPassword.trim()) {
            setErrorMsg("공부방 이름과 비밀번호를 모두 입력해주세요.");
            return;
        }

        setIsCreating(true);
        setErrorMsg("");

        try {
            // Insert new group into Supabase
            const { data, error } = await supabase
                .from('premium_groups')
                .insert([
                    {
                        name: groupName.trim(),
                        password: groupPassword.trim(),
                        max_members: 200 // Default as requested
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            // Success! Save to local storage
            localStorage.setItem('premium_group_id', data.id);
            localStorage.setItem('premium_group_name', data.name);

            // Redirect to role selection as the Teacher
            router.push('/group/role-select');

        } catch (err) {
            console.error("Group creation error:", err);
            setErrorMsg("그룹 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl flex flex-col max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-6">
                    <div className="text-5xl mb-4">🎉</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        결제가 완료되었습니다!
                    </h1>
                    <p className="text-gray-500 text-sm">
                        이제 선생님만의 전용 프리미엄 공부방을 बना볼까요?<br />
                        최대 200명의 학생이 참여할 수 있습니다.
                    </p>
                </div>

                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">공부방 이름</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="예: 호랑이반 수학 특훈"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-toss-blue focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            disabled={isCreating}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">입장 비밀번호</label>
                        <input
                            type="password"
                            value={groupPassword}
                            onChange={(e) => setGroupPassword(e.target.value)}
                            placeholder="학생들이 입장할 때 쓸 비밀번호"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-toss-blue focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium placeholder:font-normal"
                            disabled={isCreating}
                        />
                        <p className="text-xs text-gray-400 mt-2 ml-1">
                            * 이 비밀번호를 학생들에게 알려주시면, 앱 메인에서 &apos;단체 코드로 입장하기&apos;를 통해 접속할 수 있습니다.
                        </p>
                    </div>

                    {errorMsg && (
                        <p className="text-red-500 text-sm text-center font-bold">
                            {errorMsg}
                        </p>
                    )}
                </div>

                <button
                    onClick={handleCreateGroup}
                    disabled={isCreating || !groupName.trim() || !groupPassword.trim()}
                    className={`
                        w-full py-4 rounded-xl text-lg font-bold shadow-lg transition-all flex justify-center items-center
                        ${isCreating || !groupName.trim() || !groupPassword.trim()
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-toss-blue hover:bg-blue-600 text-white shadow-blue-500/30 active:scale-95'
                        }
                    `}
                >
                    {isCreating ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        "공부방 생성 및 시작하기 🚀"
                    )}
                </button>
            </div>
        </div>
    );
}

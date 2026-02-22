"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [familyKey, setFamilyKey] = useState("");
  const router = useRouter();

  // 기존 암호 기억하기 로직 추가
  useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('family_code');
      if (saved) setFamilyKey(saved);
    }
  });

  const handleStudentEntry = () => {
    if (!familyKey) return alert("가족 암호를 입력해주세요!");
    localStorage.setItem("family_code", familyKey);
    router.push("/student");
  };

  const handleParentEntry = () => {
    if (!familyKey) return alert("가족 암호를 입력해주세요!");
    localStorage.setItem("family_code", familyKey);
    router.push("/parent");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white p-10 rounded-3xl shadow-xl flex flex-col items-center max-w-md w-full">
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          엄마와의 전쟁 끝,
        </h1>
        <h2 className="text-3xl font-black text-blue-500 mb-6">
          공부 인증 시작
        </h2>
        <p className="text-gray-500 mb-8">오늘 공부를 끝내고 쿨하게 인증하세요.</p>

        <div className="w-full mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            우리 가족 암호 🔑
          </label>
          <input
            type="text"
            placeholder="예: 우리집, 김철수"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={familyKey}
            onChange={(e) => setFamilyKey(e.target.value)}
          />
        </div>

        <button
          onClick={handleStudentEntry}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl mb-3 transition-colors text-lg shadow-sm"
        >
          학생 입장 🎓
        </button>

        <button
          onClick={handleParentEntry}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 rounded-2xl mb-6 transition-colors text-lg shadow-sm"
        >
          부모님 입장 👨‍👩‍👧‍👦
        </button>

        {/* 새로 추가된 프리미엄 단체방 입장 버튼 */}
        <div className="w-full border-t border-gray-200 pt-6">
          <Link
            href="/group"
            className="flex w-full items-center justify-center rounded-2xl bg-yellow-400 py-4 text-lg font-bold text-gray-900 shadow-sm transition-all hover:bg-yellow-500"
          >
            👑 프리미엄 단체방 입장
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const [familyCode, setFamilyCode] = useState('');
  const [savedCode, setSavedCode] = useState('');


  useEffect(() => {
    const saved = localStorage.getItem('family_code');
    if (saved) {
      setSavedCode(saved);
      setFamilyCode(saved);
    }
  }, []);

  const handleEnter = (path: string) => {
    if (!familyCode.trim()) {
      alert('가족 암호를 입력해주세요!');
      return;
    }
    localStorage.setItem('family_code', familyCode.trim());
    router.push(path);
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="text-center max-w-md w-full space-y-12 animate-in fade-in zoom-in duration-500">

        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">
            엄마와의 전쟁 끝,<br />
            <span className="text-toss-blue">공부 인증 시작</span>
          </h1>
          <p className="text-gray-500 text-lg">
            오늘 공부를 끝내고 쿨하게 인증하세요.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <div className="space-y-2 text-left">
            <label htmlFor="familyCode" className="text-sm font-bold text-gray-700 ml-1">
              우리 가족 암호 🔑
            </label>
            <input
              id="familyCode"
              type="text"
              value={familyCode}
              onChange={(e) => setFamilyCode(e.target.value)}
              placeholder="예: 우리집, 김철수"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-toss-blue focus:ring-2 focus:ring-blue-100 outline-none transition-all text-lg font-medium placeholder:text-gray-300"
            />
            {savedCode && (
              <p className="text-xs text-blue-500 ml-1">
                기존 암호가 자동 입력되었어요.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full px-4">
          <Button
            onClick={() => handleEnter('/student')}
            variant="primary"
            fullWidth
            className="text-xl py-6 rounded-3xl shadow-lg shadow-blue-500/20"
          >
            학생 입장 🎓
          </Button>

          <Button
            onClick={() => handleEnter('/parent')}
            variant="secondary"
            fullWidth
            className="text-lg py-5 rounded-3xl"
          >
            부모님 입장 👨‍👩‍👧‍👦
          </Button>
        </div>

        {/* Premium Group Section */}
        <div className="mt-8 px-4 flex flex-col items-center gap-3">
          <Link href="/group" className="w-full">
            <Button
              variant="outline"
              fullWidth
              className="text-lg py-5 rounded-3xl border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50 bg-white shadow-sm flex items-center justify-center gap-2 font-bold"
            >
              👑 프리미엄 단체방 입장
            </Button>
          </Link>
          <Link
            href="/premium"
            className="text-xs font-semibold text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
          >
            프리미엄 결제하기? 💳
          </Link>
        </div>

      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Home() {
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);

  const router = useRouter();

  // 클라이언트 사이드 마운트 시 localStorage 값 로드 (동기적 setState 렌더링 오류 방지)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRoom = localStorage.getItem("room_name");
      const savedPass = localStorage.getItem("family_code");
      if (savedRoom) setRoomName(savedRoom);
      if (savedPass) setPassword(savedPass);

      const savedLockout = localStorage.getItem("lockout_end_time");
      const savedAttempts = localStorage.getItem("failed_attempts");

      if (savedLockout) {
        const parsedLockout = parseInt(savedLockout, 10);
        if (parsedLockout > Date.now()) {
          setLockoutEndTime(parsedLockout);
        } else {
          localStorage.removeItem("lockout_end_time");
          localStorage.removeItem("failed_attempts");
        }
      }

      if (savedAttempts) {
        setFailedAttempts(parseInt(savedAttempts, 10));
      }
    }
  }, []);

  // 타이머 로직: 의존성 배열과 클린업 함수 완벽 적용 (Vercel ESLint 무결점 통과 보장)
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
          localStorage.removeItem("lockout_end_time");
          localStorage.removeItem("failed_attempts");
        } else {
          setRemainingTime(timeLeft);
        }
      };

      // 마운트/상태 변경 직후 즉시 한 번 실행
      updateTimer();

      // 1초마다 반복 실행
      timer = setInterval(updateTimer, 1000);
    }

    // 클린업 함수: 언마운트되거나 lockoutEndTime이 변경될 때 이전 타이머 제거
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lockoutEndTime]);

  const handleEntry = (type: "student" | "parent") => {
    // 이미 차단 상태면 동작 안 함
    if (lockoutEndTime) return;

    if (!roomName || !password) {
      toast.error("방 이름과 암호를 모두 입력해주세요!");
      return;
    }

    // 추후 서버 DB와 연동할 부분 (현재는 설정된 더미 값으로 하드코딩 검증)
    const isCorrect = roomName === "우리집" && password === "1234";

    if (!isCorrect) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem("failed_attempts", newAttempts.toString());

      if (newAttempts >= 5) {
        const unlockTime = Date.now() + 3 * 60 * 1000; // 3분 차단
        setLockoutEndTime(unlockTime);
        localStorage.setItem("lockout_end_time", unlockTime.toString());
        toast.error("5회 연속 실패하여 3분간 입력이 차단됩니다.");
      } else {
        toast.error(`정보가 일치하지 않습니다. (실패 ${newAttempts}/5)`);
      }
      return;
    }

    // 성공 시 초기화 및 로컬스토리지 저장
    setFailedAttempts(0);
    localStorage.removeItem("failed_attempts");
    localStorage.removeItem("lockout_end_time");

    localStorage.setItem("room_name", roomName);
    localStorage.setItem("family_code", password);

    if (type === "student") {
      router.push("/student");
    } else {
      router.push("/parent");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white p-10 rounded-3xl shadow-xl flex flex-col items-center max-w-md w-full">
        <h1 className="text-3xl font-black text-gray-900 mb-2">엄마와의 전쟁 끝,</h1>
        <h2 className="text-3xl font-black text-blue-500 mb-6">공부 인증 시작</h2>
        <p className="text-gray-500 mb-8">오늘 공부를 끝내고 쿨하게 인증하세요.</p>

        {lockoutEndTime && remainingTime > 0 && (
          <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center text-center">
            <p className="text-red-600 font-bold mb-1">
              보안을 위해 5회 이상 틀려 입력을 차단합니다.
            </p>
            <p className="text-red-500 text-sm font-medium">
              잠시 후 다시 시도해 주세요. (남은 시간: {Math.floor(remainingTime / 60)}분 {remainingTime % 60}초)
            </p>
          </div>
        )}

        <div className="w-full mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            방 이름 (가족/선생님 방) 🏠
          </label>
          <input
            type="text"
            placeholder="예: 우리집 반"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            disabled={!!lockoutEndTime}
          />
        </div>

        <div className="w-full mb-8">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            암호 🔑
          </label>
          <input
            type="password"
            placeholder="암호를 입력하세요"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!!lockoutEndTime}
          />
        </div>

        <button
          onClick={() => handleEntry("student")}
          disabled={!!lockoutEndTime}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl mb-3 transition-colors text-lg shadow-sm"
        >
          학생 입장 🎓
        </button>

        <button
          onClick={() => handleEntry("parent")}
          disabled={!!lockoutEndTime}
          className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-800 font-bold py-4 rounded-2xl mb-6 transition-colors text-lg shadow-sm"
        >
          부모님 입장 👨‍👩‍👧‍👦
        </button>

        {/* 단체방 입장 버튼 (무료/프리미엄 텍스트 제거) */}
        <div className="w-full border-t border-gray-200 pt-6 flex flex-col items-center">
          <Link
            href="/group"
            className="flex w-full items-center justify-center rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white shadow-sm transition-all hover:bg-blue-700"
          >
            단체방 (선생님/학생) 입장
          </Link>
        </div>
      </div>
    </div>
  );
}

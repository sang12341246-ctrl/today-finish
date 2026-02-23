"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [isCreating, setIsCreating] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [loading, setLoading] = useState(false);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);

  const router = useRouter();

  // 클라이언트 사이드 마운트 시 localStorage 값 로드
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

  // 타이머 로직: 의존성 배열과 클린업 함수
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

      updateTimer();
      timer = setInterval(updateTimer, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lockoutEndTime]);

  // 새로운 방 만들기 로직
  const handleCreateRoom = async () => {
    if (!roomName.trim() || !password.trim() || !creatorName.trim()) {
      toast.error("방 이름, 암호, 개설자 이름을 모두 입력해주세요!");
      return;
    }

    setLoading(true);
    try {
      // 1. 중복 확인
      const { data: existingRoom } = await supabase
        .from("rooms")
        .select("id")
        .eq("room_name", roomName.trim())
        .single();

      if (existingRoom) {
        toast.error("이미 존재하는 방 이름입니다! 다른 이름을 사용해주세요.");
        return;
      }

      // 2. 방 생성 (INSERT)
      const { error } = await supabase.from("rooms").insert([
        {
          room_name: roomName.trim(),
          password: password.trim(),
          creator_name: creatorName.trim(),
        },
      ]);

      if (error) {
        console.error("Insert error:", error);
        toast.error("방 생성에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      toast.success("방 생성이 완료되었습니다! 이제 로그인해주세요.");
      setIsCreating(false);
    } catch (err) {
      console.error("Unknown error:", err);
      toast.error("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 입장 (로그인) 로직
  const handleEntry = async (type: "student" | "parent") => {
    if (lockoutEndTime) return;

    if (!roomName.trim() || !password.trim()) {
      toast.error("방 이름과 암호를 모두 입력해주세요!");
      return;
    }

    setLoading(true);
    try {
      // DB에서 방 이름으로 조회
      const { data, error } = await supabase
        .from("rooms")
        .select("id, password")
        .eq("room_name", roomName.trim())
        .single();

      // 조회 결과가 없거나, 비밀번호가 일치하지 않으면 실패 처리
      const isCorrect = data && data.password === password.trim();

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

      localStorage.setItem("room_name", roomName.trim());
      localStorage.setItem("family_code", password.trim());

      if (type === "student") {
        router.push("/student");
      } else {
        router.push("/parent");
      }
    } catch (err) {
      console.error(err);
      toast.error("서버와 통신 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white p-10 rounded-3xl shadow-xl flex flex-col items-center max-w-md w-full relative overflow-hidden">

        {/* 상단 탭 전환버튼 (로그인 모드 / 방만들기 모드) */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-full mb-8">
          <button
            onClick={() => setIsCreating(false)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isCreating ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            접속하기
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isCreating ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            새로운 방 만들기
          </button>
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-2">엄마와의 전쟁 끝,</h1>
        <h2 className="text-3xl font-black text-blue-500 mb-6">
          {isCreating ? "나만의 방 생성" : "공부 인증 시작"}
        </h2>
        <p className="text-gray-500 mb-8 text-center text-sm font-medium">
          {isCreating
            ? "우리 가족만의 고유한 방 이름과 비밀번호를 설정하세요."
            : "오늘 공부를 끝내고 쿨하게 인증하세요."}
        </p>

        {/* Rate Limiting 경고창 (로그인 모드에서만 표시) */}
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

        <div className="w-full space-y-4 mb-8">
          {/* 1. 방 이름 입력 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 ml-1 mb-2">
              방 이름 (고유 명칭) 🏠
            </label>
            <input
              type="text"
              placeholder="예: 김철수네 집"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 font-medium"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              disabled={loading || (!isCreating && !!lockoutEndTime)}
            />
            {isCreating && (
              <p className="text-xs text-gray-400 mt-1 ml-1">기억하기 쉬운 단일 명칭을 추천합니다.</p>
            )}
          </div>

          {/* 2. 방 암호 입력 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 ml-1 mb-2">
              방 암호 🔑
            </label>
            <input
              type="password"
              placeholder={isCreating ? "시크릿 암호를 설정하세요" : "암호를 입력하세요"}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 font-medium tracking-widest"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || (!isCreating && !!lockoutEndTime)}
            />
          </div>

          {/* 3. 개설자 이름 (방 만들기 모드일 때만 표시) */}
          {isCreating && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-bold text-gray-700 ml-1 mb-2">
                내 이름 (방장) 👑
              </label>
              <input
                type="text"
                placeholder="예: 엄마, 아빠"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 font-medium"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                disabled={loading}
              />
            </div>
          )}
        </div>

        {isCreating ? (
          /* 방 생성 버튼 */
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl mb-2 transition-all text-lg shadow-md shadow-blue-500/20"
          >
            {loading ? "생성 중..." : "새로운 방 만들기 🚀"}
          </button>
        ) : (
          /* 접속(로그인) 버튼들 */
          <div className="w-full animate-in fade-in space-y-3">
            <button
              onClick={() => handleEntry("student")}
              disabled={loading || !!lockoutEndTime}
              className="w-full bg-blue-500 hover:bg-blue-600 active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none text-white font-bold py-4 rounded-2xl transition-all text-lg shadow-sm"
            >
              {loading ? "로딩 중..." : "학생 입장 🎓"}
            </button>
            <button
              onClick={() => handleEntry("parent")}
              disabled={loading || !!lockoutEndTime}
              className="w-full bg-gray-100 hover:bg-gray-200 active:scale-[0.98] disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-800 font-bold py-4 rounded-2xl transition-all text-lg shadow-sm"
            >
              부모님 입장 👨‍👩‍👧‍👦
            </button>
          </div>
        )}

        {/* 단체방으로 이동 (하단 분리) */}
        {!isCreating && (
          <div className="w-full border-t border-gray-100 pt-6 mt-6 flex flex-col items-center">
            <Link
              href="/group"
              className="group flex w-full items-center justify-center rounded-2xl bg-slate-800 py-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-900 active:scale-[0.98]"
            >
              선생님/학생 단체방 입장 안내
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

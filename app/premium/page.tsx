import Link from "next/link";

export default function PremiumPage() {
    // 개발자 본인의 토스 아이디 링크 (예: https://toss.me/엄전끝만든이)
    // 현재는 임시 링크를 넣었으며, 나중에 개발자님의 진짜 링크로 수정하시면 됩니다!
    const tossLink = "https://toss.me/";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
            <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl w-full max-w-md flex flex-col items-center text-center relative overflow-hidden">
                {/* 상단 장식 효과 */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-toss-blue to-blue-400" />

                <div className="text-6xl mb-6">☕</div>

                <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">
                    개발자에게 커피 한 잔 후원하기
                </h2>

                <p className="text-gray-600 font-medium text-sm leading-relaxed mb-8">
                    안녕하세요! &apos;엄전끝&apos;을 홀로 개발하고 운영 중인 <br />
                    <span className="font-bold text-toss-blue">학생 개발자</span>입니다. 🙇‍♂️<br /><br />
                    현재 서버 유지비와 데이터베이스 비용을<br />
                    개인 용돈으로 감당하며 <span className="font-bold">전면 무료</span>로 운영하고 있습니다. <br /><br />
                    이 앱이 우리 가족, 혹은 학급에 조금이나마<br />
                    도움이 되었다면, 계속해서 멋진 서비스를<br />
                    만들어 나갈 수 있도록 서버비에 보태주시면 정말 감사하겠습니다!
                </p>

                {/* 토스 익명 송금 버튼 */}
                <a
                    href={tossLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-[#0064FF] hover:bg-blue-700 text-white font-extrabold rounded-2xl transition-all text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mb-4 group active:scale-[0.98]"
                >
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Toss로 간편 후원하기 💙
                </a>

                {/* 뒤로 가기 */}
                <Link
                    href="/"
                    className="block text-center text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors mt-2"
                >
                    마음만 받고 홈으로 돌아가기
                </Link>
            </div>
        </div>
    );
}
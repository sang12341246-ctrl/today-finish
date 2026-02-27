import Link from "next/link";
import { PageTransition } from "@/components/PageTransition";

export default function PrivacyPage() {
    return (
        <PageTransition>
            <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-6">
                <div className="w-full max-w-3xl bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-gray-100">
                    <div className="mb-8 border-b pb-6">
                        <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium inline-flex items-center gap-2 mb-6">
                            <span>&larr;</span> 메인으로 돌아가기
                        </Link>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">개인정보처리방침</h1>
                        <p className="text-gray-500 mt-2">우리는 여러분의 데이터를 소중하게 지키며, 꼭 필요한 만큼만 아주 잠시 보관합니다.</p>
                    </div>

                    <div className="space-y-8 text-gray-700 leading-relaxed font-medium">
                        <section>
                            <h2 className="text-xl font-bold text-blue-600 mb-3 flex items-center gap-2">
                                💣 가장 중요한 점: &quot;자동 폭파 시스템&quot;
                            </h2>
                            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                                <p className="mb-2">본 서비스는 값비싼 클라우드 서비 용량을 아끼고, 사용자의 프라이버시를 강력하게 보호하기 위해 <strong>숙제 인증 사진 자동 파기 정책</strong>을 시행 중입니다.</p>
                                <ul className="list-disc pl-5 space-y-1 font-bold text-gray-900">
                                    <li>선생님이 답장(칭찬)을 남기는 즉시 사진은 영구 삭제됩니다.</li>
                                    <li>선생님이 확인하지 않더라도 <strong>업로드 후 24시간이 지나면 무조건 스토리지에서 파기</strong>됩니다.</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">1. 수집하는 정보</h2>
                            <p className="mb-2">우리는 회원가입, 실명인증, 전화번호 번호 인증 등 복잡한 절차를 거치지 않습니다. 서비스 이용(공부방 입장 및 숙제 제출) 과정에서 아래 정보만 일시적으로 수집합니다.</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>필수:</strong> 서비스 내에서 스스로 입력한 이름(또는 별명), 접속한 방 이름</li>
                                <li><strong>선택:</strong> 학습 내용(글), 숙제 인증 사진</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">2. 개인정보의 수집 및 이용 목적</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>선생님 혹은 그룹원(부모님 등)에게 나의 학습 진행 상황을 알리기 위한 용도</li>
                                <li>나의 출석/학습 달력 일수 카운트 및 연속 학습(Streak) 처리를 위한 용도</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">3. 개인정보의 보유 및 이용 기간</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>사진 데이터:</strong> 위에 명시된 &apos;자동 폭파 시스템&apos;에 따라 <strong>최대 24시간</strong> 내에 물리적으로 삭제됩니다.</li>
                                <li><strong>학습 기록(텍스트):</strong> 달력 조회 및 나의 연속 기록 표시를 위해 데이터베이스에 보존됩니다. 단, 단체방이 삭제되거나 서비스가 종료될 경우 복구 불가능한 방법으로 전부 파기됩니다.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">4. 제3자 제공 및 마케팅 활용 여부</h2>
                            <p>
                                본 서비스는 여러분이 올려주신 그 어떤 정보도 다른 기업이나 기관에 팔아넘기거나 마케팅 명목으로 활용하지 않습니다.
                                애초에 상업적으로 쓸 수 있는 실명이나 전화번호 등의 민감한 정보 자체를 수집하지 않습니다.
                            </p>
                        </section>
                    </div>

                    <div className="mt-12 pt-8 border-t text-center">
                        <Link href="/">
                            <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded-xl transition-colors">
                                다 읽었어요
                            </button>
                        </Link>
                    </div>
                </div>
            </main>
        </PageTransition>
    );
}

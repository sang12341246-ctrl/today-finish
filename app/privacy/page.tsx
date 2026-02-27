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
                            <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
                                <h2 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2">
                                    🚨 핵심 요약: 데이터는 무조건 24시간 내 완전 파기됩니다.
                                </h2>
                                <p className="text-sm text-gray-800 mb-2">본 서비스는 이용자의 프라이버시 보호 및 서버 비용 절감을 최우선으로 하여 <strong>[초강력 자동 파기 시스템]</strong>을 적용하고 있습니다.</p>
                                <ul className="list-disc pl-5 space-y-1 font-bold text-gray-900">
                                    <li>이용자가 업로드한 모든 사진은 <strong>24시간이 경과하면 시스템에서 자동 및 영구적으로 폭파(삭제)</strong>됩니다.</li>
                                    <li>선생님이 도장(확인)을 찍는 즉시, 24시간이 지나지 않았어도 사진은 즉각 영구 삭제됩니다.</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">1. 수집하는 개인정보 항목 및 방법</h2>
                            <p className="mb-2">본 서비스는 회원가입이나 실명 인증 절차가 없으며, 주민등록번호, 휴대전화번호, 이메일 주소 등 민감한 개인 식별 정보(PII)를 절대로 요구하거나 수집하지 않습니다. 오직 서비스 운영에 필수적인 빈약한 정보만 임시 수집합니다.</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>필수 수집 항목:</strong> 사용자가 임의로 기재한 이름 또는 닉네임, 생성한 방 이름 (모두 익명성 보장)</li>
                                <li><strong>선택 수집 항목:</strong> 학습 내용(텍스트), 숙제 인증용 사진</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">2. 개인정보의 수집 및 이용 목적</h2>
                            <p className="mb-2">수집된 데이터는 오직 다음의 목적을 위해서만 사용됩니다:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>단체방 내에서 교사 혹은 학부모가 학생의 과제 제출 여부를 확인하기 위한 일시적 용도</li>
                                <li>사용자의 자가 학습 연속 기록(Streak) 및 달력 표시 기능 제공</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">3. 개인정보의 보유 및 철저한 파기 절차</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>사진 데이터:</strong> 수집일로부터 <strong>최대 24시간 내에 클라우드 스토리지에서 물리적으로 영구 파기</strong>되어 어떠한 방식으로도 복원할 수 없습니다.</li>
                                <li><strong>텍스트 및 닉네임 데이터:</strong> 서비스가 존속되는 동안 보관되나, 사용자가 방을 삭제하거나 운영자가 서비스 제공을 중단하는 즉시 데이터베이스에서 완전히 삭제됩니다.</li>
                                <li><strong>법적 의무 보관의 예외:</strong> 본 서비스는 상업적 서비스가 아니므로 전자상거래법 등에 따른 정보 보관 의무를 지지 않습니다.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">4. 개인정보의 제3자 제공 및 위탁 금지</h2>
                            <p>
                                운영자는 이용자의 소중한 데이터를 타 기관, 기업, 단체 등 제3자에게 <strong>절대로 제공, 판매, 공유하지 않습니다.</strong>
                                광고 및 마케팅 목적으로 활용되는 일 또한 없습니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">5. 사용자 및 법정대리인의 권리와 그 행사 방법</h2>
                            <p>
                                사용자는 방에 접속하여 언제든지 자신이 올린 오늘의 숙제 내역을 리셋(즉시 파기)할 수 있습니다. 본 서비스는 개인 식별 데이터를 수집하지 않으므로 본인 확인을 거친 별도의 정보 열람 및 정정 창구는 운영하지 않습니다. 미성년자의 사용에 대해서는 법정대리인의 동의와 책임이 따릅니다.
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

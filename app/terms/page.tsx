import Link from "next/link";
import { PageTransition } from "@/components/PageTransition";

export default function TermsPage() {
    return (
        <PageTransition>
            <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-6">
                <div className="w-full max-w-3xl bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-gray-100">
                    <div className="mb-8 border-b pb-6">
                        <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium inline-flex items-center gap-2 mb-6">
                            <span>&larr;</span> 메인으로 돌아가기
                        </Link>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">서비스 이용약관</h1>
                        <p className="text-gray-500 mt-2">마지막 수정일: 2026년 2월 28일</p>
                    </div>

                    <div className="space-y-8 text-gray-700 leading-relaxed font-medium">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">제1조 (목적 및 서비스의 성격)</h2>
                            <p>
                                본 약관은 &apos;엄전끝&apos;(이하 &quot;서비스&quot;)의 이용과 관련하여 서비스 제공자(이하 &quot;운영자&quot;)와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                                본 서비스는 학생 1인이 개인적으로 개발하여 <strong>무료로 제공</strong>하는 서비스로, 영리 목적의 기업 서비스가 아님을 인지하고 이용해야 합니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">제2조 (면책조항 및 손해배상 청구 불가)</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>법적 책임의 완전한 면제:</strong> 운영자는 본 서비스를 &quot;있는 그대로(As-Is)&quot; 제공하며, 서비스의 안정성, 신뢰성, 주기성, 데이터의 무결성을 일절 보증하지 않습니다. 서비스 이용 중 발생하는 어떠한 직·간접적인 손해(데이터 유실, 정신적 피해보상 등)에 대해서도 운영자는 일체의 민·형사상 법적/금전적 책임을 지지 않습니다.</li>
                                <li><strong>오류 및 데이터 손실:</strong> 예기치 못한 시스템 오류, 해킹, 트래픽 한계 초과, 서버 장애 등으로 인해 학습 데이터나 사진 등이 영구적으로 유실될 수 있습니다. 귀중한 자료는 이용자가 반드시 별도로 보관(백업)해야 하며, 운영자는 그 복구 의무나 손실에 대한 책임이 전무합니다.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">제3조 (서비스 변경, 중단 및 종료)</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>운영자는 개인적인 사정, 서버 혹은 DB 유지보수비용 고갈, 기타 운영상의 판단에 따라 <strong>사전 통지나 동의 없이 언제든지 서비스의 전부 또는 일부를 변경, 일시 중단, 또는 영구적으로 완전 종료</strong>할 수 있습니다.</li>
                                <li>서비스가 기습적으로 종료될 경우 시스템 내의 모든 데이터는 복원 불가능한 방식으로 일괄 완전 삭제되며, 이용자는 이에 대한 어떠한 사전 조치나 보상, 데이터 반환 등을 요구할 수 없습니다.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">제4조 (이용자의 의무 및 책임)</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>콘텐츠 법적 책임:</strong> 이용자가 본 서비스 내에 업로드하는 모든 텍스트, 이미지 등에 대한 민·형사상 법적 책임은 전적으로 해당 자료를 직접 등록한 이용자 본인에게 있습니다. 타인의 명예훼손, 초상권 및 저작권 침해, 불법 음란물 등 관계 법령에 위배되는 콘텐츠 업로드 시 관련 법적 분쟁에 대해 운영자는 어떠한 관여도 하지 않으며, 책임에서 완전히 면제됩니다.</li>
                                <li><strong>만 14세 미만 사용자:</strong> 본 서비스 자체는 연령 제한이 없으나, 미성년 사용자는 법정대리인(부모님 등)의 인지 및 동의 하에 학습 보조 도구로 사용됨을 전제로 하며 가입 절차가 없으므로 부당한 사용에 대한 감독 책임은 보호자에게 있습니다.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">제5조 (관할법원)</h2>
                            <p>
                                본 약관에 명시되지 않은 사항은 대한민국 관련 법령에 따르며, 서비스 이용과 관련하여 분쟁이 발생될 경우 운영자 측의 주소지를 관할하는 법원을 전속 관할법원으로 합니다. 단, 이용자는 본 약관 제2조에 의거하여 운영자에 대한 모든 금전적 손해배상 한도를 &apos;0원&apos;으로 제한함에 동의한 상태에서만 본 서비스를 이용한 것으로 간주합니다.
                            </p>
                        </section>
                    </div>

                    <div className="mt-12 pt-8 border-t text-center">
                        <Link href="/">
                            <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded-xl transition-colors">
                                확인했습니다
                            </button>
                        </Link>
                    </div>
                </div>
            </main>
        </PageTransition>
    );
}

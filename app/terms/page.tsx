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
                            <h2 className="text-xl font-bold text-gray-900 mb-3">1. 환영합니다!</h2>
                            <p>
                                &apos;엄전끝(엄마 나 전부 끝냈어)&apos; 서비스를 이용해 주셔서 감사합니다.
                                본 서비스는 학생 1인이 개인 시간과 비용(서버비 등)을 들여 개발하고 운영하는 <strong>전면 무료 서비스</strong>입니다.
                                이용자 여러분은 본 약관에 동의함으로써 서비스를 이용하실 수 있습니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">2. 서비스의 제공 및 한계 (매우 중요)</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>본 서비스는 상업적 목적이 아닌 개인 포트폴리오 및 공익 목적으로 운영됩니다.</li>
                                <li><strong>보증의 부인:</strong> 서비스는 &quot;있는 그대로(As-is)&quot; 제공되며, 개발자는 서비스의 무결성, 무중단, 특정 목적에의 적합성을 100% 보증하지 않습니다.</li>
                                <li><strong>데이터 보존의 한계:</strong> 트래픽 폭주, 서버 오류 혹은 유지보수 과정에서 예기치 못하게 학습 기록이나 데이터가 손실될 수 있습니다. 중요한 데이터는 회원님이 별도로 백업하셔야 합니다.</li>
                                <li><strong>책임 제한:</strong> 본 서비스의 이용, 데이터 손실, 서비스 중단 등으로 인해 발생하는 직·간접적인 손해에 대하여 개발자는 어떠한 법적/금전적 책임도 지지 않습니다.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">3. 이용자의 준수 사항</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>타인의 이름이나 정보를 도용하여 단체방에 입장하거나 글을 작성해선 안 됩니다.</li>
                                <li>불법적인 내용, 욕설, 타인에게 불쾌감을 주는 사진이나 글을 업로드할 경우 사전 통보 없이 해당 글/사진이 삭제되거나 서비스 이용이 제한될 수 있습니다.</li>
                                <li>서비스의 시스템을 해킹하거나 서버에 무리를 주는 비정상적인 접근을 금지합니다.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">4. 서비스의 변경 및 종료</h2>
                            <p>
                                개발자의 개인 사정, 서버 유지비 고갈, 혹은 기타 기술적/운영상의 이유로 언제든지 서비스의 일부 또는 전부를 수정, 중단, 영구 종료할 수 있습니다.
                                서비스 종료 시 시스템에 저장된 모든 데이터는 안전하게 일괄 파기됩니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">5. 기타</h2>
                            <p>
                                본 약관에 명시되지 않은 사항에 대해서는 관련 법령 및 상관례에 따릅니다.
                                본 서비스는 미성년자 학생 개발자에 의해 운영되므로, 모든 법적 분쟁이나 책임에서 자유로움을 다시 한번 명시합니다.
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

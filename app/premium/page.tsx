"use client"; // Next.js에서 브라우저 화면(결제창)을 그리려면 꼭 맨 위에 써야 해!

import { useEffect, useRef, useState } from "react";
import { loadPaymentWidget, PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PremiumPage() {
    // 문서에 있던 테스트 키 그대로 넣었어!
    const clientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";
    const customerKey = "ANONYMOUS"; // 로그인 안 한 익명 유저용

    const router = useRouter();
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupPassword, setGroupPassword] = useState("");
    const [loadingGroup, setLoadingGroup] = useState(false);

    // 결제 위젯을 기억해둘 빈 공간
    const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);

    useEffect(() => {
        const fetchPaymentWidget = async () => {
            // 1. 토스 결제위젯 불러오기
            const paymentWidget = await loadPaymentWidget(clientKey, customerKey);

            // 2. 결제창 화면에 그리기 (1000원)
            paymentWidget.renderPaymentMethods(
                "#payment-method",
                { value: 1000 },
                { variantKey: "DEFAULT" }
            );

            // 3. 이용약관 화면에 그리기
            paymentWidget.renderAgreement("#agreement", { variantKey: "AGREEMENT" });

            paymentWidgetRef.current = paymentWidget;
        };

        fetchPaymentWidget();
    }, []);

    const handlePayment = async () => {
        const paymentWidget = paymentWidgetRef.current;
        if (!paymentWidget) return;

        try {
            // 결제 버튼을 누르면 실행되는 로직
            await paymentWidget.requestPayment({
                orderId: "PREMIUM_" + Date.now(),      // 겹치지 않는 주문번호
                orderName: "프리미엄 숙제 보기 권한",        // 상품명
                successUrl: window.location.origin + "/success", // 결제 성공 시 갈 페이지
                failUrl: window.location.origin + "/fail",       // 결제 실패 시 갈 페이지
            });
        } catch (error) {
            console.error("결제 중 에러 발생:", error);
        }
    };

    const handleGroupEnter = async () => {
        if (!groupPassword.trim()) return;
        setLoadingGroup(true);

        try {
            const { data, error } = await supabase
                .from('premium_groups')
                .select('id, name')
                .eq('password', groupPassword.trim())
                .single();

            if (error || !data) {
                alert('비밀번호가 일치하지 않거나 단체를 찾을 수 없습니다.');
                setLoadingGroup(false);
                return;
            }

            // Save group info and proceed to role selection
            localStorage.setItem('premium_group_id', data.id);
            localStorage.setItem('premium_group_name', data.name);
            router.push('/group/role-select');

        } catch (error) {
            console.error('Group entry error:', error);
            alert('입장 중 오류가 발생했습니다.');
            setLoadingGroup(false);
        }
    };

    return (
        <>
            <div className="flex flex-col items-center justify-center min-h-screen p-10 bg-gray-50">
                <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                    <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                        숙제 전체 보기 프리미엄 (1,000원)
                    </h2>

                    {/* 결제수단과 약관이 들어갈 자리 */}
                    <div id="payment-method" className="w-full mb-4" />
                    <div id="agreement" className="w-full mb-6" />

                    {/* 결제 버튼 (Tailwind CSS 적용) */}
                    <button
                        onClick={handlePayment}
                        className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors text-lg mb-4"
                    >
                        1,000원 결제하기
                    </button>

                    {/* 단체(Group) 입장 버튼 추가 */}
                    <div className="relative flex items-center py-4">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">또는</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <button
                        onClick={() => setShowGroupModal(true)}
                        className="w-full py-4 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl transition-colors text-lg flex items-center justify-center gap-2"
                    >
                        단체 코드로 입장하기 👥
                    </button>
                </div>
            </div>

            {/* 단체 입장 모달창 */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">단체 입장</h3>
                        <p className="text-sm text-gray-500 mb-6 text-center">선생님이 알려주신 단체 비밀번호를 입력해주세요.</p>

                        <input
                            type="password"
                            value={groupPassword}
                            onChange={(e) => setGroupPassword(e.target.value)}
                            placeholder="비밀번호 입력"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all mb-4 text-center font-medium placeholder:font-normal"
                            disabled={loadingGroup}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleGroupEnter();
                            }}
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowGroupModal(false)}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                                disabled={loadingGroup}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleGroupEnter}
                                className="flex-1 py-3 bg-toss-blue hover:bg-blue-600 text-white font-bold rounded-xl transition-colors flex justify-center items-center"
                                disabled={loadingGroup || !groupPassword.trim()}
                            >
                                {loadingGroup ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    "입장하기"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
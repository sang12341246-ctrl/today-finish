"use client"; // Next.js에서 브라우저 화면(결제창)을 그리려면 꼭 맨 위에 써야 해!

import { useEffect, useRef, useState } from "react";
import { loadPaymentWidget, PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PremiumPage() {
    // 문서에 있던 테스트 키 그대로 넣었어!
    const clientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";
    const customerKey = "ANONYMOUS"; // 로그인 안 한 익명 유저용

    const router = useRouter();

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

                    <Link
                        href="/"
                        className="block text-center text-sm text-gray-500 hover:text-gray-800 transition-colors mt-2"
                    >
                        홈으로 돌아가기
                    </Link>
                </div>
            </div>
        </>
    );
}
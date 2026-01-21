import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PaymentButton = ({ productInfo, userInfo }) => {
    const navigate = useNavigate();

    // 🐍 AI 서버 주소
    const AI_SERVER_URL = 'http://localhost:5002';
    // 🌱 백엔드 서버 주소
    const API_BASE_URL = 'http://localhost:8080/api';

    const handlePaymentClick = async () => {
        if (!window.IMP) return;

        // 1. 로그인 체크
        if (!userInfo.memberId) {
            alert("❌ 오류: 로그인 정보(memberId)가 없습니다.\n로그아웃 후 다시 로그인해 주세요.");
            return;
        }

        try {
            // [디버깅 1] 과거 내역 조회 시작
            console.log(`🔎 과거 내역 조회 중... ID: ${userInfo.memberId}`);

            const historyRes = await axios.get(`${API_BASE_URL}/shop-orders?memberId=${userInfo.memberId}`);
            const pastOrders = historyRes.data.map(order => order.productName);

            // [디버깅 2] 조회된 내역 확인
            // alert(`📊 조회된 과거 주문 개수: ${pastOrders.length}개\n목록: ${pastOrders.join(', ')}`);

            if (pastOrders.length === 0) {
                console.log("과거 주문 내역이 없어 AI 검사를 건너뜁니다.");
            }

            // [Step 2] 파이썬 AI에게 "나 이거 사도 돼?" 물어보기
            const aiRes = await axios.post(`${AI_SERVER_URL}/check-consumption`, {
                current: productInfo.name,
                past_orders: pastOrders
            });

            // [Step 3] AI 결과 확인
            console.log("🤖 AI 판단 결과:", aiRes.data);

            if (aiRes.data.isOverConsumption) {
                // 과소비 경고
                const userConfirmed = window.confirm(
                    `🤖 [AI 지갑 지킴이 경고]\n\n"${aiRes.data.reason}"\n\n그래도 결제하시겠습니까?`
                );

                if (!userConfirmed) {
                    return; // 취소 누르면 결제 중단
                }
            }

            // 문제 없으면 결제창 띄우기
            requestPay();

        } catch (error) {
            // [디버깅 3] 에러 발생 시 원인 출력
            console.error("🚨 에러 발생:", error);
            alert(`⚠️ 시스템 오류로 AI 검사를 실패했습니다.\n\n에러 내용: ${error.message}\n(확인 누르면 결제창이 뜹니다)`);
            requestPay();
        }
    };

    const requestPay = () => {
        const { IMP } = window;
        IMP.init('imp44181766'); // 가맹점 식별코드

        const data = {
            pg: 'kakaopay',
            pay_method: 'card',
            merchant_uid: `mid_${new Date().getTime()}`,
            name: productInfo.name,
            amount: productInfo.price,
            buyer_email: userInfo.email,
            buyer_name: userInfo.name,
            buyer_tel: '010-0000-0000',
        };

        IMP.request_pay(data, callback);
    };

    const callback = async (response) => {
        const { success, error_msg, merchant_uid } = response;

        if (success) {
            try {
                await axios.post(`${API_BASE_URL}/shop-orders`, {
                    memberId: userInfo.memberId,
                    memberName: userInfo.name,
                    productName: productInfo.name,
                    price: productInfo.price,
                    merchantUid: merchant_uid
                });

                alert('결제 성공! 주문 내역이 저장되었습니다.');
                navigate('/members/mypage');
            } catch (err) {
                console.error(err);
                alert('결제는 성공했으나 저장 중 오류가 발생했습니다.');
            }
        } else {
            alert(`결제 실패: ${error_msg}`);
        }
    };

    return (
        <button
            onClick={handlePaymentClick}
            className="btn-buy-now"
            style={{
                backgroundColor: '#00d4ff',
                color: 'black',
                border: 'none',
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '20px',
                width: '100%',
                transition: '0.3s'
            }}
        >
            💳 {Number(productInfo.price).toLocaleString()}원 결제하기 (AI 검사)
        </button>
    );
};

export default PaymentButton;
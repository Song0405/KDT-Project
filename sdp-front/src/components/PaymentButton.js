import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; // 🍬 SweetAlert2 추가

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
            Swal.fire({
                icon: 'error', title: '로그인 필요', text: '로그인 후 결제해주세요.',
                background: '#333', color: '#fff'
            });
            return;
        }

        try {
            console.log(`🔎 과거 내역 조회 중... ID: ${userInfo.memberId}`);

            // 로딩 알림
            Swal.fire({
                title: 'AI 지갑 지킴이 가동 중... 👮‍♂️',
                text: '고객님의 소비 패턴을 분석하고 있습니다.',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
                background: '#333', color: '#fff'
            });

            const historyRes = await axios.get(`${API_BASE_URL}/shop-orders?memberId=${userInfo.memberId}`);
            const pastOrders = historyRes.data.map(order => order.productName);

            // [Step 2] 파이썬 AI에게 "나 이거 사도 돼?" 물어보기
            const aiRes = await axios.post(`${AI_SERVER_URL}/check-consumption`, {
                current: productInfo.name,
                past_orders: pastOrders
            });

            console.log("🤖 AI 판단 결과:", aiRes.data);

            // 로딩 닫기
            Swal.close();

            if (aiRes.data.isOverConsumption) {
                // 🚨 [핵심] 과소비 경고를 SweetAlert로 변경
                const result = await Swal.fire({
                    title: '🚨 AI 과소비 경고!',
                    html: `<p style="color:#aaa">${aiRes.data.reason}</p><br/><b>그래도 결제하시겠습니까?</b>`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ff4d4d', // 경고니까 빨간색
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: '네, 그냥 살래요',
                    cancelButtonText: '아니요, 참을게요',
                    background: '#222',
                    color: '#fff'
                });

                if (!result.isConfirmed) {
                    Swal.fire({
                        icon: 'info', title: '절약 성공! 👏', text: '현명한 선택을 하셨네요!',
                        background: '#333', color: '#fff'
                    });
                    return; // 결제 중단
                }
            }

            // 문제 없으면 결제창 띄우기
            requestPay();

        } catch (error) {
            console.error("🚨 에러 발생:", error);
            Swal.fire({
                icon: 'error', title: 'AI 서버 오류',
                text: 'AI 분석 없이 결제를 진행합니다.',
                background: '#333', color: '#fff'
            });
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

                Swal.fire({
                    icon: 'success', title: '결제 성공!', text: '주문 내역이 저장되었습니다.',
                    background: '#333', color: '#fff', confirmButtonColor: '#00d4ff'
                }).then(() => {
                    navigate('/members/mypage');
                });
            } catch (err) {
                console.error(err);
                Swal.fire('오류', '결제는 성공했으나 저장 실패', 'error');
            }
        } else {
            Swal.fire({
                icon: 'error', title: '결제 실패', text: error_msg,
                background: '#333', color: '#fff'
            });
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
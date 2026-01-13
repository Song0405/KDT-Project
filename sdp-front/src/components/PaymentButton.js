import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PaymentButton = ({ productInfo, userInfo }) => {
    const navigate = useNavigate();

    const requestPay = () => {
        // 1. 포트원 라이브러리 로드 확인
        if (!window.IMP) return;
        const { IMP } = window;

        // ⭐ [중요] 본인의 가맹점 식별코드로 교체하세요!
        IMP.init('imp44181766');

        // 2. 결제 요청 데이터 설정
        const data = {
            pg: 'kakaopay',             // 카카오페이 설정
            pay_method: 'card',         // 결제 수단
            merchant_uid: `mid_${new Date().getTime()}`, // 주문번호 생성
            name: productInfo.name,     // 제품명
            amount: productInfo.price,  // 가격
            buyer_email: userInfo.email,
            buyer_name: userInfo.name,
            buyer_tel: '010-0000-0000',
        };

        // 3. 결제 창 호출
        IMP.request_pay(data, callback);
    };

    // 4. 결제 결과 콜백 함수
    const callback = async (response) => {
        const { success, error_msg, merchant_uid } = response;

        if (success) {
            try {
                // ⭐ 5. 백엔드(Spring Boot)에 주문 저장 요청
                // 이메일 대신 'memberName'을 보냅니다.
                await axios.post('http://localhost:8080/api/shop-orders', {
                    memberName: userInfo.name, // 구매자 이름
                    productName: productInfo.name,
                    price: productInfo.price,
                    merchantUid: merchant_uid
                });

                alert('결제 성공! 주문 내역이 저장되었습니다.');

                // 마이페이지로 이동
                navigate('/members/mypage');
            } catch (err) {
                console.error(err);
                alert('결제는 성공했으나, 주문 내역 저장 중 오류가 발생했습니다.');
            }
        } else {
            alert(`결제 실패: ${error_msg}`);
        }
    };

    return (
        <button
            onClick={requestPay}
            className="btn-buy-now" // 기존 디자인 클래스 유지
            style={{
                backgroundColor: '#00d4ff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '20px',
                width: '100%'
            }}
        >
            💳 {Number(productInfo.price).toLocaleString()}원 결제하기
        </button>
    );
};

export default PaymentButton;
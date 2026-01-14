import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PaymentButton = ({ productInfo, userInfo }) => {
    const navigate = useNavigate();

    const requestPay = () => {
        if (!window.IMP) return;
        const { IMP } = window;

        // 본인의 가맹점 식별코드로 되어있는지 확인
        IMP.init('imp44181766');

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
                // ⭐ [핵심 수정] memberId를 같이 보내야 내 주문내역에 뜹니다!
                await axios.post('http://localhost:8080/api/shop-orders', {
                    memberId: userInfo.memberId, // 👈 여기가 추가된 부분입니다.
                    memberName: userInfo.name,
                    productName: productInfo.name,
                    price: productInfo.price,
                    merchantUid: merchant_uid
                });

                alert('결제 성공! 주문 내역이 저장되었습니다.');
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
            className="btn-buy-now"
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
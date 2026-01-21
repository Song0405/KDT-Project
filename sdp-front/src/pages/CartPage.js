import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

// ⭐ 서버 주소 상수화 (유지보수 용이성)
const API_BASE_URL = 'http://localhost:8080/api';
const AI_SERVER_URL = 'http://localhost:5002';

function CartPage() {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);

    const userInfo = {
        memberId: localStorage.getItem('memberId'),
        name: localStorage.getItem('memberName'),
        email: localStorage.getItem('memberEmail') || 'test@test.com'
    };

    useEffect(() => {
        if (!userInfo.name) {
            alert("로그인이 필요합니다.");
            navigate('/members/login');
            return;
        }
        fetchCart();
    }, []);

    const fetchCart = () => {
        axios.get(`${API_BASE_URL}/cart?memberName=${userInfo.name}`)
            .then(res => {
                setCartItems(res.data);
                setSelectedIds(res.data.map(item => item.id));
            })
            .catch(err => console.error(err));
    };

    const handleCheck = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(itemId => itemId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleCheckAll = (checked) => {
        if (checked) {
            setSelectedIds(cartItems.map(item => item.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleDelete = (id) => {
        if(window.confirm("삭제하시겠습니까?")) {
            axios.delete(`${API_BASE_URL}/cart/${id}`)
                .then(() => fetchCart());
        }
    };

    const selectedItems = cartItems.filter(item => selectedIds.includes(item.id));
    const totalPrice = selectedItems.reduce((acc, item) => acc + item.price, 0);

    // 주문명 생성 로직
    const orderName = selectedItems.length > 1
        ? `${selectedItems[0].productName} 외 ${selectedItems.length - 1}건`
        : (selectedItems[0] ? selectedItems[0].productName : "");

    // ⭐ [핵심 수정] 결제 요청 함수 (AI 검사 로직 추가)
    const requestPay = async () => {
        if (selectedItems.length === 0) {
            alert("결제할 상품을 선택해주세요.");
            return;
        }

        // ---------------------------------------------------------
        // 🤖 [AI 지갑 지킴이] 과소비/중복 구매 방지 로직 시작
        // ---------------------------------------------------------
        try {
            console.log("🤖 AI 지갑 지킴이 작동 중...");

            // 1. 내 과거 주문 내역 가져오기 (Spring Boot)
            const historyRes = await axios.get(`${API_BASE_URL}/shop-orders?memberId=${userInfo.memberId}`);
            // 과거 주문한 상품명 리스트 추출
            const pastOrders = historyRes.data.map(order => order.productName);

            // 2. 현재 장바구니에 담긴 상품명 리스트 추출
            const currentItemsNames = selectedItems.map(item => item.productName);

            // 3. 파이썬 AI 서버에게 비교 요청
            // (app.py의 /check-consumption 엔드포인트가 리스트 형태 입력을 받도록 수정되어 있어야 함)
            const aiRes = await axios.post(`${AI_SERVER_URL}/check-consumption`, {
                current: currentItemsNames,
                past_orders: pastOrders
            });

            // 4. AI가 "경고(warning)"를 보냈는지 확인
            if (aiRes.data.isOverConsumption) {
                // 경고창 띄우기
                const userConfirmed = window.confirm(
                    `🤖 [AI 지갑 지킴이 경고]\n\n${aiRes.data.reason}\n\n그래도 결제를 진행하시겠습니까?`
                );

                // 사용자가 "취소"를 누르면 결제 중단 (지갑 방어 성공)
                if (!userConfirmed) {
                    console.log("사용자가 AI의 조언을 듣고 결제를 취소했습니다.");
                    return;
                }
            } else {
                console.log("AI 검사 통과: 과소비 위험 없음 ✅");
            }

        } catch (err) {
            // AI 서버가 꺼져있거나 에러가 나도 결제는 막지 않음 (서비스 연속성)
            console.error("AI 검사 중 오류 발생 (결제는 계속 진행됩니다):", err);
        }
        // ---------------------------------------------------------
        // 🤖 [AI 지갑 지킴이] 로직 끝
        // ---------------------------------------------------------

        // 여기서부터는 기존 결제 로직 (PortOne)
        const { IMP } = window;
        IMP.init('imp44181766');

        const data = {
            pg: 'kakaopay',
            pay_method: 'card',
            merchant_uid: `cart_${new Date().getTime()}`,
            name: orderName,
            amount: totalPrice,
            buyer_name: userInfo.name,
            buyer_email: userInfo.email,
        };

        IMP.request_pay(data, async (response) => {
            if (response.success) {
                // 일괄 저장을 위한 데이터 준비
                const orderDataList = selectedItems.map(item => ({
                    memberId: userInfo.memberId,
                    memberName: userInfo.name,
                    productName: item.productName,
                    price: item.price,
                    merchantUid: response.merchant_uid
                }));

                try {
                    // 1. 주문 내역 일괄 저장
                    await axios.post(`${API_BASE_URL}/shop-orders/batch`, orderDataList);

                    // 2. 결제된 아이템 장바구니에서 삭제
                    for (const id of selectedIds) {
                        await axios.delete(`${API_BASE_URL}/cart/${id}`);
                    }

                    alert("결제가 완료되었습니다!");
                    navigate('/members/mypage');
                } catch (err) {
                    console.error(err);
                    alert("결제는 성공했으나 저장 중 오류가 발생했습니다.");
                }
            } else {
                alert(`결제 실패: ${response.error_msg}`);
            }
        });
    };

    return (
        <div className="cart-wrapper">
            <h1>MY CART 🛒</h1>

            <div className="cart-content">
                <div className="cart-list">
                    <div className="cart-header">
                        <input
                            type="checkbox"
                            onChange={(e) => handleCheckAll(e.target.checked)}
                            checked={cartItems.length > 0 && selectedIds.length === cartItems.length}
                        />
                        <span>전체 선택 ({selectedIds.length}/{cartItems.length})</span>
                    </div>

                    {cartItems.length === 0 ? (
                        <div className="empty-cart">장바구니가 비어있습니다.</div>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.id} className={`cart-item ${selectedIds.includes(item.id) ? 'active' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(item.id)}
                                    onChange={() => handleCheck(item.id)}
                                />
                                <img src={item.imageUrl} alt="thumb" className="cart-thumb" />
                                <div className="cart-info">
                                    <h3>{item.productName}</h3>
                                    <p>{item.price.toLocaleString()} KRW</p>
                                </div>
                                <button className="btn-delete" onClick={() => handleDelete(item.id)}>✕</button>
                            </div>
                        ))
                    )}
                </div>

                <div className="cart-summary">
                    <h3>PAYMENT INFO</h3>
                    <div className="summary-row">
                        <span>선택 상품</span>
                        <span>{selectedItems.length} 개</span>
                    </div>
                    <div className="summary-row total">
                        <span>TOTAL</span>
                        <span>{totalPrice.toLocaleString()} KRW</span>
                    </div>
                    <button className="btn-checkout" onClick={requestPay}>
                        {totalPrice.toLocaleString()}원 결제하기
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CartPage;
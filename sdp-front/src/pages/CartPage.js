import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; // 🍬 추가
import './CartPage.css';

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
            Swal.fire({ icon: 'warning', title: '로그인 필요', text: '장바구니를 보려면 로그인이 필요합니다.', background: '#333', color: '#fff' })
                .then(() => navigate('/members/login'));
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
        Swal.fire({
            title: '삭제하시겠습니까?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4d4d',
            cancelButtonColor: '#3085d6',
            confirmButtonText: '삭제',
            background: '#333', color: '#fff'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(`${API_BASE_URL}/cart/${id}`)
                    .then(() => fetchCart());
            }
        });
    };

    const selectedItems = cartItems.filter(item => selectedIds.includes(item.id));
    const totalPrice = selectedItems.reduce((acc, item) => acc + item.price, 0);

    const orderName = selectedItems.length > 1
        ? `${selectedItems[0].productName} 외 ${selectedItems.length - 1}건`
        : (selectedItems[0] ? selectedItems[0].productName : "");

    // ⭐ 결제 요청 함수 (AI 검사 + Swal 적용)
    const requestPay = async () => {
        if (selectedItems.length === 0) {
            Swal.fire({ icon: 'info', title: '선택 없음', text: '결제할 상품을 선택해주세요.', background: '#333', color: '#fff' });
            return;
        }

        try {
            // 로딩 표시
            Swal.fire({
                title: 'AI 지갑 지킴이 가동 중... 👮‍♂️',
                text: '과소비 패턴을 분석하고 있습니다.',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
                background: '#333', color: '#fff'
            });

            const historyRes = await axios.get(`${API_BASE_URL}/shop-orders?memberId=${userInfo.memberId}`);
            const pastOrders = historyRes.data.map(order => order.productName);
            const currentItemsNames = selectedItems.map(item => item.productName);

            const aiRes = await axios.post(`${AI_SERVER_URL}/check-consumption`, {
                current: currentItemsNames,
                past_orders: pastOrders
            });

            Swal.close(); // 로딩 닫기

            if (aiRes.data.isOverConsumption) {
                const result = await Swal.fire({
                    title: '🚨 AI 과소비 경고!',
                    html: `<p style="color:#aaa">${aiRes.data.reason}</p><br/><b>그래도 결제를 진행하시겠습니까?</b>`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ff4d4d',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: '진행',
                    cancelButtonText: '취소',
                    background: '#222', color: '#fff'
                });

                if (!result.isConfirmed) return; // 취소됨
            }

        } catch (err) {
            console.error("AI 검사 오류:", err);
            // 에러 나도 결제 진행
        }

        // PortOne 결제
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
                const orderDataList = selectedItems.map(item => ({
                    memberId: userInfo.memberId,
                    memberName: userInfo.name,
                    productName: item.productName,
                    price: item.price,
                    merchantUid: response.merchant_uid
                }));

                try {
                    await axios.post(`${API_BASE_URL}/shop-orders/batch`, orderDataList);
                    for (const id of selectedIds) {
                        await axios.delete(`${API_BASE_URL}/cart/${id}`);
                    }

                    Swal.fire({
                        icon: 'success', title: '결제 완료!',
                        text: '주문 내역이 정상적으로 저장되었습니다.',
                        background: '#333', color: '#fff', confirmButtonColor: '#00d4ff'
                    }).then(() => navigate('/members/mypage'));

                } catch (err) {
                    Swal.fire('오류', '결제는 성공했으나 저장 중 오류가 발생했습니다.', 'error');
                }
            } else {
                Swal.fire({ icon: 'error', title: '결제 실패', text: response.error_msg, background: '#333', color: '#fff' });
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
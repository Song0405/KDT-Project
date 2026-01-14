import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

function CartPage() {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);

    const userInfo = {
        // ⭐ [추가됨] 주문 시 '누가 주문했는지(ID)'를 알아야 합니다.
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
        axios.get(`http://localhost:8080/api/cart?memberName=${userInfo.name}`)
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
            axios.delete(`http://localhost:8080/api/cart/${id}`)
                .then(() => fetchCart());
        }
    };

    const selectedItems = cartItems.filter(item => selectedIds.includes(item.id));
    const totalPrice = selectedItems.reduce((acc, item) => acc + item.price, 0);
    const orderName = selectedItems.length > 1
        ? `${selectedItems[0].productName} 외 ${selectedItems.length - 1}건`
        : (selectedItems[0] ? selectedItems[0].productName : "");

    const requestPay = () => {
        if (selectedItems.length === 0) {
            alert("결제할 상품을 선택해주세요.");
            return;
        }

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
                // ⭐ [핵심 수정] 서버로 보낼 때 memberId를 꼭 포함해야 합니다!
                const orderDataList = selectedItems.map(item => ({
                    memberId: userInfo.memberId, // 👈 여기가 핵심입니다.
                    memberName: userInfo.name,
                    productName: item.productName,
                    price: item.price,
                    merchantUid: response.merchant_uid
                }));

                try {
                    // 1. 주문 내역 저장
                    await axios.post('http://localhost:8080/api/shop-orders/batch', orderDataList);

                    // 2. 결제된 아이템 장바구니에서 삭제
                    for (const id of selectedIds) {
                        await axios.delete(`http://localhost:8080/api/cart/${id}`);
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
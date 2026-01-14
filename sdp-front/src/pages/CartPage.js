import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CartPage.css'; // 아래 CSS 참고

function CartPage() {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]); // 선택된 아이템 ID들

    const userInfo = {
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

    // 장바구니 목록 불러오기
    const fetchCart = () => {
        axios.get(`http://localhost:8080/api/cart?memberName=${userInfo.name}`)
            .then(res => {
                setCartItems(res.data);
                // 처음엔 전체 선택 상태로 두기 (편의상)
                setSelectedIds(res.data.map(item => item.id));
            })
            .catch(err => console.error(err));
    };

    // 체크박스 개별 선택
    const handleCheck = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(itemId => itemId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // 전체 선택/해제
    const handleCheckAll = (checked) => {
        if (checked) {
            setSelectedIds(cartItems.map(item => item.id));
        } else {
            setSelectedIds([]);
        }
    };

    // 삭제 기능
    const handleDelete = (id) => {
        if(window.confirm("삭제하시겠습니까?")) {
            axios.delete(`http://localhost:8080/api/cart/${id}`)
                .then(() => fetchCart());
        }
    };

    // ⭐ 선택된 상품들 정보 계산
    const selectedItems = cartItems.filter(item => selectedIds.includes(item.id));
    const totalPrice = selectedItems.reduce((acc, item) => acc + item.price, 0);
    const orderName = selectedItems.length > 1
        ? `${selectedItems[0].productName} 외 ${selectedItems.length - 1}건`
        : (selectedItems[0] ? selectedItems[0].productName : "");

    // 💳 결제 요청 함수
    const requestPay = () => {
        if (selectedItems.length === 0) {
            alert("결제할 상품을 선택해주세요.");
            return;
        }

        const { IMP } = window;
        IMP.init('imp44181766'); // 🔴 본인 가맹점 코드 입력 필수!

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
                // 결제 성공 -> 서버에 주문 내역 저장 (일괄 저장)
                const orderDataList = selectedItems.map(item => ({
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

                {/* 우측 결제 요약 박스 */}
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
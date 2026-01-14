import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './MyPage.css';

function MyPage() {
    const navigate = useNavigate();
    const hasAlerted = useRef(false);

    const [userInfo, setUserInfo] = useState({ name: '', email: '', joinDate: '' });
    const [rawOrderList, setRawOrderList] = useState([]);
    const [cartCount, setCartCount] = useState(0);

    const [expandedOrderId, setExpandedOrderId] = useState(null);

    // 로그인 시 저장해둔 진짜 영어 아이디
    const realMemberId = localStorage.getItem('memberId');

    useEffect(() => {
        const storedName = localStorage.getItem('memberName');
        const storedEmail = localStorage.getItem('memberEmail') || 'guest@rootstation.com';

        if (!storedName) {
            if (!hasAlerted.current) {
                hasAlerted.current = true;
                alert("로그인이 필요한 서비스입니다.");
                navigate('/members/login');
            }
            return;
        }

        setUserInfo({
            name: storedName,
            joinDate: new Date().toLocaleDateString(),
            email: storedName === '관리자' ? 'root_admin@server.com' : storedEmail
        });

        if (storedName !== '관리자') {
            // ⭐ [핵심 수정] 이제 이름(storedName)이 아니라 아이디(realMemberId)로 주문을 찾습니다.
            // 이렇게 하면 탈퇴 후 재가입해도 예전 주문이 딸려오지 않습니다.
            if (realMemberId) {
                axios.get(`http://localhost:8080/api/shop-orders?memberId=${realMemberId}`)
                    .then(res => setRawOrderList(res.data))
                    .catch(err => console.error("주문 내역 로드 실패", err));
            }

            axios.get(`http://localhost:8080/api/cart?memberName=${storedName}`)
                .then(res => setCartCount(res.data.length))
                .catch(err => console.error("장바구니 로드 실패", err));
        }

    }, [navigate, realMemberId]); // realMemberId가 바뀔 때도 실행되도록 의존성 추가

    // --- (아래 로직은 그대로 유지) ---
    const groupedOrders = useMemo(() => {
        const groups = {};
        rawOrderList.forEach(order => {
            const uid = order.merchantUid;
            if (!groups[uid]) {
                groups[uid] = {
                    merchantUid: uid,
                    orderDate: order.orderDate,
                    items: [],
                    totalPrice: 0,
                    repProductName: order.productName
                };
            }
            groups[uid].items.push(order);
            groups[uid].totalPrice += order.price;
        });
        return Object.values(groups).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    }, [rawOrderList]);

    const getDisplayName = (group) => {
        const count = group.items.length;
        if (count === 1) return group.repProductName;
        return `${group.repProductName} 외 ${count - 1}건`;
    };

    const toggleOrder = (uid) => {
        if (expandedOrderId === uid) {
            setExpandedOrderId(null);
        } else {
            setExpandedOrderId(uid);
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'ORDERED': return '주문 접수';
            case 'MANUFACTURING': return '제작 중';
            case 'QUALITY_CHECK': return '검수 중';
            case 'SHIPPING': return '배송 중';
            case 'COMPLETED': return '배송 완료';
            default: return '접수됨';
        }
    };

    const handleInfoChange = () => {
        if(window.confirm("개인정보(비밀번호 등)를 변경하시겠습니까?")) {
            navigate('/members/edit');
        }
    };

    // [회원 탈퇴] 핸들러
    const handleWithdrawal = async () => {
        if (!window.confirm("정말로 탈퇴하시겠습니까? \n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.")) {
            return;
        }

        const password = window.prompt("본인 확인을 위해 비밀번호를 입력해주세요.");
        if (!password) {
            return;
        }

        try {
            await axios.post(`http://localhost:8080/api/members/withdraw`, {
                memberId: realMemberId,
                currentPassword: password,
                type: 'individual'
            });

            alert("회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.");

            // 1. 로컬 스토리지 비우기 (로그아웃)
            localStorage.clear();

            // 2. 메인으로 이동하며 새로고침
            window.location.href = '/';

        } catch (err) {
            console.error("탈퇴 처리 실패:", err);
            const msg = err.response?.data || "탈퇴 처리에 실패했습니다.";
            alert(msg);
        }
    };

    const isAdmin = userInfo.name === '관리자';

    if (!userInfo.name) return null;

    return (
        <div className="mypage-container" style={{ color: 'white', padding: '50px 20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '40px' }}>
                MY PAGE
            </h1>

            <div className="profile-card" style={{ display: 'flex', gap: '30px', alignItems: 'center', background: '#111', padding: '30px', borderRadius: '12px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: isAdmin ? '#3B82F6' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                    {isAdmin ? '🛡️' : '👤'}
                </div>
                <div className="profile-info">
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '1.8rem' }}>
                        {userInfo.name} <span style={{ fontSize: '1rem', color: isAdmin ? '#3B82F6' : '#888', fontWeight: 'normal' }}>
                            {isAdmin ? '[ SYSTEM ADMIN ]' : '[ MEMBER ]'}
                        </span>
                    </h2>
                    <p style={{ color: '#888', margin: '5px 0' }}>이메일: {userInfo.email}</p>
                </div>
            </div>

            <div className="dashboard-section" style={{ marginTop: '50px' }}>
                {isAdmin ? (
                    <div>
                        <h3 style={{ color: '#3B82F6' }}>🛡️ 관리자 전용 메뉴</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <Link to="/admin" style={adminButtonStyle}>⚙️ 제품 및 공지 관리</Link>
                            <Link to="/admin/orders" style={adminButtonStyle}>📦 전체 주문 공정 관리</Link>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={cartStatusStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#bb86fc' }}>🛒 MY SHOPPING CART</h3>
                                    <p style={{ margin: '5px 0 0 0', color: '#aaa' }}>현재 장바구니에 담긴 아이템</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{cartCount}</span>
                                    <span style={{ color: '#666' }}> 개</span>
                                </div>
                            </div>
                            <Link to="/cart" style={btnGoCart}>
                                장바구니 확인하러 가기 →
                            </Link>
                        </div>

                        <h3>📦 최근 주문 내역 ({groupedOrders.length}건)</h3>
                        <div style={{ marginTop: '20px' }}>
                            {groupedOrders.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {groupedOrders.map((group) => (
                                        <div key={group.merchantUid} style={{ background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
                                            <div
                                                style={{
                                                    padding: '20px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    borderLeft: '4px solid #00d4ff',
                                                    background: expandedOrderId === group.merchantUid ? '#222' : '#1a1a1a',
                                                    transition: '0.3s',
                                                    cursor: 'default'
                                                }}
                                            >
                                                <div>
                                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {getDisplayName(group)}
                                                        <span
                                                            onClick={() => toggleOrder(group.merchantUid)}
                                                            style={{
                                                                fontSize:'0.8rem', color:'#888', cursor: 'pointer',
                                                                border: '1px solid #555', padding: '2px 8px',
                                                                borderRadius: '4px', background: '#000', userSelect: 'none'
                                                            }}
                                                        >
                                                            {expandedOrderId === group.merchantUid ? '▲ 접기' : '▼ 상세보기'}
                                                        </span>
                                                    </h4>
                                                    <p style={{ color: '#888', margin: 0, fontSize: '0.9rem', userSelect: 'text', cursor: 'text' }}>
                                                        주문번호: <span style={{color: '#00d4ff'}}>{group.merchantUid}</span>
                                                    </p>
                                                    <p style={{ color: '#666', margin: 0, fontSize: '0.8rem' }}>
                                                        {group.orderDate ? new Date(group.orderDate).toLocaleString() : '-'}
                                                    </p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#00d4ff' }}>
                                                        {Number(group.totalPrice).toLocaleString()} 원
                                                    </div>
                                                    <div style={{fontSize: '0.8rem', color: '#666'}}>
                                                        총 {group.items.length}개 품목
                                                    </div>
                                                </div>
                                            </div>

                                            {expandedOrderId === group.merchantUid && (
                                                <div style={{ background: '#000', padding: '15px 20px', borderTop: '1px solid #333', animation: 'slideDown 0.3s ease-out' }}>
                                                    {group.items.map((item, idx) => (
                                                        <div key={item.id} style={{
                                                            display: 'flex', justifyContent: 'space-between', padding: '12px 0',
                                                            borderBottom: idx !== group.items.length - 1 ? '1px solid #222' : 'none',
                                                            color: '#ccc'
                                                        }}>
                                                            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                                                <span style={{color: '#00d4ff', fontWeight:'bold'}}>•</span>
                                                                <span>{item.productName}</span>
                                                            </div>
                                                            <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
                                                                <span style={{fontSize:'0.9rem', color: '#888'}}>
                                                                    {getStatusText(item.status || 'ORDERED')}
                                                                </span>
                                                                <span style={{fontWeight:'bold'}}>
                                                                    {Number(item.price).toLocaleString()} 원
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ background: '#1a1a1a', padding: '40px', textAlign: 'center', borderRadius: '8px', color: '#666' }}>
                                    <p>최근 주문한 내역이 없습니다.</p>
                                    <Link to="/products" style={{ color: '#00d4ff', textDecoration: 'none', marginTop: '10px', display: 'inline-block' }}>
                                        쇼핑하러 가기 &rarr;
                                    </Link>
                                </div>
                            )}
                        </div>

                        <h3 style={{ marginTop: '40px' }}>🔐 개인정보 관리</h3>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                            <button style={outlineButtonStyle} onClick={handleInfoChange}>
                                개인정보 변경
                            </button>
                            <button style={outlineButtonStyle} onClick={handleWithdrawal}>
                                회원 탈퇴
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const adminButtonStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    background: '#1e293b', color: '#3B82F6', textDecoration: 'none', borderRadius: '8px',
    fontWeight: 'bold', fontSize: '1.1rem', border: '1px solid #3B82F6', transition: '0.3s'
};

const cartStatusStyle = {
    background: 'linear-gradient(45deg, #1a1a1a, #222)',
    padding: '25px', borderRadius: '12px', marginBottom: '40px',
    border: '1px solid #333', boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
};

const btnGoCart = {
    display: 'block', marginTop: '15px', padding: '12px',
    background: '#bb86fc', color: '#000', textAlign: 'center',
    fontWeight: 'bold', borderRadius: '6px', textDecoration: 'none',
    transition: '0.3s'
};

const outlineButtonStyle = {
    padding: '10px 20px', background: 'transparent', border: '1px solid #555',
    color: '#aaa', borderRadius: '4px', cursor: 'pointer'
};

export default MyPage;
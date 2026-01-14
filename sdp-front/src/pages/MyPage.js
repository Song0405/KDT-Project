import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './MyPage.css';

function MyPage() {
    const navigate = useNavigate();
    const hasAlerted = useRef(false);

    // 사용자 정보 상태
    const [userInfo, setUserInfo] = useState({ name: '', email: '', joinDate: '' });
    // 주문 내역 리스트 상태
    const [orderList, setOrderList] = useState([]);

    useEffect(() => {
        const storedName = localStorage.getItem('memberName');
        const storedEmail = localStorage.getItem('memberEmail') || 'guest@rootstation.com';

        // 1. 비로그인 접근 차단
        if (!storedName) {
            if (!hasAlerted.current) {
                hasAlerted.current = true;
                alert("로그인이 필요한 서비스입니다.");
                navigate('/members/login');
            }
            return;
        }

        // 2. 사용자 정보 세팅
        setUserInfo({
            name: storedName,
            joinDate: new Date().toLocaleDateString(),
            email: storedName === '관리자' ? 'root_admin@server.com' : storedEmail
        });

        // ⭐ 3. 서버에서 내 주문 내역 가져오기 (이름 기준)
        if (storedName !== '관리자') {
            // Controller의 getMyOrders(@RequestParam String name)과 매칭
            axios.get(`http://localhost:8080/api/shop-orders?name=${storedName}`)
                .then(res => {
                    console.log("주문 내역 로드 성공:", res.data);
                    setOrderList(res.data);
                })
                .catch(err => {
                    console.error("주문 내역 로드 실패:", err);
                });
        }

    }, [navigate]);

    const isAdmin = userInfo.name === '관리자';

    // 로딩 전 화면 방지
    if (!userInfo.name) return null;

    return (
        <div className="mypage-container" style={{ color: 'white', padding: '50px 20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '40px' }}>
                MY PAGE
            </h1>

            {/* 프로필 카드 섹션 */}
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

            {/* 대시보드 및 주문 내역 섹션 */}
            <div className="dashboard-section" style={{ marginTop: '50px' }}>
                {isAdmin ? (
                    // 관리자 화면
                    <div>
                        <h3 style={{ color: '#3B82F6' }}>🛡️ 관리자 전용 메뉴</h3>
                        <p style={{ color: '#999', marginBottom: '20px' }}>시스템 설정 및 주문 관리를 진행할 수 있습니다.</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <Link to="/admin" style={adminButtonStyle}>
                                ⚙️ 제품 및 공지 관리
                            </Link>
                            <Link to="/admin/orders" style={adminButtonStyle}>
                                📦 전체 주문 공정 관리
                            </Link>
                        </div>
                    </div>
                ) : (
                    // 일반 회원 화면 (주문 내역 표시)
                    <div>
                        <h3>📦 나의 주문 내역 <span style={{fontSize:'0.9rem', color:'#888'}}>({orderList.length}건)</span></h3>

                        <div style={{ marginTop: '20px' }}>
                            {orderList.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {orderList.map((order) => (
                                        <div key={order.id} style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #00d4ff' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: 'white' }}>{order.productName}</h4>
                                                <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>주문번호: {order.merchantUid}</p>
                                                <p style={{ color: '#666', margin: 0, fontSize: '0.8rem' }}>
                                                    {order.orderDate ? new Date(order.orderDate).toLocaleString() : '날짜 정보 없음'}
                                                </p>
                                            </div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#00d4ff' }}>
                                                {Number(order.price).toLocaleString()} 원
                                            </div>
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
                            <button style={outlineButtonStyle}>비밀번호 변경</button>
                            <button style={outlineButtonStyle}>회원 탈퇴</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// 스타일 컴포넌트
const adminButtonStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    background: '#1e293b', color: '#3B82F6', textDecoration: 'none', borderRadius: '8px',
    fontWeight: 'bold', fontSize: '1.1rem', border: '1px solid #3B82F6', transition: '0.3s'
};

const outlineButtonStyle = {
    padding: '10px 20px', background: 'transparent', border: '1px solid #555',
    color: '#aaa', borderRadius: '4px', cursor: 'pointer'
};

export default MyPage;
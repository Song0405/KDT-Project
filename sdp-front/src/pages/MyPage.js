import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './MyPage.css';

function MyPage() {
    const navigate = useNavigate();

    // ⭐ 팝업창 중복 방지를 위한 Ref
    const hasAlerted = useRef(false);

    const [userInfo, setUserInfo] = useState({
        name: '',
        joinDate: '',
        email: ''
    });

    useEffect(() => {
        // 로컬 스토리지에서 정보 가져오기
        const storedName = localStorage.getItem('memberName');
        const storedEmail = localStorage.getItem('memberEmail') || 'admin@rootstation.com';

        // 1. 로그인이 안 된 경우 (이름 정보 없음)
        if (!storedName) {
            // ⭐ 경고창이 아직 안 떴을 때만 실행
            if (!hasAlerted.current) {
                hasAlerted.current = true; // 깃발 꽂기 (이제 떴음!)
                alert("로그인이 필요한 서비스입니다.");
                navigate('/members/login');
            }
            return;
        }

        // 2. 로그인 된 경우 정보 세팅
        setUserInfo({
            name: storedName,
            joinDate: new Date().toLocaleDateString(), // 가입일은 현재 날짜로 임시 표시
            email: storedName === '관리자' ? 'root_admin@server.com' : storedEmail
        });
    }, [navigate]);

    // 관리자 여부 확인
    const isAdmin = userInfo.name === '관리자';

    // 데이터가 로딩되기 전 깜빡임 방지 (로그인 안됐으면 화면 안그림)
    if (!userInfo.name) return null;

    return (
        <div className="mypage-container" style={{ color: 'white', padding: '50px 20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '40px' }}>
                MY PAGE
            </h1>

            <div className="profile-card" style={{ display: 'flex', gap: '30px', alignItems: 'center', background: '#111', padding: '30px', borderRadius: '12px' }}>
                {/* 프로필 이미지 영역 */}
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: isAdmin ? '#3B82F6' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                    {isAdmin ? '🛡️' : '👤'}
                </div>

                <div className="profile-info">
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '1.8rem' }}>
                        {userInfo.name} <span style={{ fontSize: '1rem', color: isAdmin ? '#3B82F6' : '#888', fontWeight: 'normal' }}>
                            {isAdmin ? '[ SYSTEM ADMIN ]' : '[ BRONZE MEMBER ]'}
                        </span>
                    </h2>
                    <p style={{ color: '#888', margin: '5px 0' }}>이메일: {userInfo.email}</p>
                    <p style={{ color: '#666', margin: 0 }}>가입일: {userInfo.joinDate}</p>
                </div>
            </div>

            <div className="dashboard-section" style={{ marginTop: '50px' }}>
                {isAdmin ? (
                    // ⭐ 관리자일 때 보이는 화면
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
                    // ⭐ 일반 회원일 때 보이는 화면
                    <div>
                        <h3>📦 나의 주문 내역</h3>
                        <div style={{ background: '#1a1a1a', padding: '40px', textAlign: 'center', borderRadius: '8px', marginTop: '20px', color: '#666' }}>
                            <p>최근 주문한 내역이 없습니다.</p>
                            <Link to="/products" style={{ color: '#00d4ff', textDecoration: 'none', marginTop: '10px', display: 'inline-block' }}>
                                쇼핑하러 가기 &rarr;
                            </Link>
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

// 간단한 인라인 스타일
const adminButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: '#1e293b',
    color: '#3B82F6',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    border: '1px solid #3B82F6',
    transition: '0.3s'
};

const outlineButtonStyle = {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid #555',
    color: '#aaa',
    borderRadius: '4px',
    cursor: 'pointer'
};

export default MyPage;
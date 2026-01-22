import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2'; // 🍬 SweetAlert2 필수 임포트
import './Layout.css';

function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // 페이지 이동할 때마다 로그인 여부 체크
    useEffect(() => {
        const memberId = localStorage.getItem('memberId');
        setIsLoggedIn(!!memberId);
    }, [location]);

    // ⭐ [핵심] 로그아웃 버튼 클릭 시 예쁜 알림창 띄우기
    const handleLogout = () => {
        Swal.fire({
            title: 'LOGOUT',
            text: "정말 로그아웃 하시겠습니까?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ff4d4d', // 로그아웃이니까 빨간색
            cancelButtonColor: '#3085d6',  // 취소는 파란색
            confirmButtonText: '네, 로그아웃',
            cancelButtonText: '취소',
            background: '#222', // 다크모드 배경
            color: '#fff',      // 흰색 글씨
            reverseButtons: true // 버튼 순서 변경 (취소 | 확인)
        }).then((result) => {
            if (result.isConfirmed) {
                // 사용자가 '네'를 눌렀을 때 실행
                localStorage.clear(); // 정보 삭제
                setIsLoggedIn(false);

                Swal.fire({
                    icon: 'success',
                    title: '로그아웃 완료',
                    text: '메인 화면으로 이동합니다.',
                    showConfirmButton: false,
                    timer: 1500,
                    background: '#222',
                    color: '#fff'
                }).then(() => {
                    navigate('/'); // 메인으로 이동
                });
            }
        });
    };

    const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

    return (
        <header className="site-header">
            <div className="header-content">
                {/* 로고 클릭 시 메인 이동 */}
                <div className="brand-logo" onClick={() => navigate('/')}>
                    ROOT STATION
                </div>

                <nav className="header-nav">
                    <button onClick={() => navigate('/')} className={isActive('/')}>HOME</button>

                    {/* 로그인 상태에 따라 버튼 다르게 보여주기 */}
                    {isLoggedIn ? (
                        <>
                            <button onClick={() => navigate('/members/mypage')} className={isActive('/members/mypage')}>마이페이지</button>
                            {/* 로그아웃 버튼 (스타일 약간 다르게) */}
                            <button
                                onClick={handleLogout}
                                className="nav-link"
                                style={{color: '#ff4d4d', borderColor: '#ff4d4d'}}
                            >
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => navigate('/members/login')} className={isActive('/members/login')}>로그인</button>
                            <button onClick={() => navigate('/members/join')} className={`${isActive('/members/join')} highlight`}>회원가입</button>
                        </>
                    )}

                    <button className="menu-button"><span className="menu-icon">☰</span> 전체메뉴</button>
                </nav>
            </div>
        </header>
    );
}

export default Header;
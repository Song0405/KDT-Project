import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

function Header() {
    const navigate = useNavigate();
    const location = useLocation();

    // 현재 경로에 따라 활성화 스타일을 주기 위한 함수
    const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

    return (
        <header className="site-header">
            <div className="header-content">
                {/* 클릭 시 메인으로 이동하는 그라데이션 로고 */}
                <div className="brand-logo" onClick={() => navigate('/')}>
                    ROOT STATION
                </div>

                {/* 네비게이션 메뉴 */}
                <nav className="header-nav">
                    <button
                        onClick={() => navigate('/')}
                        className={isActive('/')}
                    >
                        HOME
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className={isActive('/login')}
                    >
                        로그인
                    </button>
                    <button
                        onClick={() => navigate('/signup')}
                        className={`${isActive('/signup')} highlight`}
                    >
                        회원가입
                    </button>
                    <button className="menu-button">
                        <span className="menu-icon">☰</span> 전체메뉴
                    </button>
                </nav>
            </div>
        </header>
    );
}

export default Header;
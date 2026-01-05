import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import Chatbot from './components/Chatbot';
import './index.css';

// ⭐ [중요] 만든 페이지들 가져오기
import JoinPage from './pages/JoinPage';
import LoginPage from './pages/LoginPage';

function App() {
    // 1. 로그인 상태 관리 (새로고침 해도 유지되도록 localStorage 사용)
    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem('isAuthenticated') === 'true'
    );
    const location = useLocation();

    // 상태가 바뀔 때마다 localStorage에도 저장
    useEffect(() => {
        localStorage.setItem('isAuthenticated', isAuthenticated);
    }, [isAuthenticated]);

    // 로그아웃 함수
    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
        alert("로그아웃 되었습니다.");
    };

    return (
        <>
            {/* --- 헤더 (상단 메뉴) --- */}
            <header style={styles.header}>
                <nav style={styles.container}>
                    <NavLink to="/" style={styles.logo}>
                        SDP Solutions
                    </NavLink>
                    <div style={styles.nav}>
                        <NavLink
                            to="/"
                            style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
                        >
                            HOME
                        </NavLink>

                        {/* ⭐ 로그인 상태에 따라 메뉴가 다르게 보임 */}
                        {isAuthenticated ? (
                            // 로그인 했을 때: 로그아웃 버튼 표시
                            <button onClick={handleLogout} style={styles.logoutButton}>
                                LOGOUT
                            </button>
                        ) : (
                            // 로그인 안 했을 때: JOIN, LOGIN 버튼 표시
                            <>
                                <NavLink
                                    to="/members/join"
                                    style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
                                >
                                    SIGN-UP
                                </NavLink>
                                <NavLink
                                    to="/members/login"
                                    style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
                                >
                                    LOGIN
                                </NavLink>
                            </>
                        )}
                    </div>
                </nav>
            </header>

            {/* --- 메인 콘텐츠 (페이지 이동) --- */}
            <main>
                <Routes>
                    <Route path="/" element={<HomePage />} />

                    {/* 회원가입 페이지 */}
                    <Route path="/members/join" element={<JoinPage />} />

                    {/* ⭐ 로그인 페이지: 성공 시 상태를 바꾸기 위해 함수(setIsAuthenticated)를 전달함 */}
                    <Route
                        path="/members/login"
                        element={<LoginPage setIsAuthenticated={setIsAuthenticated} />}
                    />

                    {/* 관리자 페이지 */}
                    <Route
                        path="/admin"
                        element={
                            isAuthenticated ? (
                                <AdminPage />
                            ) : (
                                <AdminLoginPage setAuthenticated={setIsAuthenticated} />
                            )
                        }
                    />
                </Routes>
            </main>

            <Chatbot />

            {/* --- 푸터 --- */}
            <footer style={styles.footer}>
                <p>&copy; {new Date().getFullYear()} SDP Solutions. All rights reserved.</p>
            </footer>
        </>
    );
}

// 스타일 (기존 유지)
const styles = {
    header: {
        backgroundColor: '#111827',
        padding: '20px 0',
        borderBottom: '3px solid #F97316',
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: {
        fontWeight: 'bold',
        fontSize: '1.8em',
        color: '#F3F4F6',
        textDecoration: 'none',
        letterSpacing: '1px',
    },
    nav: {
        display: 'flex',
        gap: '25px',
        alignItems: 'center',
    },
    link: {
        color: '#D1D5DB',
        textDecoration: 'none',
        fontSize: '1em',
        fontWeight: '500',
        padding: '8px 12px',
        borderRadius: '5px',
        transition: 'all 0.3s',
    },
    activeLink: {
        color: '#FFFFFF',
        textDecoration: 'none',
        fontSize: '1em',
        fontWeight: '500',
        padding: '8px 12px',
        borderRadius: '5px',
        backgroundColor: '#F97316',
    },
    logoutButton: {
        backgroundColor: '#DC2626',
        color: 'white',
        padding: '8px 12px',
        border: 'none',
        borderRadius: '5px',
        fontSize: '1em',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease',
        marginLeft: '10px',
    },
    footer: {
        textAlign: 'center',
        padding: '30px',
        marginTop: '50px',
        backgroundColor: '#111827',
        color: '#9CA3AF',
        borderTop: '1px solid #374151',
    },
};

export default App;
import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
// ⭐⭐⭐ BrowserRouter as Router 임포트 제거 ⭐⭐⭐
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'; // useLocation은 유지
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import Chatbot from './components/Chatbot'; // 💡 1. 챗봇 임포트 추가!
import './index.css'; // 전역 CSS

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem('isAuthenticated') === 'true'
    );
    const location = useLocation(); // ⭐⭐⭐ useLocation은 여기서 사용 가능 ⭐⭐⭐

=======
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
>>>>>>> 08363241cb8fd388720ec4e6b16b7d5e0c05c6fe
    useEffect(() => {
        localStorage.setItem('isAuthenticated', isAuthenticated);
    }, [isAuthenticated]);

<<<<<<< HEAD
    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
        // 로그아웃 후 홈으로 리다이렉트
        // useLocation을 App에서 사용하므로, navigate도 App 내에서 정의해야 합니다.
        // 하지만 지금은 로그아웃 시 AdminPage에서 AdminLoginPage로 자동 전환되므로 Navigate가 필요없습니다.
    };

    return (
        // ⭐⭐⭐ <Router> 태그 제거 ⭐⭐⭐
        <> {/* React.Fragment로 감싸거나, 최상위 div로 감싸야 합니다. */}
            {/* 헤더 */}
=======
    // 로그아웃 함수
    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
        alert("로그아웃 되었습니다.");
    };

    return (
        <>
            {/* --- 헤더 (상단 메뉴) --- */}
>>>>>>> 08363241cb8fd388720ec4e6b16b7d5e0c05c6fe
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
<<<<<<< HEAD
                        {/* 로그인 상태이고 현재 경로가 /admin일 때만 로그아웃 버튼 표시 */}
                        {isAuthenticated && location.pathname === '/admin' && (
                            <button onClick={handleLogout} style={styles.logoutButton}>
                                LOGOUT
                            </button>
=======

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
>>>>>>> 08363241cb8fd388720ec4e6b16b7d5e0c05c6fe
                        )}
                    </div>
                </nav>
            </header>

<<<<<<< HEAD
            {/* 메인 콘텐츠 영역 */}
            <main>
                <Routes>
                    <Route path="/" element={<HomePage />} />
=======
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
>>>>>>> 08363241cb8fd388720ec4e6b16b7d5e0c05c6fe
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
<<<<<<< HEAD
            <Chatbot />

            {/* 푸터 */}
=======

            <Chatbot />

            {/* --- 푸터 --- */}
>>>>>>> 08363241cb8fd388720ec4e6b16b7d5e0c05c6fe
            <footer style={styles.footer}>
                <p>&copy; {new Date().getFullYear()} SDP Solutions. All rights reserved.</p>
            </footer>
        </>
<<<<<<< HEAD
        // ⭐⭐⭐ </Router> 태그 제거 ⭐⭐⭐
    );
}

// ... styles 객체는 이전과 동일하게 유지됩니다 ...
=======
    );
}

// 스타일 (기존 유지)
>>>>>>> 08363241cb8fd388720ec4e6b16b7d5e0c05c6fe
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
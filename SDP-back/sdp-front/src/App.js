import React, { useState, useEffect } from 'react';
// ⭐⭐⭐ BrowserRouter as Router 임포트 제거 ⭐⭐⭐
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'; // useLocation은 유지
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import './index.css'; // 전역 CSS

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem('isAuthenticated') === 'true'
    );
    const location = useLocation(); // ⭐⭐⭐ useLocation은 여기서 사용 가능 ⭐⭐⭐

    useEffect(() => {
        localStorage.setItem('isAuthenticated', isAuthenticated);
    }, [isAuthenticated]);

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
                        {/* 로그인 상태이고 현재 경로가 /admin일 때만 로그아웃 버튼 표시 */}
                        {isAuthenticated && location.pathname === '/admin' && (
                            <button onClick={handleLogout} style={styles.logoutButton}>
                                LOGOUT
                            </button>
                        )}
                    </div>
                </nav>
            </header>

            {/* 메인 콘텐츠 영역 */}
            <main>
                <Routes>
                    <Route path="/" element={<HomePage />} />
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

            {/* 푸터 */}
            <footer style={styles.footer}>
                <p>&copy; {new Date().getFullYear()} SDP Solutions. All rights reserved.</p>
            </footer>
        </>
        // ⭐⭐⭐ </Router> 태그 제거 ⭐⭐⭐
    );
}

// ... styles 객체는 이전과 동일하게 유지됩니다 ...
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
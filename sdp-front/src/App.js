import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import OrderSearchPage from './pages/order/OrderSearchPage';
import OrderManagePage from './pages/order/OrderManagePage';
import Chatbot from './components/Chatbot';

// 페이지 가져오기
import JoinPage from './pages/JoinPage';
import LoginPage from './pages/LoginPage';
import MyPage from './pages/MyPage';
import FindPage from './pages/FindPage';
import NoticePage from './pages/NoticePage';
import ProductListPage from './pages/product/ProductListPage';
import ProductDetailPage from './pages/product/ProductDetailPage';

// 공통 레이아웃 스타일 (CSS 파일이 따로 없다면 아래 styles 객체를 참조합니다)
import './index.css';

function App() {
    // 1. 로그인 상태 관리
    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem('isAuthenticated') === 'true'
    );

    // 2. 사용자 이름 상태 관리
    const [memberName, setMemberName] = useState(localStorage.getItem('memberName') || '');

    // 3. 전체 메뉴 토글 상태 관리
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    // 상태 동기화
    useEffect(() => {
        localStorage.setItem('isAuthenticated', isAuthenticated);
        if(isAuthenticated) {
            setMemberName(localStorage.getItem('memberName'));
        }
    }, [isAuthenticated]);

    // 로그아웃 함수
    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.clear();
        setMemberName('');
        alert("정상적으로 로그아웃 되었습니다.");
        navigate('/');
    };

    // 전체 메뉴 열고 닫기
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <div style={styles.appWrapper}>
            {/* --- 헤더 (다크 테마 & 유리 효과) --- */}
            <header style={styles.header}>
                <div style={styles.container}>
                    {/* 왼쪽 로고 - ROOT STATION 스타일 */}
                    <NavLink to="/" style={styles.logo}>
                        ROOT STATION
                    </NavLink>

                    {/* 오른쪽 네비게이션 */}
                    <div style={styles.topNav}>
                        <NavLink
                            to="/"
                            style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
                        >
                            HOME
                        </NavLink>

                        <span style={styles.divider}>|</span>

                        {isAuthenticated ? (
                            <div style={styles.userSection}>
                                <span style={styles.userInfo}>
                                    <span style={{color: '#00d4ff'}}>●</span> {memberName}님
                                </span>
                                <button onClick={handleLogout} style={styles.textButton}>Logout</button>
                            </div>
                        ) : (
                            <>
                                <Link to="/members/login" style={styles.textLink}>로그인</Link>
                                <Link to="/members/join" style={styles.textLink}>회원가입</Link>
                            </>
                        )}

                        <span style={styles.divider}>|</span>

                        {/* 전체 메뉴 버튼 */}
                        <button onClick={toggleMenu} style={styles.menuButton}>
                            <span style={{marginRight: '5px'}}>☰</span> MENU
                        </button>
                    </div>
                </div>
            </header>

            {/* --- 전체 메뉴 오버레이 (다크 모드 커스텀) --- */}
            {isMenuOpen && (
                <div style={styles.fullMenuOverlay} onClick={toggleMenu}>
                    <div style={styles.fullMenuContainer} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.fullMenuHeader}>
                            <h2 style={styles.menuTitle}>ALL SERVICES</h2>
                            <button onClick={toggleMenu} style={styles.closeButton}>✕ CLOSE</button>
                        </div>

                        <div style={styles.menuGrid}>
                            <div style={styles.menuColumn}>
                                <h3 style={styles.columnTitle}>MEMBERSHIP</h3>
                                <Link style={styles.menuItem} to="/members/mypage" onClick={toggleMenu}>마이 페이지</Link>
                                <Link style={styles.menuItem} to="/members/find" onClick={toggleMenu}>계정 찾기</Link>
                                {!isAuthenticated && <Link style={styles.menuItem} to="/members/join" onClick={toggleMenu}>회원가입</Link>}
                            </div>
                            <div style={styles.menuColumn}>
                                <h3 style={styles.columnTitle}>SHOPPING</h3>
                                <Link style={styles.menuItem} to="/products" onClick={toggleMenu}>제품 목록 (AI 큐레이션)</Link>
                                <Link style={styles.menuItem} to="/track" onClick={toggleMenu}>주문/배송 조회</Link>
                                <span style={styles.disabledItem}>장바구니 (준비중)</span>
                            </div>
                            <div style={styles.menuColumn}>
                                <h3 style={styles.columnTitle}>SUPPORT</h3>
                                <Link style={styles.menuItem} to="/notices" onClick={toggleMenu}>공지사항</Link>
                                <Link style={styles.menuItem} to="#" onClick={toggleMenu}>자주 묻는 질문</Link>
                                <Link style={styles.menuItem} to="/admin" onClick={toggleMenu} style={{color: '#bb86fc'}}>관리자 모드</Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- 메인 콘텐츠 --- */}
            <main style={styles.mainContent}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/members/join" element={<JoinPage />} />
                    <Route path="/members/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
                    <Route path="/members/find" element={<FindPage />} />
                    <Route path="/members/mypage" element={<MyPage />} />
                    <Route path="/notices" element={<NoticePage />} />
                    <Route
                        path="/admin"
                        element={isAuthenticated ? <AdminPage /> : <AdminLoginPage setAuthenticated={setIsAuthenticated} />}
                    />
                    <Route path="/track" element={<OrderSearchPage />} />
                    <Route path="/admin/orders" element={<OrderManagePage />} />
                    <Route path="/products" element={<ProductListPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                </Routes>
            </main>

            <Chatbot />

            {/* --- 푸터 (다크 레이아웃) --- */}
            <footer style={styles.footer}>
                <div style={styles.footerContent}>
                    <p style={{marginBottom: '10px'}}>&copy; {new Date().getFullYear()} <span style={{color: 'white', fontWeight: 'bold'}}>ROOT STATION</span>. All rights reserved.</p>
                    <div style={styles.footerSubLinks}>
                        <span>이용약관</span> | <span>개인정보처리방침</span> | <span>사업자정보확인</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// --- 스타일 정의 (ROOT STATION 다크 테마) ---
const styles = {
    appWrapper: {
        backgroundColor: '#050505',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        backgroundColor: 'rgba(10, 10, 10, 0.8)',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #222',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(10px)',
    },
    container: {
        width: '90%',
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: {
        fontSize: '1.4rem',
        fontWeight: '900',
        color: 'white',
        textDecoration: 'none',
        letterSpacing: '-1px',
        background: 'linear-gradient(180deg, #fff 0%, #888 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    topNav: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
    },
    userSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    userInfo: {
        color: '#eee',
        fontSize: '0.9rem',
    },
    link: {
        color: '#999',
        textDecoration: 'none',
        fontSize: '0.9rem',
        fontWeight: '600',
        transition: '0.3s',
    },
    activeLink: {
        color: '#00d4ff',
        textDecoration: 'none',
        fontSize: '0.9rem',
        fontWeight: 'bold',
    },
    textLink: {
        color: '#999',
        textDecoration: 'none',
        fontSize: '0.9rem',
        cursor: 'pointer',
    },
    textButton: {
        background: 'none',
        border: '1px solid #333',
        borderRadius: '4px',
        color: '#888',
        cursor: 'pointer',
        fontSize: '0.8rem',
        padding: '4px 8px',
    },
    menuButton: {
        background: '#111',
        border: '1px solid #333',
        borderRadius: '6px',
        color: 'white',
        padding: '8px 15px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.85rem',
        transition: '0.3s',
    },
    divider: {
        color: '#222',
    },
    fullMenuOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
    },
    fullMenuContainer: {
        width: '100%',
        backgroundColor: '#0a0a0a',
        padding: '50px 0',
        borderBottom: '1px solid #222',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    },
    fullMenuHeader: {
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        padding: '0 20px',
    },
    menuTitle: {
        color: '#00d4ff',
        fontSize: '1.2rem',
        letterSpacing: '2px',
    },
    closeButton: {
        background: 'none',
        border: '1px solid #333',
        color: '#888',
        padding: '8px 15px',
        cursor: 'pointer',
        fontSize: '0.8rem',
    },
    menuGrid: {
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        padding: '0 20px',
    },
    menuColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    columnTitle: {
        color: 'white',
        fontSize: '1rem',
        marginBottom: '10px',
        borderLeft: '3px solid #00d4ff',
        paddingLeft: '10px',
    },
    menuItem: {
        color: '#999',
        textDecoration: 'none',
        fontSize: '0.95rem',
        transition: '0.3s',
    },
    disabledItem: {
        color: '#333',
        fontSize: '0.95rem',
        cursor: 'default',
    },
    mainContent: {
        flex: 1,
        paddingTop: '20px',
    },
    footer: {
        backgroundColor: '#050505',
        padding: '60px 20px',
        borderTop: '1px solid #111',
        marginTop: '100px',
    },
    footerContent: {
        textAlign: 'center',
        color: '#555',
        fontSize: '0.9rem',
    },
    footerSubLinks: {
        marginTop: '15px',
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        fontSize: '0.8rem',
    }
};

export default App;
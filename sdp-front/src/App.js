import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import OrderSearchPage from './pages/order/OrderSearchPage';
import OrderManagePage from './pages/order/OrderManagePage';
import Chatbot from './components/Chatbot';
import './index.css';

// 페이지 가져오기
import JoinPage from './pages/JoinPage';
import LoginPage from './pages/LoginPage';
import MyPage from './pages/MyPage';
import FindPage from './pages/FindPage';
import NoticePage from './pages/NoticePage'; // ✅ [추가] 공지사항 페이지 가져오기
import ProductListPage from './pages/product/ProductListPage';
import ProductDetailPage from './pages/product/ProductDetailPage';

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
        alert("로그아웃 되었습니다.");
        navigate('/');
    };

    // 전체 메뉴 열고 닫기
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <>
            {/* --- 헤더 (포털 사이트 스타일) --- */}
            <header style={styles.header}>
                <div style={styles.container}>
                    {/* 왼쪽 로고 */}
                    <NavLink to="/" style={styles.logo}>
                        SDP Solutions
                    </NavLink>

                    {/* 오른쪽 네비게이션 */}
                    <div style={styles.topNav}>

                        {/* 1. HOME 버튼 (로그인 왼쪽) */}
                        <NavLink
                            to="/"
                            style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
                        >
                            HOME
                        </NavLink>

                        <span style={styles.divider}>|</span>

                        {/* 2. 로그인 여부에 따른 표시 */}
                        {isAuthenticated ? (
                            <>
                                <span style={styles.userInfo}>
                                    👤 <strong>{memberName}</strong>님
                                </span>
                                <button onClick={handleLogout} style={styles.textButton}>
                                    LOGOUT
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/members/login" style={styles.textLink}>LOGIN</Link>
                                <Link to="/members/join" style={styles.textLink}>SIGN-UP</Link>
                            </>
                        )}

                        <span style={styles.divider}>|</span>

                        {/* 3. 전체 메뉴 버튼 */}
                        <button onClick={toggleMenu} style={styles.menuButton}>
                            ☰ 전체메뉴
                        </button>
                    </div>
                </div>
            </header>

            {/* --- 전체 메뉴 오버레이 (버튼 누르면 나타남) --- */}
            {isMenuOpen && (
                <div style={styles.fullMenuOverlay}>
                    <div style={styles.fullMenuContainer}>
                        <div style={styles.fullMenuHeader}>
                            <h2>전체 서비스</h2>
                            <button onClick={toggleMenu} style={styles.closeButton}>✖ 닫기</button>
                        </div>

                        {/* 메뉴 그리드 */}
                        <div style={styles.menuGrid}>
                            <div style={styles.menuColumn}>
                                <h3>회원 서비스</h3>
                                <Link to="/members/mypage" onClick={toggleMenu}>마이 페이지</Link>
                                <Link to="/members/find" onClick={toggleMenu}>아이디/비번 찾기</Link>
                                {!isAuthenticated && <Link to="/members/join" onClick={toggleMenu}>회원가입</Link>}
                            </div>
                            <div style={styles.menuColumn}>
                                <h3>주문/배송</h3>
                                <Link to="/track" onClick={toggleMenu}>배송 조회</Link>
                                <Link to="#" style={{color:'#aaa', cursor:'default'}}>장바구니 (준비중)</Link>
                                <Link to="#" style={{color:'#aaa', cursor:'default'}}>견적 요청 (준비중)</Link>
                            </div>
                            <div style={styles.menuColumn}>
                                <h3>고객 지원</h3>
                                {/* ⭐ [수정] 공지사항 클릭 시 페이지 이동 */}
                                <Link to="/notices" onClick={toggleMenu}>공지사항</Link>
                                <Link to="#" style={{color:'#aaa', cursor:'default'}}>자주 묻는 질문</Link>
                            </div>
                            <div style={styles.menuColumn}>
                                <h3>제품/주문</h3>
                                <Link to="/products" onClick={toggleMenu} style={{color: '#F97316', fontWeight: 'bold'}}>
                                    📦 제품 목록 (AI 추천)
                                </Link>
                                <Link to="/track" onClick={toggleMenu}>배송 조회</Link>
                                <Link to="#" style={{color:'#aaa', cursor:'default'}}>장바구니 (준비중)</Link>
                                <Link to="#" style={{color:'#aaa', cursor:'default'}}>견적 요청 (준비중)</Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- 메인 콘텐츠 --- */}
            <main style={{ minHeight: '80vh' }}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/members/join" element={<JoinPage />} />
                    <Route path="/members/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
                    <Route path="/members/find" element={<FindPage />} />
                    <Route path="/members/mypage" element={<MyPage />} />

                    {/* ✅ [추가] 공지사항 페이지 경로 연결 */}
                    <Route path="/notices" element={<NoticePage />} />

                    <Route
                        path="/admin"
                        element={isAuthenticated ? <AdminPage /> : <AdminLoginPage setAuthenticated={setIsAuthenticated} />}
                    />
                    <Route path="/track" element={<OrderSearchPage />} />
                    <Route path="/admin/orders" element={<OrderManagePage />} />
                    {/* ⭐ [NEW] 제품 페이지 경로 연결! */}
                    <Route path="/products" element={<ProductListPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
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

// --- 스타일 정의 ---
const styles = {
    header: {
        backgroundColor: '#111827',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '3px solid #F97316',
        position: 'relative',
        zIndex: 1000,
    },
    container: {
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: {
        fontSize: '1.5em',
        fontWeight: 'bold',
        color: '#F3F4F6',
        textDecoration: 'none',
        letterSpacing: '1px',
    },
    topNav: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '0.9em',
        color: 'white',
        gap: '15px',
    },
    userInfo: {
        marginRight: '5px',
        color: '#F3F4F6',
    },
    link: {
        color: '#D1D5DB',
        textDecoration: 'none',
        fontSize: '1em',
        fontWeight: '500',
        padding: '6px 12px',
        borderRadius: '5px',
        transition: 'all 0.3s',
    },
    activeLink: {
        color: '#FFFFFF',
        textDecoration: 'none',
        fontSize: '1em',
        fontWeight: 'bold',
        padding: '6px 12px',
        borderRadius: '5px',
        backgroundColor: '#F97316',
    },
    textLink: {
        color: '#D1D5DB',
        textDecoration: 'none',
        margin: '0 5px',
        cursor: 'pointer',
        fontSize: '0.95em',
    },
    textButton: {
        background: 'none',
        border: 'none',
        color: '#D1D5DB',
        cursor: 'pointer',
        fontSize: '0.95em',
        marginLeft: '5px',
    },
    menuButton: {
        background: 'none',
        border: '1px solid #6B7280',
        borderRadius: '4px',
        color: 'white',
        padding: '4px 10px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.9em',
    },
    divider: {
        color: '#4B5563',
        fontSize: '0.8em',
        margin: '0 5px',
    },
    fullMenuOverlay: {
        position: 'fixed',
        top: '63px',
        left: 0,
        width: '100%',
        height: 'calc(100vh - 63px)',
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 999,
        display: 'flex',
        justifyContent: 'center',
    },
    fullMenuContainer: {
        width: '100%',
        backgroundColor: 'white',
        padding: '30px',
        height: '350px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        color: '#333',
    },
    fullMenuHeader: {
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #111827',
        paddingBottom: '15px',
        marginBottom: '20px',
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '1.2em',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    menuGrid: {
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        gap: '80px',
    },
    menuColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    footer: {
        textAlign: 'center',
        padding: '30px',
        backgroundColor: '#111827',
        color: '#9CA3AF',
        marginTop: '50px',
        borderTop: '1px solid #374151',
    },
};

export default App;
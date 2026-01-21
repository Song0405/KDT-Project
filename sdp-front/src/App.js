import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import OrderSearchPage from './pages/order/OrderSearchPage';
import OrderManagePage from './pages/order/OrderManagePage';
import Chatbot from './components/Chatbot';
import JoinPage from './pages/JoinPage';
import LoginPage from './pages/LoginPage';
import MyPage from './pages/MyPage';
import FindPage from './pages/FindPage';
import NoticePage from './pages/NoticePage';
import ProductListPage from './pages/product/ProductListPage';
import ProductDetailPage from './pages/product/ProductDetailPage';
import CartPage from "./pages/CartPage";
import ContactPage from './pages/ContactPage';
import ChangeInfoPage from './pages/ChangeInfoPage';

// ✨ [1] 시뮬레이터 대신 추천 배치 쇼케이스 페이지 임포트
import LayoutShowcase from './pages/LayoutShowcase';

import './index.css';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem('isAuthenticated') === 'true';
    });

    const [memberName, setMemberName] = useState(() => {
        return localStorage.getItem('memberName') || '';
    });

    const [products, setProducts] = useState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    // 상태 동기화 및 제품 데이터 로드
    useEffect(() => {
        if (isAuthenticated) {
            localStorage.setItem('isAuthenticated', 'true');
            setMemberName(localStorage.getItem('memberName'));
        } else {
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('memberName');
            setMemberName('');
        }

        const fetchProducts = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/products');
                setProducts(res.data);
            } catch (err) {
                console.error("제품 목록 로드 실패:", err);
            }
        };
        fetchProducts();
    }, [isAuthenticated]);

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.clear();
        alert("정상적으로 로그아웃 되었습니다.");
        navigate('/');
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // 관리자 접근 권한 체크 컴포넌트
    const ProtectedAdminRoute = ({ children }) => {
        if (!isAuthenticated || !memberName) {
            return <AdminLoginPage setAuthenticated={setIsAuthenticated} />;
        }
        if (memberName !== '관리자') {
            return <AccessDenied />;
        }
        return children;
    };

    return (
        <div style={styles.appWrapper}>
            <header style={styles.header}>
                <div style={styles.container}>
                    <NavLink to="/" style={styles.logo}>ROOT STATION</NavLink>

                    <div style={styles.topNav}>
                        <NavLink to="/" style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>HOME</NavLink>
                        <span style={styles.divider}>|</span>

                        {isAuthenticated ? (
                            <div style={styles.userSection}>
                                <span style={styles.userInfo}>
                                    <span style={{color: memberName === '관리자' ? '#00d4ff' : '#999'}}>●</span> {memberName}님
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
                        <button onClick={toggleMenu} style={styles.menuButton}>☰ MENU</button>
                    </div>
                </div>
            </header>

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
                                <Link style={styles.menuItem} to="/members/edit" onClick={toggleMenu}>정보 수정</Link>
                            </div>
                            <div style={styles.menuColumn}>
                                <h3 style={styles.columnTitle}>SHOPPING</h3>
                                <Link style={styles.menuItem} to="/products" onClick={toggleMenu}>제품 목록</Link>

                                {/* ✨ [2] 메뉴 링크 수정: 시뮬레이터 제거 -> 추천 배치 쇼케이스 */}
                                <Link style={{...styles.menuItem, color: '#00d4ff', fontWeight: 'bold'}} to="/layouts" onClick={toggleMenu}>
                                    추천 배치 (SHOWCASE)
                                </Link>

                                <Link style={styles.menuItem} to="/track" onClick={toggleMenu}>주문/배송 조회</Link>
                                <Link style={styles.menuItem} to="/cart" onClick={toggleMenu}>장바구니 (CART)</Link>
                            </div>
                            <div style={styles.menuColumn}>
                                <h3 style={styles.columnTitle}>SUPPORT</h3>
                                <Link style={styles.menuItem} to="/notices" onClick={toggleMenu}>공지사항</Link>
                                <Link style={styles.menuItem} to="/contact" onClick={toggleMenu}>1:1 문의하기</Link>
                                <Link style={{...styles.menuItem, color: '#bb86fc'}} to="/admin" onClick={toggleMenu}>관리자 모드</Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <main style={styles.mainContent}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/members/join" element={<JoinPage />} />
                    <Route path="/members/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
                    <Route path="/members/find" element={<FindPage />} />
                    <Route path="/members/mypage" element={<MyPage />} />
                    <Route path="/notices" element={<NoticePage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/track" element={<OrderSearchPage />} />
                    <Route path="/products" element={<ProductListPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/members/edit" element={<ChangeInfoPage />} />

                    {/* ✨ [3] 시뮬레이터 라우트 제거 및 추천 배치 쇼케이스 라우트 연결 */}
                    <Route path="/layouts" element={<LayoutShowcase />} />

                    <Route path="/admin" element={
                        <ProtectedAdminRoute>
                            <AdminPage />
                        </ProtectedAdminRoute>
                    } />
                    <Route path="/admin/orders" element={
                        <ProtectedAdminRoute>
                            <OrderManagePage />
                        </ProtectedAdminRoute>
                    } />
                </Routes>
            </main>
            <Chatbot />
            <footer style={styles.footer}>
                <div style={styles.footerContent}>
                    <p>&copy; {new Date().getFullYear()} <span style={{color: 'white', fontWeight: 'bold'}}>ROOT STATION</span>. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

function AccessDenied() {
    const navigate = useNavigate();
    const hasAlerted = useRef(false);

    useEffect(() => {
        if (!hasAlerted.current) {
            hasAlerted.current = true;
            alert("⛔ 관리자만 접근할 수 있는 페이지입니다.");
            navigate('/', { replace: true });
        }
    }, [navigate]);

    return null;
}

const styles = {
    appWrapper: { backgroundColor: '#050505', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    header: { backgroundColor: 'rgba(10, 10, 10, 0.8)', height: '70px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #222', position: 'sticky', top: 0, zIndex: 1000, backdropFilter: 'blur(10px)' },
    container: { width: '90%', maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logo: { fontSize: '1.4rem', fontWeight: '900', color: 'white', textDecoration: 'none', letterSpacing: '-1px', background: 'linear-gradient(180deg, #fff 0%, #888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    topNav: { display: 'flex', alignItems: 'center', gap: '20px' },
    userSection: { display: 'flex', alignItems: 'center', gap: '10px' },
    userInfo: { color: '#eee', fontSize: '0.9rem' },
    link: { color: '#999', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', transition: '0.3s' },
    activeLink: { color: '#00d4ff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' },
    textLink: { color: '#999', textDecoration: 'none', fontSize: '0.9rem', cursor: 'pointer' },
    textButton: { background: 'none', border: '1px solid #333', borderRadius: '4px', color: '#888', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 8px' },
    menuButton: { background: '#111', border: '1px solid #333', borderRadius: '6px', color: 'white', padding: '8px 15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', transition: '0.3s' },
    divider: { color: '#222' },
    fullMenuOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', flexDirection: 'column' },
    fullMenuContainer: { width: '100%', backgroundColor: '#0a0a0a', padding: '50px 0', borderBottom: '1px solid #222', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' },
    fullMenuHeader: { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', padding: '0 20px' },
    menuTitle: { color: '#00d4ff', fontSize: '1.2rem', letterSpacing: '2px' },
    closeButton: { background: 'none', border: '1px solid #333', color: '#888', padding: '8px 15px', cursor: 'pointer', fontSize: '0.8rem' },
    menuGrid: { maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '0 20px' },
    menuColumn: { display: 'flex', flexDirection: 'column', gap: '15px' },
    columnTitle: { color: 'white', fontSize: '1rem', marginBottom: '10px', borderLeft: '3px solid #00d4ff', paddingLeft: '10px' },
    menuItem: { color: '#999', textDecoration: 'none', fontSize: '0.95rem', transition: '0.3s' },
    mainContent: { flex: 1, paddingTop: '20px' },
    footer: { backgroundColor: '#050505', padding: '60px 20px', borderTop: '1px solid #111', marginTop: '100px' },
    footerContent: { textAlign: 'center', color: '#555', fontSize: '0.9rem' }
};

export default App;
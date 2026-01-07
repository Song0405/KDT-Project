import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import OrderSearchPage from './pages/order/OrderSearchPage';
import OrderManagePage from './pages/order/OrderManagePage';
import Chatbot from './components/Chatbot';
import './index.css';
import './App.css';

// 페이지 가져오기
import JoinPage from './pages/JoinPage';
import LoginPage from './pages/LoginPage';
import MyPage from './pages/MyPage';
import FindPage from './pages/FindPage';

function App() {
    // 1. 로그인 상태 관리
    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem('isAuthenticated') === 'true'
    );

    // ⭐ 2. 사용자 이름 상태 관리
    const [memberName, setMemberName] = useState(localStorage.getItem('memberName') || '');

    // ⭐ 3. 전체 메뉴 토글 상태 관리
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navigate = useNavigate();

    // 상태 동기화
    useEffect(() => {
        localStorage.setItem('isAuthenticated', isAuthenticated);
        // 로그인 상태가 되면 이름도 다시 읽어오기
        if(isAuthenticated) {
            setMemberName(localStorage.getItem('memberName'));
        }
    }, [isAuthenticated]);

    // 로그아웃 함수
    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.clear(); // 싹 다 지우기
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
            <header className="header">
                <div className="container">
                    {/* 왼쪽 로고 */}
                    <NavLink to="/" className="logo">
                        SDP Solutions
                    </NavLink>

                    {/* 오른쪽 네비게이션 */}
                    <div className="topNav">
                        {/* 1. 로그인 여부에 따른 표시 */}
                        {isAuthenticated ? (
                            <>
                                <span className="userInfo">
                                    👤 <strong>{memberName}</strong>님 환영합니다
                                </span>
                                <span className="divider">|</span>
                                <button onClick={handleLogout} className="textButton">
                                    LOGOUT
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/members/login" className="textLink">LOGIN</Link>
                            </>
                        )}

                        {/* 2. 전체 메뉴 버튼 (항상 보임) */}
                        <span className="divider">|</span>
                        <button onClick={toggleMenu} className="menuButton">
                            ☰ 전체메뉴
                        </button>
                    </div>
                </div>
            </header>

            {/* --- 전체 메뉴 오버레이 (버튼 누르면 나타남) --- */}
            {isMenuOpen && (
                <div className="fullMenuOverlay">
                    <div className="fullMenuContainer">
                        <div className="fullMenuHeader">
                            <h2>전체 서비스</h2>
                            <button onClick={toggleMenu} className="closeButton">✖ 닫기</button>
                        </div>

                        {/* 메뉴 그리드 */}
                        <div className="menuGrid">
                            <div className="menuColumn">
                                <h3>회원 서비스</h3>
                                <Link to="/members/mypage" onClick={toggleMenu}>마이 페이지 (정보수정)</Link>
                                <Link to="/members/find" onClick={toggleMenu}>아이디/비번 찾기</Link>
                                <Link to="/members/join" onClick={toggleMenu}>회원가입</Link>
                            </div>
                            <div className="menuColumn">
                                <h3>주문/배송</h3>
                                <Link to="/track" onClick={toggleMenu}>배송 조회</Link>
                                <Link to="/" onClick={toggleMenu}>상품 목록</Link>
                                {/* 추후 추가될 기능들 미리보기 */}
                                <Link to="#" className="disabled-link">장바구니 (준비중)</Link>
                                <Link to="#" className="disabled-link">견적 요청 (준비중)</Link>
                            </div>
                            <div className="menuColumn">
                                <h3>고객 지원</h3>
                                <Link to="#" className="disabled-link">공지사항</Link>
                                <Link to="#" className="disabled-link">자주 묻는 질문</Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- 메인 콘텐츠 --- */}
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/members/join" element={<JoinPage />} />
                    <Route path="/members/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
                    <Route path="/members/find" element={<FindPage />} />
                    <Route path="/members/mypage" element={<MyPage />} />

                    {/* 관리자 및 주문 관련 라우트 유지 */}
                    <Route
                        path="/admin"
                        element={isAuthenticated ? <AdminPage /> : <AdminLoginPage setAuthenticated={setIsAuthenticated} />}
                    />
                    <Route path="/track" element={<OrderSearchPage />} />
                    <Route path="/admin/orders" element={<OrderManagePage />} />
                </Routes>
            </main>

            <Chatbot />

            {/* --- 푸터 --- */}
            <footer className="footer">
                <p>&copy; {new Date().getFullYear()} SDP Solutions. All rights reserved.</p>
            </footer>
        </>
    );
}


export default App;
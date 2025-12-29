// frontend/src/pages/AdminLoginPage.jsx

import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom'; // ⭐⭐⭐ 이제 useNavigate는 필요 없습니다 ⭐⭐⭐
import './AdminLoginPage.css';

function AdminLoginPage({ setAuthenticated }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    // const navigate = useNavigate(); // ⭐⭐⭐ 삭제 ⭐⭐⭐

    const ADMIN_PASSWORD = '1111';

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setAuthenticated(true); // App.jsx의 상태를 true로 변경하여 AdminPage가 렌더링되게 함
            // navigate('/admin'); // ⭐⭐⭐ 이제 리다이렉트할 필요가 없습니다. ⭐⭐⭐
            // App.jsx에서 이미 '/admin' 경로로 이 컴포넌트가 렌더링되고 있으므로,
            // setAuthenticated(true)만 하면 App.jsx가 AdminPage를 렌더링합니다.
        } else {
            setError('비밀번호가 올바르지 않습니다.');
            setPassword('');
        }
    };

    return (
        <div className="admin-login-container">
            <div className="login-box">
                <h2>관리자 로그인</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="password">비밀번호:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit">로그인</button>
                </form>
            </div>
        </div>
    );
}

export default AdminLoginPage;
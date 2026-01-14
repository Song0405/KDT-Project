import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css';

function LoginPage({ setIsAuthenticated }) {
    const [inputs, setInputs] = useState({ memberId: '', password: '' });
    const navigate = useNavigate();

    const handleChange = (e) => setInputs({ ...inputs, [e.target.name]: e.target.value });

    const handleLogin = async (e) => {
        e.preventDefault();
        if(!inputs.memberId || !inputs.password) {
            alert("아이디와 비밀번호를 모두 입력해주세요.");
            return;
        }
        try {
            const response = await fetch('http://localhost:8080/api/members/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inputs),
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("memberId", data.memberId);
                localStorage.setItem("memberType", data.type);
                localStorage.setItem("memberName", data.name);
                setIsAuthenticated(true);
                alert(`환영합니다, ${data.name}님!`);
                navigate('/');
            } else {
                alert("로그인에 실패했습니다. 아이디 또는 비밀번호를 확인해주세요.");
            }
        } catch (error) {
            alert("서버 연결에 실패했습니다. 관리자에게 문의하세요.");
        }
    };

    return (
        <div className="login-page-wrapper">
            <div className="login-container">
                <header className="login-header">
                    <h2 className="login-title">ROOT STATION</h2>
                    <p className="login-subtitle">당신의 워크스테이션에 접속하세요</p>
                </header>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label>ID</label>
                        <input
                            name="memberId"
                            placeholder="아이디 입력"
                            value={inputs.memberId}
                            onChange={handleChange}
                            className="login-input"
                        />
                    </div>
                    <div className="input-group">
                        <label>PASSWORD</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="비밀번호 입력"
                            value={inputs.password}
                            onChange={handleChange}
                            className="login-input"
                        />
                    </div>
                    <button type="submit" className="login-btn">ACCESS CORE</button>
                </form>

                <div className="login-footer">
                    <div className="footer-links">
                        <Link to="/members/find" className="login-link">계정 정보를 잊으셨나요?</Link>
                        <span className="divider">|</span>
                        <Link to="/members/join" className="login-link highlight">회원가입</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
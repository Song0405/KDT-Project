import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css';

function LoginPage({ setIsAuthenticated }) {
    const [inputs, setInputs] = useState({ memberId: '', password: '' });
    const navigate = useNavigate();

    const handleChange = (e) => setInputs({ ...inputs, [e.target.name]: e.target.value });

    const handleLogin = async (e) => {
        e.preventDefault();
        if(!inputs.memberId || !inputs.password) { alert("입력 필수"); return; }
        try {
            const response = await fetch('http://localhost:8080/api/members/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inputs),
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("memberId", data.memberId);
                localStorage.setItem("memberType", data.type);
                localStorage.setItem("memberName", data.name);
                setIsAuthenticated(true);
                alert(`환영합니다! ${data.name}님`);
                navigate('/');
            } else {
                alert("로그인 실패: " + await response.text());
            }
        } catch (error) { alert("서버 오류"); }
    };

    return (
        <div className="login-container">
            <h2 className="login-title">로그인</h2>
            <form onSubmit={handleLogin} className="login-form">
                <input name="memberId" placeholder="아이디" value={inputs.memberId} onChange={handleChange} className="login-input" />
                <input type="password" name="password" placeholder="비밀번호" value={inputs.password} onChange={handleChange} className="login-input" />
                <button type="submit" className="login-btn">로그인하기</button>
            </form>
            <div className="login-footer">
                <Link to="/members/find" className="login-link">아이디 / 비밀번호 찾기</Link>
            </div>
        </div>
    );
}

export default LoginPage;
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2'; // 🍬 예쁜 알림창
import '../pages/order/Order.css';

function LoginPage({ setIsAuthenticated }) {
    const navigate = useNavigate();
    const [inputId, setInputId] = useState('');
    const [inputPw, setInputPw] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!inputId || !inputPw) {
            Swal.fire({
                icon: 'warning',
                title: '입력 오류',
                text: '아이디와 비밀번호를 모두 입력해주세요.',
                background: '#333', color: '#fff', confirmButtonColor: '#00d4ff'
            });
            return;
        }

        try {
            const response = await axios.post('http://localhost:8080/api/members/login', {
                memberId: inputId,
                password: inputPw
            });

            if (response.status === 200) {
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('memberId', inputId);

                const serverName = response.data.name || response.data.memberName || inputId;
                localStorage.setItem('memberName', serverName);

                setIsAuthenticated(true);

                // 🎉 다크모드 로그인 성공 알림
                Swal.fire({
                    icon: 'success',
                    title: `환영합니다, ${serverName}님!`,
                    text: 'ROOT STATION 시스템에 접속하셨습니다.',
                    background: '#333', color: '#fff', confirmButtonColor: '#00d4ff',
                    timer: 2000, showConfirmButton: false
                }).then(() => {
                    navigate('/');
                });
            }
        } catch (error) {
            console.error("로그인 실패:", error);
            Swal.fire({
                icon: 'error',
                title: '로그인 실패',
                text: '아이디 또는 비밀번호를 확인해주세요.',
                background: '#333', color: '#fff', confirmButtonColor: '#ff4d4d'
            });
        }
    };

    return (
        <div className="order-manage-wrapper" style={{minHeight: '80vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <div style={{width: '100%', maxWidth: '400px', background: '#111', padding: '40px', borderRadius: '12px', border: '1px solid #333', boxShadow: '0 0 20px rgba(0,0,0,0.5)'}}>
                <h2 style={{color: 'white', marginBottom: '30px', textAlign: 'center', letterSpacing: '2px'}}>LOGIN</h2>

                <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                    <input type="text" placeholder="ID" value={inputId} onChange={(e) => setInputId(e.target.value)} style={inputStyle} />
                    <input type="password" placeholder="PASSWORD" value={inputPw} onChange={(e) => setInputPw(e.target.value)} style={inputStyle} />
                    <button type="submit" style={loginBtnStyle}>ACCESS SYSTEM</button>
                </form>

                <div style={{marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#666'}}>
                    <Link to="/members/find" style={{color: '#888', textDecoration:'none', marginRight:'15px'}}>아이디/비밀번호 찾기</Link>
                    <Link to="/members/join" style={{color: '#00d4ff', textDecoration:'none'}}>회원가입</Link>
                </div>
            </div>
        </div>
    );
}

const inputStyle = {
    padding: '15px', background: '#000', border: '1px solid #333',
    color: 'white', borderRadius: '4px', outline: 'none', fontSize: '1rem'
};

const loginBtnStyle = {
    padding: '15px', background: '#00d4ff', border: 'none',
    color: 'black', borderRadius: '4px', cursor: 'pointer',
    fontWeight: 'bold', fontSize: '1rem', marginTop: '10px'
};

export default LoginPage;
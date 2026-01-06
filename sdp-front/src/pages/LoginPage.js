import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // ✅ [수정] Link 추가

function LoginPage({ setIsAuthenticated }) {
    const [inputs, setInputs] = useState({
        memberId: '',
        password: ''
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        setInputs({ ...inputs, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if(!inputs.memberId || !inputs.password) {
            alert("아이디와 비밀번호를 입력해주세요.");
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

                // 1. 정보 저장
                localStorage.setItem("memberId", data.memberId);
                localStorage.setItem("memberType", data.type);

                // 2. 상태 업데이트
                setIsAuthenticated(true);

                // 3. 이동
                alert(`환영합니다! ${data.name}님`);
                navigate('/');

            } else {
                const errorText = await response.text();
                alert("로그인 실패: " + errorText);
            }
        } catch (error) {
            console.error(error);
            alert("서버 연결 오류");
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#111827' }}>로그인</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                    name="memberId"
                    placeholder="아이디"
                    value={inputs.memberId}
                    onChange={handleChange}
                    style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '5px' }}
                />
                <input
                    type="password"
                    name="password"
                    placeholder="비밀번호"
                    value={inputs.password}
                    onChange={handleChange}
                    style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '5px' }}
                />
                <button
                    type="submit"
                    style={{ padding: '12px', background: '#F97316', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                >
                    로그인하기
                </button>
            </form>

            {/* ✅ [추가] 계정 찾기 링크 */}
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <Link to="/members/find" style={{ color: '#6B7280', fontSize: '0.9em', textDecoration: 'none' }}>
                    아이디 / 비밀번호 찾기
                </Link>
            </div>
        </div>
    );
}

export default LoginPage;
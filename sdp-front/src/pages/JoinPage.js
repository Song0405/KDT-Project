import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function JoinPage() {
    const [formData, setFormData] = useState({
        memberId: '',
        password: '',
        name: '',
        phoneNumber: '',
        email: '',
        ssn: '',
        businessNumber: '',
        type: 'individual'
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.memberId || !formData.password || !formData.name) {
            alert("아이디, 비밀번호, 이름은 필수입니다!");
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/members/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                alert("🎉 회원가입 성공! 로그인 해주세요.");
                navigate('/members/login'); // 가입 후 로그인 페이지로 이동
            } else {
                const errorMsg = await response.text();
                alert("회원가입 실패: " + errorMsg);
            }
        } catch (error) {
            alert("서버 연결 실패");
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '50px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '10px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>회원가입</h2>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                    <label style={{ marginRight: '15px' }}>
                        <input
                            type="radio" name="type" value="individual"
                            checked={formData.type === 'individual'} onChange={handleChange}
                        /> 개인회원
                    </label>
                    <label>
                        <input
                            type="radio" name="type" value="company"
                            checked={formData.type === 'company'} onChange={handleChange}
                        /> 기업회원
                    </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="text" name="memberId" placeholder="아이디" onChange={handleChange} required style={{ padding: '10px' }} />
                    <input type="password" name="password" placeholder="비밀번호" onChange={handleChange} required style={{ padding: '10px' }} />
                    <input type="text" name="name" placeholder="이름 (또는 대표자명)" onChange={handleChange} required style={{ padding: '10px' }} />
                    <input type="text" name="phoneNumber" placeholder="전화번호" onChange={handleChange} style={{ padding: '10px' }} />
                    <input type="email" name="email" placeholder="이메일" onChange={handleChange} style={{ padding: '10px' }} />

                    {formData.type === 'individual' ? (
                        <input type="text" name="ssn" placeholder="주민번호 (개인)" onChange={handleChange} style={{ padding: '10px' }} />
                    ) : (
                        <input type="text" name="businessNumber" placeholder="사업자번호 (기업)" onChange={handleChange} style={{ padding: '10px' }} />
                    )}
                </div>

                <button type="submit" style={{ width: '100%', padding: '15px', marginTop: '20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    가입하기
                </button>
            </form>
        </div>
    );
}

export default JoinPage;
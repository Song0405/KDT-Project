import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './FindPage.css';

function FindPage() {
    const [mode, setMode] = useState('id');
    const [resultMsg, setResultMsg] = useState('');
    const [inputs, setInputs] = useState({ memberId: '', name: '', phoneNumber: '', newPassword: '' });
    const [email, setEmail] = useState('');
    const [authCode, setAuthCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const handleChange = (e) => setInputs({ ...inputs, [e.target.name]: e.target.value });

    // ... (handleSendCode, handleVerifyCode, handleFindId, handleResetPw 함수 내용은 기존과 동일)
    const handleSendCode = async () => {
        if (!email) { alert("이메일을 입력해주세요."); return; }
        try {
            const response = await fetch(`http://localhost:8080/api/members/send-verification-code?email=${email}`, { method: 'POST' });
            if (response.ok) alert("인증번호가 발송되었습니다!");
            else alert("메일 전송 실패: " + await response.text());
        } catch (err) { alert("서버 오류"); }
    };
    const handleVerifyCode = async () => {
        if (!authCode) { alert("인증번호를 입력해주세요."); return; }
        try {
            const response = await fetch(`http://localhost:8080/api/members/verify-code?email=${email}&code=${authCode}`, { method: 'POST' });
            if (response.ok) { alert("인증 성공!"); setIsVerified(true); }
            else { alert("인증번호 불일치"); setIsVerified(false); }
        } catch (err) { alert("서버 오류"); }
    };
    const handleFindId = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/members/find-id', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: inputs.name, phoneNumber: inputs.phoneNumber })
            });
            if (response.ok) {
                const foundId = await response.text();
                setResultMsg(`회원님의 아이디는 [ ${foundId} ] 입니다.`);
            } else setResultMsg(await response.text());
        } catch (err) { alert("서버 오류"); }
    };
    const handleResetPw = async () => {
        if (!isVerified) { alert("이메일 인증 필수!"); return; }
        if (!inputs.newPassword) { alert("새 비밀번호 입력 필수"); return; }
        try {
            const response = await fetch('http://localhost:8080/api/members/reset-pw', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inputs)
            });
            if (response.ok) {
                alert("비밀번호 변경 완료! 로그인 해주세요.");
                window.location.href = "/members/login";
            } else alert(await response.text());
        } catch (err) { alert("서버 오류"); }
    };

    return (
        <div className="find-container">
            <h2 className="find-title">계정 찾기</h2>

            <div className="find-tabs">
                <div
                    onClick={() => { setMode('id'); setResultMsg(''); }}
                    className={`find-tab ${mode === 'id' ? 'active' : ''}`}
                >
                    아이디 찾기
                </div>
                <div
                    onClick={() => { setMode('pw'); setResultMsg(''); }}
                    className={`find-tab ${mode === 'pw' ? 'active' : ''}`}
                >
                    비밀번호 재설정
                </div>
            </div>

            <div className="find-form">
                {mode === 'pw' && (
                    <input name="memberId" placeholder="아이디" onChange={handleChange} className="find-input" />
                )}
                <input name="name" placeholder="이름" onChange={handleChange} className="find-input" />
                <input name="phoneNumber" placeholder="전화번호" onChange={handleChange} className="find-input" />

                {mode === 'pw' && (
                    <div className="verify-box">
                        <p style={{margin: '0 0 5px 0', fontSize: '12px', color: '#666'}}>본인 확인을 위한 이메일 인증</p>
                        <div className="verify-row">
                            <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} style={{flex:1, padding:'8px'}} disabled={isVerified} />
                            <button onClick={handleSendCode} disabled={isVerified} className="verify-btn">인증번호 받기</button>
                        </div>
                        <div className="verify-row">
                            <input placeholder="인증번호" value={authCode} onChange={(e) => setAuthCode(e.target.value)} style={{flex:1, padding:'8px'}} disabled={isVerified} />
                            <button onClick={handleVerifyCode} disabled={isVerified} className={`verify-btn ${isVerified ? 'success' : ''}`}>
                                {isVerified ? "인증완료" : "확인"}
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'pw' && (
                    <input type="password" name="newPassword" placeholder="새 비밀번호" onChange={handleChange} className="find-input" />
                )}

                <button
                    onClick={mode === 'id' ? handleFindId : handleResetPw}
                    disabled={mode === 'pw' && !isVerified}
                    className="find-action-btn"
                >
                    {mode === 'id' ? '아이디 찾기' : '비밀번호 변경하기'}
                </button>
            </div>

            {resultMsg && <div className="find-result">{resultMsg}</div>}

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <Link to="/members/login" style={{ color: '#666', fontSize: '0.9em', textDecoration:'none' }}>로그인으로 돌아가기</Link>
            </div>
        </div>
    );
}

export default FindPage;
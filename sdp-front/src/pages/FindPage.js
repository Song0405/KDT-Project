import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './FindPage.css';

function FindPage() {
    const [mode, setMode] = useState('id'); // 'id' 또는 'pw'
    const [resultMsg, setResultMsg] = useState('');
    const [inputs, setInputs] = useState({ memberId: '', name: '', phoneNumber: '', newPassword: '' });
    const [email, setEmail] = useState('');
    const [authCode, setAuthCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const handleChange = (e) => setInputs({ ...inputs, [e.target.name]: e.target.value });

    // --- API 통신 함수들 ---
    const handleSendCode = async () => {
        if (!email) { alert("이메일을 입력해주세요."); return; }
        try {
            const response = await fetch(`http://localhost:8080/api/members/send-verification-code?email=${email}`, { method: 'POST' });
            if (response.ok) alert("✅ 인증번호가 발송되었습니다!");
            else alert("메일 전송 실패: " + await response.text());
        } catch (err) { alert("서버 오류가 발생했습니다."); }
    };

    const handleVerifyCode = async () => {
        if (!authCode) { alert("인증번호를 입력해주세요."); return; }
        try {
            const response = await fetch(`http://localhost:8080/api/members/verify-code?email=${email}&code=${authCode}`, { method: 'POST' });
            if (response.ok) { alert("✅ 인증 성공!"); setIsVerified(true); }
            else { alert("❌ 인증번호가 일치하지 않습니다."); setIsVerified(false); }
        } catch (err) { alert("서버 오류가 발생했습니다."); }
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
        } catch (err) { alert("서버 오류가 발생했습니다."); }
    };

    const handleResetPw = async () => {
        if (!isVerified) { alert("이메일 인증이 필요합니다."); return; }
        if (!inputs.newPassword) { alert("새로운 비밀번호를 입력해주세요."); return; }
        try {
            const response = await fetch('http://localhost:8080/api/members/reset-pw', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inputs)
            });
            if (response.ok) {
                alert("✅ 비밀번호 변경 완료! 새로운 비밀번호로 로그인해주세요.");
                window.location.href = "/members/login";
            } else alert(await response.text());
        } catch (err) { alert("서버 오류가 발생했습니다."); }
    };

    return (
        <div className="find-page-wrapper">
            <div className="find-container">
                <h2 className="find-title">계정 찾기</h2>
                <p className="find-subtitle">ROOT STATION 서비스 이용을 위해 본인 확인이 필요합니다.</p>

                {/* 탭 메뉴 */}
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
                        <div className="input-group">
                            <label>아이디</label>
                            <input name="memberId" placeholder="가입하신 아이디 입력" onChange={handleChange} className="find-input" />
                        </div>
                    )}
                    <div className="input-group">
                        <label>이름</label>
                        <input name="name" placeholder="실명 입력" onChange={handleChange} className="find-input" />
                    </div>
                    <div className="input-group">
                        <label>전화번호</label>
                        <input name="phoneNumber" placeholder="'-' 제외 숫자만 입력" onChange={handleChange} className="find-input" />
                    </div>

                    {/* 비밀번호 모드일 때만 보이는 이메일 인증 섹션 */}
                    {mode === 'pw' && (
                        <div className="verify-section">
                            <label className="verify-label">이메일 본인 인증</label>
                            <div className="verify-row">
                                <input type="email" placeholder="이메일 주소" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isVerified} className="find-input" />
                                <button onClick={handleSendCode} disabled={isVerified} className="verify-action-btn">인증요청</button>
                            </div>
                            <div className="verify-row">
                                <input placeholder="인증번호 6자리" value={authCode} onChange={(e) => setAuthCode(e.target.value)} disabled={isVerified} className="find-input" />
                                <button onClick={handleVerifyCode} disabled={isVerified} className={`verify-action-btn ${isVerified ? 'success' : ''}`}>
                                    {isVerified ? "인증완료" : "확인"}
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'pw' && (
                        <div className="input-group">
                            <label>새 비밀번호</label>
                            <input type="password" name="newPassword" placeholder="8자리 이상 영문/숫자 조합" onChange={handleChange} className="find-input" />
                        </div>
                    )}

                    <button
                        onClick={mode === 'id' ? handleFindId : handleResetPw}
                        disabled={mode === 'pw' && !isVerified}
                        className="find-main-btn"
                    >
                        {mode === 'id' ? '아이디 찾기' : '비밀번호 변경하기'}
                    </button>
                </div>

                {resultMsg && (
                    <div className="find-result-box">
                        <span className="result-icon">ℹ️</span> {resultMsg}
                    </div>
                )}

                <div className="find-footer">
                    <Link to="/members/login" className="back-link">← 로그인 페이지로 돌아가기</Link>
                </div>
            </div>
        </div>
    );
}

export default FindPage;
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2'; // 🍬 추가
import './FindPage.css';

function FindPage() {
    const [mode, setMode] = useState('id');
    const [resultMsg, setResultMsg] = useState('');
    const [inputs, setInputs] = useState({ memberId: '', name: '', phoneNumber: '', newPassword: '' });
    const [email, setEmail] = useState('');
    const [authCode, setAuthCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const handleChange = (e) => setInputs({ ...inputs, [e.target.name]: e.target.value });

    // --- API 통신 함수들 ---
    const handleSendCode = async () => {
        if (!email) { Swal.fire({ icon:'warning', title:'이메일 필요', text:'이메일을 입력해주세요.', background:'#333', color:'#fff' }); return; }
        try {
            const response = await fetch(`http://localhost:8080/api/members/send-verification-code?email=${email}`, { method: 'POST' });
            if (response.ok) Swal.fire({ icon:'success', title:'전송 완료', text:'인증번호가 메일로 발송되었습니다.', background:'#333', color:'#fff', confirmButtonColor:'#00d4ff' });
            else Swal.fire({ icon:'error', title:'전송 실패', text: await response.text(), background:'#333', color:'#fff' });
        } catch (err) { Swal.fire({ icon:'error', title:'오류', text:'서버 오류가 발생했습니다.', background:'#333', color:'#fff' }); }
    };

    const handleVerifyCode = async () => {
        if (!authCode) { Swal.fire({ icon:'warning', title:'인증번호 필요', text:'인증번호를 입력해주세요.', background:'#333', color:'#fff' }); return; }
        try {
            const response = await fetch(`http://localhost:8080/api/members/verify-code?email=${email}&code=${authCode}`, { method: 'POST' });
            if (response.ok) { Swal.fire({ icon:'success', title:'인증 성공!', background:'#333', color:'#fff', confirmButtonColor:'#00d4ff' }); setIsVerified(true); }
            else { Swal.fire({ icon:'error', title:'인증 실패', text:'인증번호가 일치하지 않습니다.', background:'#333', color:'#fff' }); setIsVerified(false); }
        } catch (err) { Swal.fire({ icon:'error', title:'오류', text:'서버 오류가 발생했습니다.', background:'#333', color:'#fff' }); }
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
                Swal.fire({ icon: 'info', title: '아이디 찾기 성공', text: `회원님의 아이디는 ${foundId} 입니다.`, background: '#333', color: '#fff' });
            } else Swal.fire({ icon: 'error', title: '찾기 실패', text: await response.text(), background: '#333', color: '#fff' });
        } catch (err) { Swal.fire({ icon: 'error', title: '오류', text: '서버 오류가 발생했습니다.', background: '#333', color: '#fff' }); }
    };

    const handleResetPw = async () => {
        if (!isVerified) { Swal.fire({ icon:'warning', title:'인증 필요', text:'이메일 인증을 먼저 완료해주세요.', background:'#333', color:'#fff' }); return; }
        if (!inputs.newPassword) { Swal.fire({ icon:'warning', title:'입력 필요', text:'새로운 비밀번호를 입력해주세요.', background:'#333', color:'#fff' }); return; }
        try {
            const response = await fetch('http://localhost:8080/api/members/reset-pw', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inputs)
            });
            if (response.ok) {
                Swal.fire({ icon: 'success', title: '비밀번호 변경 완료', text: '새로운 비밀번호로 로그인해주세요.', background: '#333', color: '#fff', confirmButtonColor: '#00d4ff' })
                    .then(() => window.location.href = "/members/login");
            } else Swal.fire({ icon: 'error', title: '변경 실패', text: await response.text(), background: '#333', color: '#fff' });
        } catch (err) { Swal.fire({ icon: 'error', title: '오류', text: '서버 오류가 발생했습니다.', background: '#333', color: '#fff' }); }
    };

    return (
        <div className="find-page-wrapper">
            <div className="find-container">
                <h2 className="find-title">계정 찾기</h2>
                <p className="find-subtitle">ROOT STATION 서비스 이용을 위해 본인 확인이 필요합니다.</p>

                <div className="find-tabs">
                    <div onClick={() => { setMode('id'); setResultMsg(''); }} className={`find-tab ${mode === 'id' ? 'active' : ''}`}>아이디 찾기</div>
                    <div onClick={() => { setMode('pw'); setResultMsg(''); }} className={`find-tab ${mode === 'pw' ? 'active' : ''}`}>비밀번호 재설정</div>
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

                {resultMsg && <div className="find-result-box"><span className="result-icon">ℹ️</span> {resultMsg}</div>}
                <div className="find-footer"><Link to="/members/login" className="back-link">← 로그인 페이지로 돌아가기</Link></div>
            </div>
        </div>
    );
}

export default FindPage;
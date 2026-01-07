import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function FindPage() {
    const [mode, setMode] = useState('id'); // 'id' 또는 'pw'
    const [resultMsg, setResultMsg] = useState('');

    // 기존 입력값 (아이디, 이름, 전화번호, 새 비번)
    const [inputs, setInputs] = useState({
        memberId: '',
        name: '',
        phoneNumber: '',
        newPassword: ''
    });

    // ⭐ [추가됨] 이메일 인증 관련 상태
    const [email, setEmail] = useState('');        // 이메일 입력값
    const [authCode, setAuthCode] = useState('');  // 인증번호 입력값
    const [isVerified, setIsVerified] = useState(false); // 인증 성공 여부 (true면 통과)

    const handleChange = (e) => {
        setInputs({ ...inputs, [e.target.name]: e.target.value });
    };

    // -----------------------------------------------------------
    // ⭐ [추가됨] 1. 인증번호 발송 요청
    // -----------------------------------------------------------
    const handleSendCode = async () => {
        if (!email) {
            alert("이메일을 입력해주세요.");
            return;
        }
        try {
            // 백엔드: @RequestParam String email 받음
            const response = await fetch(`http://localhost:8080/api/members/send-verification-code?email=${email}`, {
                method: 'POST'
            });

            if (response.ok) {
                alert("인증번호가 발송되었습니다! 메일함을 확인해주세요.");
            } else {
                alert("메일 전송 실패: " + await response.text());
            }
        } catch (err) {
            alert("서버 오류가 발생했습니다.");
        }
    };

    // -----------------------------------------------------------
    // ⭐ [추가됨] 2. 인증번호 확인 요청
    // -----------------------------------------------------------
    const handleVerifyCode = async () => {
        if (!authCode) {
            alert("인증번호를 입력해주세요.");
            return;
        }
        try {
            // 백엔드: @RequestParam String email, @RequestParam String code 받음
            const response = await fetch(`http://localhost:8080/api/members/verify-code?email=${email}&code=${authCode}`, {
                method: 'POST'
            });

            if (response.ok) {
                alert("인증에 성공했습니다! 이제 비밀번호를 변경할 수 있습니다.");
                setIsVerified(true); // ⭐ 인증 성공 도장 쾅!
            } else {
                alert("인증번호가 일치하지 않습니다.");
                setIsVerified(false);
            }
        } catch (err) {
            alert("서버 오류가 발생했습니다.");
        }
    };

    // 기존: 아이디 찾기 요청
    const handleFindId = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/members/find-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: inputs.name, phoneNumber: inputs.phoneNumber })
            });

            if (response.ok) {
                const foundId = await response.text();
                setResultMsg(`회원님의 아이디는 [ ${foundId} ] 입니다.`);
            } else {
                setResultMsg(await response.text());
            }
        } catch (err) {
            alert("서버 오류");
        }
    };

    // 기존: 비밀번호 재설정 요청 (수정됨: 인증 여부 체크 추가)
    const handleResetPw = async () => {
        // 1. 이메일 인증 확인
        if (!isVerified) {
            alert("먼저 이메일 인증을 완료해주세요!");
            return;
        }

        if (!inputs.newPassword) {
            alert("새 비밀번호를 입력해주세요.");
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/members/reset-pw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inputs)
            });

            if (response.ok) {
                alert("비밀번호가 성공적으로 변경되었습니다! 로그인 해주세요.");
                window.location.href = "/members/login"; // 로그인 페이지로 이동 (URL 확인 필요)
            } else {
                alert(await response.text());
            }
        } catch (err) {
            alert("서버 오류");
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '10px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>계정 찾기</h2>

            {/* 탭 메뉴 */}
            <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #ccc' }}>
                <div
                    onClick={() => { setMode('id'); setResultMsg(''); }}
                    style={{ flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer', fontWeight: mode==='id'?'bold':'normal', borderBottom: mode==='id'?'2px solid #F97316':'none' }}
                >
                    아이디 찾기
                </div>
                <div
                    onClick={() => { setMode('pw'); setResultMsg(''); }}
                    style={{ flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer', fontWeight: mode==='pw'?'bold':'normal', borderBottom: mode==='pw'?'2px solid #F97316':'none' }}
                >
                    비밀번호 재설정
                </div>
            </div>

            {/* 내용 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* 1. 아이디 입력 (비번 찾기일 때만) */}
                {mode === 'pw' && (
                    <input name="memberId" placeholder="아이디" onChange={handleChange} style={{ padding: '10px' }} />
                )}

                {/* 2. 이름 & 전화번호 (공통) */}
                <input name="name" placeholder="이름" onChange={handleChange} style={{ padding: '10px' }} />
                <input name="phoneNumber" placeholder="전화번호 (예: 010-1234-5678)" onChange={handleChange} style={{ padding: '10px' }} />

                {/* ⭐ 3. [추가됨] 이메일 인증 구간 (비번 찾기일 때만) */}
                {mode === 'pw' && (
                    <div style={{ border: '1px solid #eee', padding: '10px', borderRadius: '5px', backgroundColor: '#fafafa' }}>
                        <p style={{margin: '0 0 5px 0', fontSize: '12px', color: '#666'}}>본인 확인을 위한 이메일 인증</p>

                        {/* 이메일 입력 & 발송 버튼 */}
                        <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                            <input
                                type="email"
                                placeholder="이메일 입력"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ flex: 1, padding: '8px' }}
                                disabled={isVerified} // 인증되면 수정 불가
                            />
                            <button
                                onClick={handleSendCode}
                                disabled={isVerified}
                                style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#4B5563', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                            >
                                인증번호 받기
                            </button>
                        </div>

                        {/* 인증번호 입력 & 확인 버튼 */}
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input
                                placeholder="인증번호 6자리"
                                value={authCode}
                                onChange={(e) => setAuthCode(e.target.value)}
                                style={{ flex: 1, padding: '8px' }}
                                disabled={isVerified}
                            />
                            <button
                                onClick={handleVerifyCode}
                                disabled={isVerified}
                                style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: isVerified ? '#10B981' : '#4B5563', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                            >
                                {isVerified ? "인증완료" : "확인"}
                            </button>
                        </div>
                    </div>
                )}

                {/* 4. 새 비밀번호 입력 (비번 찾기일 때만) */}
                {mode === 'pw' && (
                    <input type="password" name="newPassword" placeholder="변경할 새 비밀번호" onChange={handleChange} style={{ padding: '10px' }} />
                )}

                {/* 실행 버튼 */}
                <button
                    onClick={mode === 'id' ? handleFindId : handleResetPw}
                    // 인증 안 되면 비번 변경 버튼 비활성화 (회색 처리)
                    disabled={mode === 'pw' && !isVerified}
                    style={{
                        marginTop: '10px',
                        padding: '12px',
                        backgroundColor: (mode === 'pw' && !isVerified) ? '#ccc' : '#F97316',
                        color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'
                    }}
                >
                    {mode === 'id' ? '아이디 찾기' : '비밀번호 변경하기'}
                </button>
            </div>

            {/* 결과 메시지 (아이디 찾기 용) */}
            {resultMsg && (
                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '5px', textAlign: 'center', color: '#1f2937', fontWeight: 'bold' }}>
                    {resultMsg}
                </div>
            )}

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <Link to="/members/login" style={{ color: '#666', textDecoration: 'none', fontSize: '0.9em' }}>로그인으로 돌아가기</Link>
            </div>
        </div>
    );
}

export default FindPage;
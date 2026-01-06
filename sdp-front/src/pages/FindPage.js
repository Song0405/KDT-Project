import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function FindPage() {
    const [mode, setMode] = useState('id'); // 'id' 또는 'pw'
    const [resultMsg, setResultMsg] = useState('');

    const [inputs, setInputs] = useState({
        memberId: '',
        name: '',
        phoneNumber: '',
        newPassword: ''
    });

    const handleChange = (e) => {
        setInputs({ ...inputs, [e.target.name]: e.target.value });
    };

    // 아이디 찾기 요청
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

    // 비밀번호 재설정 요청
    const handleResetPw = async () => {
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
                alert("비밀번호가 변경되었습니다! 로그인 해주세요.");
                window.location.href = "/members/login";
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

                {/* 비밀번호 찾기일 때만 아이디 입력창 표시 */}
                {mode === 'pw' && (
                    <input name="memberId" placeholder="아이디" onChange={handleChange} style={{ padding: '10px' }} />
                )}

                <input name="name" placeholder="이름" onChange={handleChange} style={{ padding: '10px' }} />
                <input name="phoneNumber" placeholder="전화번호 (예: 010-1234-5678)" onChange={handleChange} style={{ padding: '10px' }} />

                {/* 비밀번호 찾기일 때만 새 비번 입력창 표시 */}
                {mode === 'pw' && (
                    <input type="password" name="newPassword" placeholder="변경할 새 비밀번호" onChange={handleChange} style={{ padding: '10px' }} />
                )}

                <button
                    onClick={mode === 'id' ? handleFindId : handleResetPw}
                    style={{ marginTop: '10px', padding: '12px', backgroundColor: '#F97316', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
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
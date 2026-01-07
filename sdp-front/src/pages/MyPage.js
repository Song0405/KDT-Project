import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPage.css'; // ✅ CSS 임포트

function MyPage() {
    const navigate = useNavigate();
    const storedId = localStorage.getItem("memberId");
    const storedType = localStorage.getItem("memberType");
    const [isEditing, setIsEditing] = useState(false);
    const [myInfo, setMyInfo] = useState(null);
    const [formData, setFormData] = useState({
        currentPassword: '', newPassword: '', name: '', phoneNumber: '', email: ''
    });

    useEffect(() => {
        if (!storedId) {
            navigate('/members/login');
            return;
        }
        fetch(`http://localhost:8080/api/members/info?memberId=${storedId}&type=${storedType}`)
            .then(res => res.json())
            .then(data => {
                setMyInfo(data);
                setFormData(prev => ({
                    ...prev, name: data.name, phoneNumber: data.phoneNumber, email: data.email
                }));
            })
            .catch(err => console.error("정보 로드 실패", err));
    }, [storedId, storedType, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async () => {
        // ... (업데이트 로직 동일)
        if (!formData.currentPassword) {
            alert("저장을 위해 '현재 비밀번호'를 입력해주세요.");
            return;
        }
        try {
            const response = await fetch('http://localhost:8080/api/members/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, memberId: storedId, type: storedType }),
            });
            if (response.ok) {
                alert("수정 완료! ✅");
                setIsEditing(false);
                window.location.reload();
            } else {
                alert(await response.text());
            }
        } catch (error) { alert("서버 오류"); }
    };

    const handleWithdraw = async () => {
        // ... (탈퇴 로직 동일)
        if (!window.confirm("정말 탈퇴하시겠습니까? 😢")) return;
        const pwd = prompt("탈퇴 확인: 비밀번호를 입력하세요.");
        if (!pwd) return;
        try {
            const response = await fetch('http://localhost:8080/api/members/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId: storedId, type: storedType, currentPassword: pwd }),
            });
            if (response.ok) {
                alert("탈퇴되었습니다.");
                localStorage.clear();
                window.location.href = "/";
            } else {
                alert(await response.text());
            }
        } catch (error) { alert("오류 발생"); }
    };

    if (!myInfo) return <div style={{textAlign:'center', marginTop:'50px'}}>로딩 중...</div>;

    return (
        <div className="mypage-container">
            <h2 className="mypage-title">마이페이지</h2>

            {!isEditing ? (
                // --- 조회 모드 ---
                <div className="mypage-card">
                    <div className="mypage-info-row">
                        <span className="mypage-label">아이디</span>
                        <span className="mypage-value">{myInfo.memberId} ({myInfo.type === 'company' ? '기업' : '개인'})</span>
                    </div>
                    <div className="mypage-info-row">
                        <span className="mypage-label">이름</span>
                        <span className="mypage-value">{myInfo.name}</span>
                    </div>
                    <div className="mypage-info-row">
                        <span className="mypage-label">전화번호</span>
                        <span className="mypage-value">{myInfo.phoneNumber}</span>
                    </div>
                    <div className="mypage-info-row">
                        <span className="mypage-label">이메일</span>
                        <span className="mypage-value">{myInfo.email}</span>
                    </div>
                    {myInfo.businessNumber && (
                        <div className="mypage-info-row">
                            <span className="mypage-label">사업자번호</span>
                            <span className="mypage-value">{myInfo.businessNumber}</span>
                        </div>
                    )}

                    <div className="mypage-btn-group">
                        <button onClick={() => setIsEditing(true)} className="btn-base btn-edit">정보 수정하기</button>
                        <button onClick={handleWithdraw} className="btn-base btn-withdraw">회원 탈퇴</button>
                    </div>
                </div>
            ) : (
                // --- 수정 모드 ---
                <div className="mypage-card">
                    <h3 className="mypage-form-header">정보 수정</h3>

                    <label className="mypage-input-label">이름</label>
                    <input name="name" value={formData.name} onChange={handleChange} className="mypage-input" />

                    <label className="mypage-input-label">전화번호</label>
                    <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="mypage-input" />

                    <label className="mypage-input-label">이메일</label>
                    <input name="email" value={formData.email} onChange={handleChange} className="mypage-input" />

                    <hr className="mypage-divider"/>

                    <label className="mypage-input-label">새 비밀번호 (변경 원할 시)</label>
                    <input type="password" name="newPassword" placeholder="변경할 비밀번호" onChange={handleChange} className="mypage-input" />

                    <label className="mypage-input-label">현재 비밀번호 (저장 확인용) <span style={{color:'red'}}>*</span></label>
                    <input type="password" name="currentPassword" placeholder="현재 비밀번호 필수" onChange={handleChange} className="mypage-input" />

                    <div className="mypage-btn-group">
                        <button onClick={() => setIsEditing(false)} className="btn-base btn-cancel">취소</button>
                        <button onClick={handleUpdate} className="btn-base btn-save">저장하기</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyPage;
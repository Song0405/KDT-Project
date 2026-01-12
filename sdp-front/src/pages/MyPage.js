import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPage.css';

function MyPage() {
    const navigate = useNavigate();
    const storedId = localStorage.getItem("memberId");
    const storedType = localStorage.getItem("memberType");
    const [isEditing, setIsEditing] = useState(false);
    const [myInfo, setMyInfo] = useState(null);
    const [formData, setFormData] = useState({
        currentPassword: '', newPassword: '', name: '', phoneNumber: '', email: ''
    });

    // --- 1. 데이터 로드 (컴포넌트 마운트 및 정보 수정 후) ---
    useEffect(() => {
        if (!storedId) {
            navigate('/members/login');
            return;
        }
        // 사용자 정보 fetch
        fetch(`http://localhost:8080/api/members/info?memberId=${storedId}&type=${storedType}`)
            .then(res => res.json())
            .then(data => {
                setMyInfo(data);
                setFormData(prev => ({
                    ...prev,
                    name: data.name,
                    phoneNumber: data.phoneNumber,
                    email: data.email,
                    currentPassword: '',
                    newPassword: ''
                }));
            })
            .catch(err => console.error("데이터 동기화 실패", err));
    }, [storedId, storedType, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- 2. 정보 수정 로직 ---
    const handleUpdate = async () => {
        if (!formData.currentPassword) {
            alert("보안을 위해 현재 비밀번호를 입력해주세요.");
            return;
        }
        try {
            const response = await fetch('http://localhost:8080/api/members/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, memberId: storedId, type: storedType }),
            });
            if (response.ok) {
                alert("프로필이 업데이트되었습니다! ✅");
                setIsEditing(false);
                window.location.reload();
            } else {
                alert(await response.text());
            }
        } catch (error) { alert("통신 중 서버 오류가 발생했습니다."); }
    };

    // --- 3. 회원 탈퇴 로직 ---
    const handleWithdraw = async () => {
        if (!window.confirm("정말로 스테이션을 폐쇄하고 탈퇴하시겠습니까? 😢")) return;
        const pwd = prompt("보안 확인을 위해 비밀번호를 입력하세요.");
        if (!pwd) return;
        try {
            const response = await fetch('http://localhost:8080/api/members/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId: storedId, type: storedType, currentPassword: pwd }),
            });
            if (response.ok) {
                alert("탈퇴 처리가 완료되었습니다. 그동안 이용해주셔서 감사합니다.");
                localStorage.clear();
                window.location.href = "/";
            } else {
                alert(await response.text());
            }
        } catch (error) { alert("오류가 발생했습니다."); }
    };

    if (!myInfo) return (
        <div className="loading-container">
            <div className="loader"></div>
            <p>데이터 동기화 중...</p>
        </div>
    );

    return (
        <div className="mypage-page-wrapper">
            <div className="mypage-container">
                <header className="mypage-header">
                    <h2 className="mypage-title">STATION <span className="highlight">PROFILE</span></h2>
                    <p className="mypage-subtitle">나의 워크스테이션 계정 설정 및 정보를 관리합니다.</p>
                </header>

                {!isEditing ? (
                    // --- [조회 모드] ---
                    <div className="mypage-card view-mode">
                        <div className="profile-badge">
                            <span className="user-icon">👤</span>
                            <div className="badge-text">
                                <p className="user-name">{myInfo.name}</p>
                                <p className="user-type">{myInfo.type === 'company' ? '기업 파트너' : '개인 멤버'}</p>
                            </div>
                        </div>

                        <div className="info-grid">
                            <div className="info-box">
                                <label>아이디</label>
                                <p>{myInfo.memberId}</p>
                            </div>
                            <div className="info-box">
                                <label>이메일</label>
                                <p>{myInfo.email}</p>
                            </div>
                            <div className="info-box">
                                <label>전화번호</label>
                                <p>{myInfo.phoneNumber}</p>
                            </div>
                            {myInfo.businessNumber && (
                                <div className="info-box accent-box">
                                    <label>사업자번호</label>
                                    <p>{myInfo.businessNumber}</p>
                                </div>
                            )}
                        </div>

                        <div className="mypage-btn-group">
                            <button onClick={() => setIsEditing(true)} className="btn-mypage btn-prime">정보 수정</button>
                            <button onClick={handleWithdraw} className="btn-mypage btn-danger">계정 탈퇴</button>
                        </div>
                    </div>
                ) : (
                    // --- [수정 모드] ---
                    <div className="mypage-card edit-mode">
                        <h3 className="form-title">환경 설정 수정</h3>

                        <div className="input-row">
                            <div className="input-group">
                                <label>성함 / 대표자명</label>
                                <input name="name" value={formData.name} onChange={handleChange} className="mypage-input" />
                            </div>
                        </div>

                        <div className="input-row">
                            <div className="input-group">
                                <label>전화번호</label>
                                <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="mypage-input" />
                            </div>
                            <div className="input-group">
                                <label>이메일</label>
                                <input name="email" value={formData.email} onChange={handleChange} className="mypage-input" />
                            </div>
                        </div>

                        <div className="divider-neon"></div>

                        <div className="input-row">
                            <div className="input-group">
                                <label>새 비밀번호 (선택)</label>
                                <input type="password" name="newPassword" placeholder="변경 시에만 입력" onChange={handleChange} className="mypage-input highlight" />
                            </div>
                            <div className="input-group">
                                <label>현재 비밀번호 (필수) <span className="req">*</span></label>
                                <input type="password" name="currentPassword" placeholder="현재 비밀번호 입력" onChange={handleChange} className="mypage-input active" />
                            </div>
                        </div>

                        <div className="mypage-btn-group">
                            <button onClick={() => setIsEditing(false)} className="btn-mypage btn-cancel">취소</button>
                            <button onClick={handleUpdate} className="btn-mypage btn-save">변경사항 저장</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyPage;
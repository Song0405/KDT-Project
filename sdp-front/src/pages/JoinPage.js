import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './JoinPage.css';

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
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 기업 회원일 경우 사업자 번호 필수 체크 예시
        if (formData.type === 'company' && !formData.businessNumber) {
            alert("사업자 등록 번호를 입력해주세요.");
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/members/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert("🎉 회원가입이 완료되었습니다! 로그인 후 ROOT STATION을 이용해보세요.");
                navigate('/members/login');
            } else {
                const errorMsg = await response.text();
                alert("가입 실패: " + errorMsg);
            }
        } catch (error) {
            alert("서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
        }
    };

    return (
        <div className="join-page-wrapper">
            <div className="join-container">
                <header className="join-header">
                    <h2 className="join-title">회원가입</h2>
                    <p className="join-subtitle">최상의 워크스테이션 환경을 위한 첫 걸음</p>
                </header>

                <form onSubmit={handleSubmit} className="join-form-area">
                    {/* 회원 유형 선택 (탭 스타일) */}
                    <div className="type-tab-selector">
                        <div
                            className={`type-tab ${formData.type === 'individual' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, type: 'individual' })}
                        >
                            개인 회원
                        </div>
                        <div
                            className={`type-tab ${formData.type === 'company' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, type: 'company' })}
                        >
                            기업 회원
                        </div>
                    </div>

                    <div className="input-section">
                        <div className="input-group">
                            <label>아이디</label>
                            <input type="text" name="memberId" placeholder="아이디 입력" onChange={handleChange} required className="join-input" />
                        </div>

                        <div className="input-group">
                            <label>비밀번호</label>
                            <input type="password" name="password" placeholder="영문, 숫자 포함 8자 이상" onChange={handleChange} required className="join-input" />
                        </div>

                        <div className="input-group">
                            <label>{formData.type === 'individual' ? '성함' : '대표자 성함'}</label>
                            <input type="text" name="name" value={formData.name} placeholder="실명 입력" onChange={handleChange} required className="join-input" />
                        </div>

                        <div className="input-row">
                            <div className="input-group">
                                <label>연락처</label>
                                <input type="text" name="phoneNumber" placeholder="'-' 제외 숫자만" onChange={handleChange} className="join-input" />
                            </div>
                            <div className="input-group">
                                <label>이메일</label>
                                <input type="email" name="email" placeholder="example@root.com" onChange={handleChange} className="join-input" />
                            </div>
                        </div>

                        {/* 유형에 따른 추가 정보 입력 */}
                        {formData.type === 'individual' ? (
                            <div className="input-group">
                                <label>주민등록번호</label>
                                <input type="text" name="ssn" placeholder="앞자리-뒷자리" onChange={handleChange} className="join-input" />
                            </div>
                        ) : (
                            <div className="input-group company-info-fade">
                                <label>사업자 등록 번호</label>
                                <input
                                    type="text"
                                    name="businessNumber"
                                    placeholder="사업자 번호 10자리 입력"
                                    value={formData.businessNumber}
                                    onChange={handleChange}
                                    required
                                    className="join-input highlight"
                                />
                            </div>
                        )}
                    </div>

                    <button type="submit" className="join-submit-btn">가입 신청하기</button>
                </form>

                <footer className="join-footer">
                    이미 계정이 있으신가요? <span onClick={() => navigate('/members/login')}>로그인하러 가기</span>
                </footer>
            </div>
        </div>
    );
}

export default JoinPage;
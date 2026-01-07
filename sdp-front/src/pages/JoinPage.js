import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './JoinPage.css';

function JoinPage() {
    const [formData, setFormData] = useState({
        memberId: '', password: '', name: '', phoneNumber: '', email: '', ssn: '', businessNumber: '', type: 'individual'
    });
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) { setSelectedFile(null); return; }
        setSelectedFile(file);
        setIsUploading(true);
        const ocrFormData = new FormData();
        ocrFormData.append('file', file);
        try {
            const response = await fetch('http://localhost:8080/api/ocr/extract-business-info', { method: 'POST', body: ocrFormData });
            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, businessNumber: data.businessNumber || prev.businessNumber, name: data.representativeName || prev.name }));
                alert("사업자 정보 자동 입력 완료!");
            } else alert("OCR 분석 실패");
        } catch (error) { alert("서버 오류"); } finally { setIsUploading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // ... (유효성 검사 로직 동일)
        try {
            const response = await fetch('http://localhost:8080/api/members/join', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
            });
            if (response.ok) { alert("회원가입 성공!"); navigate('/members/login'); }
            else alert("실패: " + await response.text());
        } catch (error) { alert("서버 연결 실패"); }
    };

    return (
        <div className="join-container">
            <h2 className="join-title">회원가입</h2>
            <form onSubmit={handleSubmit}>
                <div className="type-selector">
                    <label className="type-label"><input type="radio" name="type" value="individual" checked={formData.type === 'individual'} onChange={handleChange} /> 개인회원</label>
                    <label className="type-label"><input type="radio" name="type" value="company" checked={formData.type === 'company'} onChange={handleChange} /> 기업회원</label>
                </div>

                <div className="join-form">
                    <input type="text" name="memberId" placeholder="아이디" onChange={handleChange} required className="join-input" />
                    <input type="password" name="password" placeholder="비밀번호" onChange={handleChange} required className="join-input" />
                    <input type="text" name="name" placeholder="이름 (또는 대표자명)" onChange={handleChange} required className="join-input" />
                    <input type="text" name="phoneNumber" placeholder="전화번호" onChange={handleChange} className="join-input" />
                    <input type="email" name="email" placeholder="이메일" onChange={handleChange} className="join-input" />

                    {formData.type === 'individual' ? (
                        <input type="text" name="ssn" placeholder="주민번호" onChange={handleChange} className="join-input" />
                    ) : (
                        <>
                            <div className="upload-box">
                                <label htmlFor="business-license-upload">
                                    사업자등록증 업로드 (필수)
                                    <input id="business-license-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                    <div className="upload-btn-area">
                                        {isUploading ? '분석 중...' : '파일 선택'}
                                    </div>
                                </label>
                            </div>
                            <input type="text" name="businessNumber" placeholder="사업자번호" value={formData.businessNumber} onChange={handleChange} required className="join-input" />
                        </>
                    )}
                </div>
                <button type="submit" className="join-submit-btn">가입하기</button>
            </form>
        </div>
    );
}

export default JoinPage;
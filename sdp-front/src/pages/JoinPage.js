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
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            setSelectedFile(null);
            return;
        }
        setSelectedFile(file);

        setIsUploading(true);
        const ocrFormData = new FormData();
        ocrFormData.append('file', file);

        try {
            const response = await fetch('http://localhost:8080/api/ocr/extract-business-info', {
                method: 'POST',
                body: ocrFormData,
            });

            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({
                    ...prev,
                    businessNumber: data.businessNumber || prev.businessNumber,
                    name: data.representativeName || prev.name, // 대표자명을 이름 필드에 채움
                    // companyName 필드가 있다면 data.companyName으로 채울 수 있습니다.
                }));
                alert("사업자 정보가 자동으로 입력되었습니다.");
            } else {
                const errorData = await response.json();
                alert("OCR 분석 실패: " + (errorData.message || "이미지를 확인해주세요."));
            }
        } catch (error) {
            console.error("OCR API 호출 오류:", error);
            alert("서버와 통신 중 오류가 발생했습니다.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.memberId || !formData.password || !formData.name) {
            alert("아이디, 비밀번호, 이름은 필수입니다!");
            return;
        }

        if (formData.type === 'company') {
            if (!selectedFile) {
                alert("사업자등록증을 필수로 업로드해야 합니다.");
                return;
            }
            if (!formData.businessNumber) {
                alert("사업자등록번호는 필수입니다. OCR로 자동 입력되지 않았다면 직접 입력해주세요.");
                return;
            }
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
                        <>
                            <div style={{ border: '1px dashed #ccc', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>
                                <label htmlFor="business-license-upload">
                                    사업자등록증 업로드 (필수)
                                    <input
                                        id="business-license-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '5px',
                                        marginTop: '5px',
                                        cursor: 'pointer',
                                        backgroundColor: isUploading ? '#f0f0f0' : '#fff'
                                    }}>
                                        {isUploading ? '분석 중...' : '파일 선택'}
                                    </div>
                                </label>
                            </div>
                            <input
                                type="text"
                                name="businessNumber"
                                placeholder="사업자번호 (기업)"
                                value={formData.businessNumber}
                                onChange={handleChange}
                                required
                                style={{ padding: '10px' }}
                            />
                        </>
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
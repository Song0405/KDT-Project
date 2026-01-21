import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../pages/order/Order.css';

function ChangeInfoPage() {
    const navigate = useNavigate();

    // 영어 ID를 가져옴 (서버 통신용)
    const memberId = localStorage.getItem('memberId');
    // 화면 표시 및 이름 전송용
    const memberName = localStorage.getItem('memberName');

    const [inputs, setInputs] = useState({
        email: '',
        phoneNumber: '',
        newPassword: '',
        confirmPassword: '',
        currentPassword: ''
    });

    useEffect(() => {
        if (!memberId) {
            alert("로그인이 필요합니다.");
            navigate('/members/login');
            return;
        }

        axios.get(`http://localhost:8080/api/members/info`, {
            params: {
                memberId: memberId,
                type: 'individual'
            }
        })
            .then(res => {
                setInputs(prev => ({
                    ...prev,
                    email: res.data.email || '',
                    phoneNumber: res.data.phoneNumber || res.data.tel || ''
                }));
            })
            .catch(err => {
                console.error("정보 로드 실패:", err);
            });
    }, [memberId, navigate]);

    const handleChange = (e) => {
        setInputs({ ...inputs, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!inputs.currentPassword) {
            alert("정보를 수정하려면 현재 비밀번호를 입력해야 합니다.");
            return;
        }

        if (inputs.newPassword && (inputs.newPassword !== inputs.confirmPassword)) {
            alert("새 비밀번호가 일치하지 않습니다.");
            return;
        }

        try {
            const response = await axios.post(`http://localhost:8080/api/members/update`, {
                memberId: memberId,
                name: memberName || memberId,
                email: inputs.email,
                phoneNumber: inputs.phoneNumber,
                currentPassword: inputs.currentPassword,
                newPassword: inputs.newPassword,
                type: 'individual'
            });

            if (response.status === 200) {
                // ⭐ [수정됨] 로그아웃 없이 메인으로 이동
                alert("회원 정보가 성공적으로 수정되었습니다.");
                // localStorage.clear();  <-- 이 줄을 삭제했습니다.
                navigate('/');         // <-- 로그인 페이지 대신 메인으로 보냅니다.
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data || "정보 수정 실패 (비밀번호를 확인해주세요)";
            alert(msg);
        }
    };

    return (
        <div className="order-manage-wrapper" style={{minHeight: '80vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
            <div style={{width: '100%', maxWidth: '500px', background: '#111', padding: '40px', borderRadius: '12px', border: '1px solid #333'}}>
                <h2 style={{color: 'white', marginBottom: '30px', textAlign:'center', borderBottom:'2px solid #00d4ff', paddingBottom:'15px'}}>
                    EDIT PERSONAL INFO
                </h2>

                <div style={{marginBottom: '20px', textAlign: 'center', color: '#888'}}>
                    <p>계정 ID: <strong style={{color: '#00d4ff'}}>{memberId}</strong></p>
                </div>

                <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                    <div style={{paddingBottom:'20px', borderBottom:'1px dashed #333'}}>
                        <label style={labelStyle}>이메일</label>
                        <input
                            type="email" name="email"
                            value={inputs.email} onChange={handleChange}
                            style={inputStyle}
                        />

                        <label style={{...labelStyle, marginTop:'15px'}}>전화번호</label>
                        <input
                            type="text" name="phoneNumber"
                            value={inputs.phoneNumber} onChange={handleChange}
                            style={inputStyle} placeholder="010-0000-0000"
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>새 비밀번호 (변경 시에만 입력)</label>
                        <input
                            type="password" name="newPassword"
                            value={inputs.newPassword} onChange={handleChange}
                            style={inputStyle} placeholder="변경하지 않으려면 비워두세요"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>새 비밀번호 확인</label>
                        <input
                            type="password" name="confirmPassword"
                            value={inputs.confirmPassword} onChange={handleChange}
                            style={inputStyle} placeholder="Confirm New Password"
                        />
                    </div>

                    <div style={{marginTop:'10px', paddingTop:'20px', borderTop:'2px solid #333'}}>
                        <label style={{color:'#ff4d4d', fontSize:'0.9rem', display:'block', marginBottom:'8px', fontWeight:'bold'}}>
                            ※ 현재 비밀번호 (필수)
                        </label>
                        <input
                            type="password" name="currentPassword"
                            value={inputs.currentPassword} onChange={handleChange}
                            style={{...inputStyle, borderColor:'#ff4d4d'}} placeholder="Current Password"
                        />
                    </div>

                    <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                        <button onClick={() => navigate(-1)} style={cancelBtnStyle}>취소</button>
                        <button onClick={handleSubmit} style={submitBtnStyle}>수정 완료</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const labelStyle = { color:'#ccc', fontSize:'0.9rem', display:'block', marginBottom:'8px' };
const inputStyle = {
    width: '100%', padding: '15px', background: '#000', border: '1px solid #333',
    color: 'white', borderRadius: '4px', fontSize: '1rem', outline:'none'
};
const cancelBtnStyle = {
    flex: 1, padding: '15px', background: 'transparent', border: '1px solid #555',
    color: '#aaa', borderRadius: '4px', cursor: 'pointer', fontWeight:'bold'
};
const submitBtnStyle = {
    flex: 2, padding: '15px', background: '#00d4ff', border: 'none',
    color: 'black', borderRadius: '4px', cursor: 'pointer', fontWeight:'bold'
};

export default ChangeInfoPage;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MyPage() {
    const navigate = useNavigate();
    const storedId = localStorage.getItem("memberId");
    const storedType = localStorage.getItem("memberType");

    // 모드 전환용 상태 (false: 조회 모드, true: 수정 모드)
    const [isEditing, setIsEditing] = useState(false);

    // 서버에서 가져온 내 정보
    const [myInfo, setMyInfo] = useState(null);

    // 수정할 때 입력하는 데이터
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        name: '',
        phoneNumber: '',
        email: ''
    });

    // 1. 페이지 들어오자마자 내 정보 불러오기
    useEffect(() => {
        if (!storedId) {
            navigate('/members/login');
            return;
        }

        // ⭐ [수정] 관리자('admin')라면 서버에 요청하지 않고 바로 세팅 (DB에 없으므로)
        if (storedType === 'admin') {
            setMyInfo({
                memberId: 'admin',
                name: '총괄 관리자',
                type: 'admin',
                phoneNumber: '010-0000-0000',
                email: 'admin@sdp.com'
            });
            return;
        }

        // 일반 회원일 때만 백엔드에 내 정보 달라고 요청
        fetch(`http://localhost:8080/api/members/info?memberId=${storedId}&type=${storedType}`)
            .then(res => res.json())
            .then(data => {
                setMyInfo(data); // 가져온 정보 저장
                // 수정 폼에도 미리 값 채워넣기
                setFormData(prev => ({
                    ...prev,
                    name: data.name,
                    phoneNumber: data.phoneNumber,
                    email: data.email
                }));
            })
            .catch(err => console.error("정보 로드 실패", err));

    }, [storedId, storedType, navigate]);


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 정보 수정 요청
    const handleUpdate = async () => {
        // ⭐ 관리자는 정보 수정 불가 처리
        if (storedType === 'admin') {
            alert("관리자 계정은 정보를 수정할 수 없습니다.");
            return;
        }

        if (!formData.currentPassword) {
            alert("저장을 위해 '현재 비밀번호'를 입력해주세요.");
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/members/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    memberId: storedId,
                    type: storedType
                }),
            });

            if (response.ok) {
                alert("수정 완료! ✅");
                setIsEditing(false); // 다시 조회 모드로 돌아가기
                window.location.reload(); // 정보 갱신을 위해 새로고침
            } else {
                const msg = await response.text();
                alert(msg);
            }
        } catch (error) {
            alert("서버 오류");
        }
    };

    // 회원 탈퇴
    const handleWithdraw = async () => {
        // ⭐ 관리자는 탈퇴 불가 처리
        if (storedType === 'admin') {
            alert("관리자 계정은 탈퇴할 수 없습니다.");
            return;
        }

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
        } catch (error) {
            alert("오류 발생");
        }
    };

    if (!myInfo) return <div style={{textAlign:'center', marginTop:'50px'}}>로딩 중...</div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>마이페이지</h2>

            {/* 🔥 isEditing이 false면 [조회 화면], true면 [수정 화면] 보여줌 */}
            {!isEditing ? (
                // --- 1. 조회 모드 (View) ---
                <div style={styles.card}>
                    <div style={styles.infoRow}>
                        <span style={styles.label}>아이디</span>
                        <span style={styles.value}>
                            {myInfo.memberId}
                            {/* 타입 표시: admin/company/individual */}
                            <span style={{fontSize:'0.8em', marginLeft:'5px', color:'#F97316'}}>
                                ({myInfo.type === 'admin' ? '관리자' : (myInfo.type === 'company' ? '기업' : '개인')})
                            </span>
                        </span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.label}>이름</span>
                        <span style={styles.value}>{myInfo.name}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.label}>전화번호</span>
                        <span style={styles.value}>{myInfo.phoneNumber}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.label}>이메일</span>
                        <span style={styles.value}>{myInfo.email}</span>
                    </div>
                    {myInfo.businessNumber && (
                        <div style={styles.infoRow}>
                            <span style={styles.label}>사업자번호</span>
                            <span style={styles.value}>{myInfo.businessNumber}</span>
                        </div>
                    )}

                    <div style={styles.buttonGroup}>
                        <button onClick={() => setIsEditing(true)} style={styles.editBtn}>정보 수정하기</button>
                        <button onClick={handleWithdraw} style={styles.withdrawBtn}>회원 탈퇴</button>
                    </div>
                </div>
            ) : (
                // --- 2. 수정 모드 (Edit Form) ---
                <div style={styles.card}>
                    <h3 style={{marginBottom:'20px', color:'#F97316'}}>정보 수정</h3>

                    <label style={styles.inputLabel}>이름</label>
                    <input name="name" value={formData.name || ''} onChange={handleChange} style={styles.input} />

                    <label style={styles.inputLabel}>전화번호</label>
                    <input name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleChange} style={styles.input} />

                    <label style={styles.inputLabel}>이메일</label>
                    <input name="email" value={formData.email || ''} onChange={handleChange} style={styles.input} />

                    <hr style={{margin:'20px 0', border:'0.5px solid #444'}}/>

                    <label style={styles.inputLabel}>새 비밀번호 (변경 원할 시)</label>
                    <input type="password" name="newPassword" placeholder="변경할 비밀번호" onChange={handleChange} style={styles.input} />

                    <label style={styles.inputLabel}>현재 비밀번호 (저장 확인용) <span style={{color:'red'}}>*</span></label>
                    <input type="password" name="currentPassword" placeholder="현재 비밀번호 필수" onChange={handleChange} style={styles.input} />

                    <div style={styles.buttonGroup}>
                        <button onClick={() => setIsEditing(false)} style={styles.cancelBtn}>취소</button>
                        <button onClick={handleUpdate} style={styles.saveBtn}>저장하기</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: { maxWidth: '600px', margin: '50px auto', color: '#fff' },
    title: { textAlign: 'center', marginBottom: '30px', color: '#333' }, // 제목 색상 수정 (배경이 흰색일 경우)
    card: { backgroundColor: '#1F2937', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' },
    infoRow: { display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #374151' },
    label: { color: '#9CA3AF', fontWeight: 'bold' },
    value: { color: '#F3F4F6' },

    inputLabel: { display:'block', marginBottom:'5px', color:'#D1D5DB', fontSize:'0.9em' },
    input: { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #4B5563', backgroundColor: '#374151', color: 'white' },

    buttonGroup: { marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center' },
    editBtn: { padding: '10px 20px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    withdrawBtn: { padding: '10px 20px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    saveBtn: { padding: '10px 20px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    cancelBtn: { padding: '10px 20px', backgroundColor: '#6B7280', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};
export default MyPage;
import React, { useState, useRef, useEffect } from 'react';
import './AdminLoginPage.css';

function AdminLoginPage({ setAuthenticated }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');

    // 카메라 상태 관리
    const [isCamOpen, setIsCamOpen] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const ADMIN_PASSWORD = '1111';

    // 컴포넌트가 사라질 때 카메라 끄기
    useEffect(() => {
        return () => stopWebcam();
    }, []);

    const startWebcam = async () => {
        try {
            setIsCamOpen(true);
            setStatus("📸 카메라를 쳐다봐주세요");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("웹캠 오류:", err);
            setStatus("❌ 웹캠을 켤 수 없습니다.");
            setIsCamOpen(false);
        }
    };

    const stopWebcam = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCamOpen(false);
        setStatus("");
    };

    const handleFaceLogin = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setStatus("인식 중... ⏳");

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');

        try {
            const response = await fetch('http://localhost:5002/verify-face', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData })
            });
            const data = await response.json();

            if (data.status === 'success') {
                setStatus("✅ 인증 성공! 환영합니다.");
                alert(data.msg);
                setTimeout(() => {
                    stopWebcam();
                    // ⭐ [추가] 관리자 이름 저장 -> App.js가 이걸 읽어서 화면에 표시함
                    localStorage.setItem('memberName', '관리자');
                    setAuthenticated(true);
                }, 1000);
            } else {
                setStatus("❌ " + data.msg);
            }
        } catch (err) {
            setStatus("❌ 서버 연결 실패 (5002 포트 확인)");
        }
    };

    const handlePasswordLogin = (e) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            // ⭐ [추가] 관리자 이름 저장
            localStorage.setItem('memberName', '관리자');
            setAuthenticated(true);
        } else {
            setError('비밀번호가 올바르지 않습니다.');
            setPassword('');
        }
    };

    return (
        <div className="admin-login-container">
            <div className="login-box">
                <h2>관리자 로그인</h2>

                {/* 얼굴 인식 섹션 */}
                <div style={{ marginBottom: '30px', borderBottom: '1px solid #374151', paddingBottom: '20px' }}>
                    {!isCamOpen ? (
                        <button onClick={startWebcam} style={{ background: '#3B82F6', width: '100%', padding: '15px' }}>
                            📸 얼굴 인식 모드 켜기
                        </button>
                    ) : (
                        <div className="webcam-area">
                            <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '15px' }}>
                                <video ref={videoRef} autoPlay muted style={{ width: '100%', height: '250px', objectFit: 'cover' }}></video>
                                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                            </div>
                            <p style={{ color: '#F97316', fontWeight: 'bold', marginBottom: '15px' }}>{status}</p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={handleFaceLogin} style={{ flex: 2, background: '#10B981' }}>✅ 인증하기</button>
                                <button onClick={stopWebcam} style={{ flex: 1, background: '#EF4444' }}>닫기</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 비밀번호 로그인 섹션 */}
                <form onSubmit={handlePasswordLogin}>
                    <div className="input-group">
                        <label>관리자 비밀번호:</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit">로그인</button>
                </form>
            </div>
        </div>
    );
}

export default AdminLoginPage;
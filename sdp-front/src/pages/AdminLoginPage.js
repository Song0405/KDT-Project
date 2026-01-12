import React, { useState, useRef, useEffect } from 'react';
import './AdminLoginPage.css';

function AdminLoginPage({ setAuthenticated }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');

    // ⭐ 카메라 상태 관리 (기본값: false - 꺼짐)
    const [isCamOpen, setIsCamOpen] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const ADMIN_PASSWORD = '1111';

    // 컴포넌트가 사라질 때(언마운트) 카메라 끄기
    useEffect(() => {
        return () => stopWebcam();
    }, []);

    // 1. 웹캠 켜기 함수
    const startWebcam = async () => {
        try {
            setIsCamOpen(true); // 상태 변경 (UI 표시)
            setStatus("📸 카메라를 쳐다봐주세요");

            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("웹캠 오류:", err);
            setStatus("❌ 웹캠을 켤 수 없습니다. 권한을 확인해주세요.");
            setIsCamOpen(false);
        }
    };

    // 2. 웹캠 끄기 함수
    const stopWebcam = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCamOpen(false); // 상태 변경 (UI 숨김)
        setStatus("");
    };

    // 3. 얼굴 인식 시도 (파이썬 서버로 사진 전송)
    const handleFaceLogin = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setStatus("인식 중... ⏳");
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // 현재 화면 캡처
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        // 이미지 데이터 변환 (Base64)
        const imageData = canvas.toDataURL('image/jpeg');

        try {
            // ⭐ 파이썬 서버(5002번)로 전송
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
                    stopWebcam(); // 성공하면 캠 끄기
                    setAuthenticated(true);
                }, 1000);
            } else {
                setStatus("❌ " + data.msg);
            }
        } catch (err) {
            console.error(err);
            setStatus("❌ 서버 연결 실패 (파이썬 서버 5002 포트 확인)");
        }
    };

    // 기존 비밀번호 로그인
    const handlePasswordLogin = (e) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
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

                {/* --- 1. 얼굴 인식 섹션 --- */}
                <div style={{ marginBottom: '30px', borderBottom: '1px solid #374151', paddingBottom: '20px' }}>

                    {/* 카메라가 꺼져있을 때 보이는 버튼 */}
                    {!isCamOpen ? (
                        <button
                            onClick={startWebcam}
                            style={{ background: '#3B82F6', width: '100%', padding: '15px', fontSize: '1.1em' }}
                        >
                            📸 얼굴 인식 모드 켜기
                        </button>
                    ) : (
                        // 카메라가 켜졌을 때 보이는 화면
                        <div className="webcam-area" style={{ animation: 'fadeIn 0.5s' }}>
                            <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '15px' }}>
                                <video ref={videoRef} autoPlay muted style={{ width: '100%', height: '250px', objectFit: 'cover' }}></video>
                                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                            </div>

                            <p style={{ color: '#F97316', fontWeight: 'bold', marginBottom: '15px', minHeight: '24px' }}>
                                {status}
                            </p>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={handleFaceLogin}
                                    style={{ flex: 2, background: '#10B981' }} // 초록색 버튼
                                >
                                    ✅ 인증하기
                                </button>
                                <button
                                    onClick={stopWebcam}
                                    style={{ flex: 1, background: '#EF4444' }} // 빨간색 버튼
                                >
                                    닫기
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- 2. 비밀번호 로그인 섹션 --- */}
                <form onSubmit={handlePasswordLogin}>
                    <div className="input-group">
                        <label htmlFor="password">관리자 비밀번호:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호 입력"
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit">로그인</button>
                </form>
            </div>
        </div>
    );
}

export default AdminLoginPage;
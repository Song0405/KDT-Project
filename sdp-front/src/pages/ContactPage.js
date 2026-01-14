import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // 페이지 이동 도구 추가
import './ContactPage.css';

const ContactPage = () => {
    const navigate = useNavigate();
    const hasAlerted = useRef(false); // 알림창 중복 방지

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [writer, setWriter] = useState('');

    // ✨ [1] 페이지 들어오자마자 로그인 검사
    useEffect(() => {
        const storedName = localStorage.getItem('memberName');

        if (!storedName) {
            // 로그인이 안 되어 있다면?
            if (!hasAlerted.current) {
                hasAlerted.current = true;
                alert("로그인이 필요한 서비스입니다.\n로그인 페이지로 이동합니다.");
                navigate('/members/login'); // 로그인 페이지로 쫓아내기
            }
        } else {
            // 로그인 되어 있다면 작성자 이름 세팅
            setWriter(storedName);
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title || !content) {
            alert("제목과 내용을 모두 입력해주세요.");
            return;
        }

        try {
            await axios.post('http://localhost:8080/api/contact', {
                title: title,
                content: content,
                writer: writer // ✨ 로그인한 사람 이름으로 전송
            });

            alert("문의가 성공적으로 접수되었습니다! 🎉");
            setTitle('');
            setContent('');
            // 문의 후 마이페이지로 보내줄 수도 있습니다 (선택사항)
            // navigate('/members/mypage');

        } catch (error) {
            console.error("문의 전송 실패:", error);
            alert("문의 전송에 실패했습니다. 서버 상태를 확인해주세요.");
        }
    };

    // 로그인이 안 된 상태면 화면을 아예 안 보여줌 (깜빡임 방지)
    if (!writer) return null;

    return (
        <div style={{ padding: '50px', maxWidth: '600px', margin: '0 auto', color: 'white' }}>
            <h2 style={{borderBottom: '2px solid #00d4ff', paddingBottom: '10px', marginBottom: '30px'}}>1:1 문의하기</h2>

            {/* 작성자 표시 (읽기 전용) */}
            <div style={{ marginBottom: '20px', textAlign: 'right', color: '#888', fontSize: '0.9rem' }}>
                작성자: <span style={{ color: '#00d4ff', fontWeight: 'bold' }}>{writer}</span> 님
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>제목</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="문의 제목을 입력하세요"
                        style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>내용</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="문의 내용을 자세히 적어주세요"
                        rows="8"
                        style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                    />
                </div>
                <button
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '15px',
                        backgroundColor: '#00d4ff',
                        color: '#000',
                        border: 'none',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        transition: '0.3s'
                    }}
                >
                    문의 접수하기
                </button>
            </form>
        </div>
    );
};

export default ContactPage;
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; // 🍬 추가
import './ContactPage.css';

const ContactPage = () => {
    const navigate = useNavigate();
    const hasAlerted = useRef(false);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [writer, setWriter] = useState('');

    useEffect(() => {
        const storedName = localStorage.getItem('memberName');

        if (!storedName) {
            if (!hasAlerted.current) {
                hasAlerted.current = true;
                Swal.fire({
                    icon: 'warning', title: '로그인 필요', text: '문의를 작성하려면 로그인이 필요합니다.',
                    background: '#333', color: '#fff', confirmButtonColor: '#00d4ff'
                }).then(() => navigate('/members/login'));
            }
        } else {
            setWriter(storedName);
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title || !content) {
            Swal.fire({ icon:'warning', title:'입력 누락', text:'제목과 내용을 모두 입력해주세요.', background:'#333', color:'#fff' });
            return;
        }

        try {
            await axios.post('http://localhost:8080/api/contact', {
                title: title, content: content, writer: writer
            });

            Swal.fire({
                icon: 'success', title: '접수 완료! 🎉', text: '담당자가 곧 확인 후 답변드리겠습니다.',
                background: '#333', color: '#fff', confirmButtonColor: '#00d4ff'
            });
            setTitle('');
            setContent('');

        } catch (error) {
            console.error("문의 전송 실패:", error);
            Swal.fire({ icon:'error', title:'전송 실패', text:'서버 상태를 확인해주세요.', background:'#333', color:'#fff' });
        }
    };

    if (!writer) return null;

    return (
        <div style={{ padding: '50px', maxWidth: '600px', margin: '0 auto', color: 'white' }}>
            <h2 style={{borderBottom: '2px solid #00d4ff', paddingBottom: '10px', marginBottom: '30px'}}>1:1 문의하기</h2>

            <div style={{ marginBottom: '20px', textAlign: 'right', color: '#888', fontSize: '0.9rem' }}>
                작성자: <span style={{ color: '#00d4ff', fontWeight: 'bold' }}>{writer}</span> 님
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>제목</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="문의 제목을 입력하세요"
                           style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>내용</label>
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="문의 내용을 자세히 적어주세요" rows="8"
                              style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                    />
                </div>
                <button type="submit" style={{ width: '100%', padding: '15px', backgroundColor: '#00d4ff', color: '#000', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', borderRadius: '4px' }}>
                    문의 접수하기
                </button>
            </form>
        </div>
    );
};

export default ContactPage;
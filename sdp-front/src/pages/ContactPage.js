import React, { useState } from 'react';
import './ContactPage.css';

function ContactPage() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // 실제로는 여기서 API를 호출하여 서버로 데이터를 전송합니다.
        console.log('문의 제출:', { title, content });
        setIsSubmitted(true);
        setTitle('');
        setContent('');
        // 3초 후 다시 폼을 보여줍니다.
        setTimeout(() => setIsSubmitted(false), 3000);
    };

    return (
        <div className="contact-page-container">
            <h1>문의하기</h1>
            <p>궁금한 점이나 요청사항을 남겨주시면 관리자가 확인 후 답변해드립니다.</p>

            {isSubmitted ? (
                <div className="submission-success">
                    <h3>✅ 문의가 성공적으로 접수되었습니다.</h3>
                    <p>빠른 시일 내에 확인하겠습니다.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-group">
                        <label htmlFor="title">제목</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="제목을 입력하세요"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="content">내용</label>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            rows="10"
                            placeholder="문의하실 내용을 자세하게 입력해주세요."
                        ></textarea>
                    </div>
                    <button type="submit" className="submit-button">제출하기</button>
                </form>
            )}
        </div>
    );
}

export default ContactPage;


import React, { useState, useEffect } from 'react';
import './NoticePage.css'; // ✅ CSS 임포트

function NoticePage() {
    const [notices, setNotices] = useState([]);
    const [openId, setOpenId] = useState(null);

    useEffect(() => {
        fetch('http://localhost:8080/api/notices')
            .then(res => res.json())
            .then(data => {
                setNotices(data);
                if (data.length > 0) {
                    setOpenId(data[0].id);
                }
            })
            .catch(err => console.error("공지사항 로드 실패", err));
    }, []);

    const handleToggle = (id) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <div className="notice-container">
            <h2 className="notice-page-title">공지사항</h2>

            <div className="notice-list-container">
                {notices.map((notice) => (
                    <div key={notice.id} className="notice-item-wrapper">
                        {/* active 클래스를 조건부로 적용 */}
                        <div
                            onClick={() => handleToggle(notice.id)}
                            className={`notice-title-row ${openId === notice.id ? 'active' : ''}`}
                        >
                            <span className="notice-title-text">
                                {openId === notice.id ? '📂 ' : '📁 '}
                                {notice.title}
                            </span>
                            <div className="notice-right-info">
                                <span className="notice-date">{notice.date}</span>
                                <span className="notice-arrow">{openId === notice.id ? '▲' : '▼'}</span>
                            </div>
                        </div>

                        {openId === notice.id && (
                            <div className="notice-content-box">
                                {notice.content.split('\n').map((line, i) => (
                                    <p key={i} style={{ margin: '5px 0' }}>{line}</p>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default NoticePage;
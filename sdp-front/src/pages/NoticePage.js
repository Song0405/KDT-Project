import React, { useState, useEffect } from 'react';
import './NoticePage.css';

function NoticePage() {
    const [notices, setNotices] = useState([]);
    const [openId, setOpenId] = useState(null);

    useEffect(() => {
        // 공지사항 데이터 호출
        fetch('http://localhost:8080/api/notices')
            .then(res => res.json())
            .then(data => {
                setNotices(data);
                if (data.length > 0) {
                    setOpenId(data[0].id); // 첫 번째 공지사항 자동 열림
                }
            })
            .catch(err => console.error("공지사항 로드 실패", err));
    }, []);

    const handleToggle = (id) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <div className="notice-page-wrapper">
            <header className="notice-header">
                <h2 className="notice-page-title">STATION <span className="highlight">LOG</span></h2>
                <p className="notice-subtitle">ROOT STATION의 새로운 소식과 업데이트 기록을 확인하세요.</p>
            </header>

            <div className="notice-list-container">
                {notices.length > 0 ? (
                    notices.map((notice) => (
                        <div key={notice.id} className="notice-item-wrapper">
                            <div
                                onClick={() => handleToggle(notice.id)}
                                className={`notice-title-row ${openId === notice.id ? 'active' : ''}`}
                            >
                                <div className="notice-title-content">
                                    <span className="notice-category">// NOTICE</span>
                                    <span className="notice-title-text">{notice.title}</span>
                                </div>
                                <div className="notice-right-info">
                                    <span className="notice-date">{notice.date || '2026.01.12'}</span>
                                    <span className={`notice-arrow ${openId === notice.id ? 'up' : 'down'}`}>
                                        {openId === notice.id ? '▲' : '▼'}
                                    </span>
                                </div>
                            </div>

                            {openId === notice.id && (
                                <div className="notice-content-box">
                                    <div className="content-inner">
                                        {notice.content.split('\n').map((line, i) => (
                                            <p key={i} className="notice-text-line">{line}</p>
                                        ))}
                                    </div>
                                    <div className="notice-footer-line">END OF LINE_</div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="no-notice">등록된 공지사항이 없습니다.</div>
                )}
            </div>
        </div>
    );
}

export default NoticePage;
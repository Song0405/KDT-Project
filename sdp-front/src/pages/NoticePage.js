import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './NoticePage.css';

const API_BASE_URL = 'http://localhost:8080/api';

function NoticePage() {
    const [notices, setNotices] = useState([]);
    const [openId, setOpenId] = useState(null);

    useEffect(() => {
        // 공지사항 데이터 호출 (axios로 변경)
        axios.get(`${API_BASE_URL}/notices`)
            .then(res => {
                const data = res.data;
                setNotices(data);
                if (data.length > 0) {
                    setOpenId(data[0].id); // 첫 번째 공지사항 자동 열림
                }
            })
            .catch(err => {
                console.error("공지사항 로드 실패", err);
                // 서버 에러 시 사용자에게 알림
                Swal.fire({
                    icon: 'error',
                    title: '시스템 오류',
                    text: '공지사항을 불러오는 데 실패했습니다.',
                    background: '#333',
                    color: '#fff'
                });
            });
    }, []);

    const handleToggle = (id) => {
        setOpenId(openId === id ? null : id);
    };

    // 날짜 포맷 헬퍼 (서버에서 date, createdDate, createdAt 중 뭐로 줄지 몰라서 대비)
    const formatDate = (notice) => {
        const rawDate = notice.date || notice.createdDate || notice.createdAt;
        if (!rawDate) return '2026.01.22'; // 기본값
        return new Date(rawDate).toLocaleDateString();
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
                                    <span className="notice-category">NOTICE</span>
                                    <span className="notice-title-text">{notice.title}</span>
                                </div>
                                <div className="notice-right-info">
                                    {/* 날짜 포맷 적용 */}
                                    <span className="notice-date">{formatDate(notice)}</span>
                                    <span className={`notice-arrow ${openId === notice.id ? 'up' : 'down'}`}>
                                        {openId === notice.id ? '▲' : '▼'}
                                    </span>
                                </div>
                            </div>

                            {openId === notice.id && (
                                <div className="notice-content-box">
                                    <div className="content-inner">
                                        {/* 줄바꿈 문자(\n) 처리 */}
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
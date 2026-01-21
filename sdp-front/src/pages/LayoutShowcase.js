import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LayoutShowcase.css';

const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

const LayoutShowcase = () => {
    const [layouts, setLayouts] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('http://localhost:8080/api/layouts')
            .then(res => {
                setLayouts(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("데이터 로드 실패:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="loading">큐레이션을 준비 중입니다...</div>;
    if (layouts.length === 0) return <div className="loading">등록된 테마가 없습니다.</div>;

    const current = layouts[selectedIndex];

    return (
        <div className="layout-showcase-container">
            {/* 좌측: 테마 선택 및 가이드 텍스트 */}
            <aside className="layout-sidebar">
                <div className="sidebar-brand">CURATION GUIDE</div>



                {/* ⭐ 2열 그리드로 수정된 버튼 영역 */}
                <div className="theme-selector">
                    {layouts.map((layout, index) => (
                        <button
                            key={layout.id}
                            className={`theme-btn ${selectedIndex === index ? 'active' : ''}`}
                            onClick={() => setSelectedIndex(index)}
                        >
                            {layout.themeName}
                        </button>
                    ))}
                </div>

                <div className="theme-info-box">
                    <span className="concept-tag">CORE CONCEPT</span>
                    <h1>{current.themeName}</h1>
                    <p className="theme-desc">{current.description}</p>

                    <div className="design-tips">
                        <div className="tip-item">
                            <span className="tip-icon">📐</span>
                            <div>
                                <strong>비율의 조화</strong>
                                <p>데스크 상판의 60% 이상을 비워 여유로운 작업 공간을 확보하세요.</p>
                            </div>
                        </div>
                        <div className="tip-item">
                            <span className="tip-icon">💡</span>
                            <div>
                                <strong>조명 설계</strong>
                                <p>직접 조명보다는 벽에 반사되는 간접 조명을 활용해 눈의 피로를 낮추세요.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* 우측: 고화질 비주얼 영역 */}
            <main className="layout-visual">
                <div className="visual-frame">
                    <img
                        src={`${IMAGE_SERVER_URL}/${current.layoutImageUrl}`}
                        alt={current.themeName}
                        className="main-img"
                    />
                    <div className="visual-overlay">
                        <span className="overlay-tag">CONCEPT PREVIEW</span>
                        <h3>공간의 가치는 배치가 결정합니다.</h3>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LayoutShowcase;
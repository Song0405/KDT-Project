import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import SearchBar from '../components/SearchBar';

const API_BASE_URL = 'http://localhost:8080/api';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

const processSteps = [
    {
        id: 1,
        title: "공간 심리 분석",
        icon: "🧠",
        details: ["사용자 작업 패턴 정밀 진단", "시각적 노이즈 최소화 설계", "몰입을 위한 최적의 색온도 제안"]
    },
    {
        id: 2,
        title: "인체공학적 배치",
        icon: "📐",
        details: ["거북목 방지를 위한 시선 설계", "팔꿈치와 무릎의 90도 원칙", "동선을 고려한 장비 위치 최적화"]
    },
    {
        id: 3,
        title: "데스크테리어 큐레이션",
        icon: "✨",
        details: ["금속 가공 기술 기반의 메탈 감성", "소재의 통일감을 통한 시각적 안정", "나만의 독창적인 워크스테이션"]
    },
    {
        id: 4,
        title: "생산성 튜닝",
        icon: "🚀",
        details: ["업무 효율을 위한 케이블 정리 솔루션", "집중력을 높이는 주변 기기 세팅", "지속 가능한 작업 환경 완성"]
    }
];

const ProductImageWithRatio = ({ product }) => {
    const [imageRatio, setImageRatio] = useState(75);
    const imgRef = useRef();

    useEffect(() => {
        const img = imgRef.current;
        if (img) {
            const handleImageLoad = () => {
                if (img.naturalWidth > 0) {
                    setImageRatio((img.naturalHeight / img.naturalWidth) * 100);
                }
            };
            if (img.complete) handleImageLoad();
            else img.onload = handleImageLoad;
        }
    }, [product.imageFileName]);

    return (
        <div className="product-image-container" style={{ paddingTop: `${imageRatio}%` }}>
            <img
                ref={imgRef}
                src={`${IMAGE_SERVER_URL}/${product.imageFileName}`}
                alt={product.name}
                className="product-image"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Root+Station+Gear'; }}
            />
        </div>
    );
};

function HomePage() {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const productsRes = await axios.get(`${API_BASE_URL}/products`);
                setProducts(productsRes.data);
                setError(null);
            } catch (err) {
                console.error("데이터 로드 중 오류 발생:", err);
                setError("서버 데이터를 불러오는 데 실패했습니다.");
            }
        };
        fetchData();
    }, []);

    // 페이지 이동 시 최상단으로 스크롤하는 함수
    const handleNavigateToProducts = () => {
        navigate('/products');
        window.scrollTo(0, 0); // 이동 후 즉시 페이지 맨 위로 스크롤
    };

    return (
        <div className="home-page-container">
            {/* 1. 히어로 섹션 */}
            <section className="hero-section">
                <div className="hero-background-effects">
                    <div className="glow-circle top-left"></div>
                    <div className="glow-circle bottom-right"></div>
                    <div className="grid-overlay"></div>
                </div>

                <div className="hero-content">
                    <span className="hero-tagline">THE ART OF WORKSTATION LAYOUT</span>
                    <h1 className="brand-logo-text">ROOT STATION</h1>

                    <div style={{ marginTop: '20px', marginBottom: '30px' }}>
                        <SearchBar />
                    </div>

                    <p className="hero-subtext">
                        단순한 배치를 넘어, 당신의 몰입을 설계합니다.<br/>
                        전문가가 제안하는 **가장 효율적이고 아름다운 워크스테이션 가이드**.
                    </p>
                    <div className="hero-actions">
                        <button onClick={handleNavigateToProducts} className="hero-button primary">
                            GEAR LIBRARY
                        </button>
                        <button onClick={() => navigate('/layouts')} className="hero-button highlight">
                            VIEW LAYOUTS
                        </button>
                    </div>
                </div>
            </section>

            {error && <div className="error-message">{error}</div>}

            {/* 2. 주요 제품 섹션 */}
            <section id="products" className="info-section">
                <div className="section-header-wrap">
                    <div className="section-header">
                        <h2>Featured Selections</h2>
                        <p>공간의 완성도를 높이는 하이엔드 데스크 기어</p>
                    </div>

                    {/* ⭐ 버튼 위치를 그리드 상단으로 이동 */}
                    <div className="view-more-top">
                        <button onClick={handleNavigateToProducts} className="view-more-btn-text">
                            모든 장비 보기 <span className="arrow">→</span>
                        </button>
                    </div>
                </div>

                {products.length > 0 ? (
                    <div className="product-grid">
                        {products.slice(0, 4).map(product => (
                            <div
                                key={product.id}
                                className="product-card"
                                onClick={() => navigate(`/products/${product.id}`)}
                            >
                                {product.imageFileName && (
                                    <ProductImageWithRatio product={product} />
                                )}
                                <div className="product-card-body">
                                    <span className="category-tag">{product.category || 'PREMIUM'}</span>
                                    <h3>{product.name}</h3>
                                    <p className="product-card-desc">
                                        {product.description && product.description.length > 60
                                            ? `${product.description.substring(0, 60)}...`
                                            : product.description}
                                    </p>
                                    <p className="product-price">
                                        {product.price ? product.price.toLocaleString() : 0} KRW
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <div className="loading-text">큐레이션된 제품을 불러오는 중입니다.</div>}
            </section>

            {/* 3. 디자인 철학 섹션 */}
            <section className="info-section process-section">
                <div className="section-header">
                    <h2>Design Philosophy</h2>
                    <p>ROOT STATION이 제안하는 실패 없는 배치 공식</p>
                </div>
                <div className="process-horizontal-container">
                    {processSteps.map((step, index) => (
                        <div key={step.id} className="process-step-box">
                            <div className="process-step-header">
                                <span className="step-icon">{step.icon}</span>
                                <div className="step-number">STEP 0{index + 1}</div>
                                <h3>{step.title}</h3>
                            </div>
                            <ul className="process-detail-list">
                                {step.details.map((detail, idx) => (
                                    <li key={idx}>{detail}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="home-footer">
                <p>&copy; 2026 ROOT STATION. All Rights Reserved.</p>
            </footer>
        </div>
    );
}

export default HomePage;
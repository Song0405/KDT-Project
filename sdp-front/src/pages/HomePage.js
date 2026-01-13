import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import SearchBar from '../components/SearchBar'; // 👈 임포트는 잘 되어 있습니다!

// 백엔드 API 및 이미지 서버 설정
const API_BASE_URL = 'http://localhost:8080/api';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

// 셋업 가이드 데이터
const processSteps = [
    {
        id: 1,
        title: "맞춤 큐레이션",
        icon: "🔍",
        details: ["사용자 데스크 환경 정밀 분석", "최적의 하이엔드 장비 선별", "최신 데스크테리어 트렌드 반영"]
    },
    {
        id: 2,
        title: "호환성 검토",
        icon: "⚙️",
        details: ["하드웨어 간 연결 및 호환성 검증", "데스크 공간 효율 및 동선 계산", "모니터 암 및 거치대 최적 배치"]
    },
    {
        id: 3,
        title: "개인 커스터마이징",
        icon: "✨",
        details: ["사용자 맞춤형 키보드 빌드", "무드 조명 및 데스크 매트 스타일링", "세상에 하나뿐인 독창적인 워크스테이션"]
    },
    {
        id: 4,
        title: "퍼포먼스 최적화",
        icon: "🚀",
        details: ["업무 몰입도 극대화를 위한 환경 세팅", "워크플로우 및 생산성 향상 가이드", "지속적인 셋업 업그레이드 지원"]
    }
];

// 이미지 비율 유지 컴포넌트
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

            if (img.complete) {
                handleImageLoad();
            } else {
                img.onload = handleImageLoad;
            }
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
    const [companyInfo, setCompanyInfo] = useState(null);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [companyRes, productsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/company-info`),
                    axios.get(`${API_BASE_URL}/products`)
                ]);
                setCompanyInfo(companyRes.data);
                setProducts(productsRes.data);
                setError(null);
            } catch (err) {
                console.error("데이터 로드 중 오류 발생:", err);
                setError("서버 데이터를 불러오는 데 실패했습니다.");
            }
        };
        fetchData();
    }, []);

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
                    <span className="hero-tagline">// BUILD YOUR ULTIMATE WORKSTATION</span>
                    <h1 className="brand-logo-text">ROOT STATION</h1>

                    {/* 👇 [수정됨] 검색창을 여기에 배치했습니다! 👇 */}
                    <div style={{ marginTop: '20px', marginBottom: '30px' }}>
                        <SearchBar />
                    </div>

                    <p className="hero-subtext">
                        단순한 책상을 넘어, 당신의 몰입을 완성하는<br/>
                        가장 정교한 커스텀 워크스테이션 기어 큐레이션.
                    </p>
                    <div className="hero-actions">
                        <button onClick={() => navigate('/products')} className="hero-button primary">
                            SHOP GEARS
                        </button>
                        <button className="hero-button secondary">
                            VIEW SETUP GUIDE
                        </button>
                    </div>
                </div>
            </section>

            {error && <div className="error-message">{error}</div>}

            {/* 2. 주요 제품 섹션 */}
            <section id="products" className="info-section">
                <div className="section-header">
                    <h2>Featured Gears</h2>
                    <p>전문가들이 엄선한 고성능 데스크 기어</p>
                </div>
                {products.length > 0 ? (
                    <div className="product-grid">
                        {products.map(product => (
                            <div
                                key={product.id}
                                className="product-card"
                                onClick={() => navigate(`/products/${product.id}`)}
                            >
                                {product.imageFileName && (
                                    <ProductImageWithRatio product={product} />
                                )}
                                <div className="product-card-body">
                                    <span className="category-tag">PREMIUM SELECTION</span>
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
                ) : <div className="loading-text">새로운 장비들이 입고될 예정입니다.</div>}
            </section>

            {/* 3. 셋업 가이드 섹션 */}
            <section className="info-section process-section">
                <div className="section-header">
                    <h2>The Setup Guide</h2>
                    <p>최상의 워크스테이션을 구축하는 4단계 과정</p>
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
                            {index < processSteps.length - 1 && <div className="process-arrow">→</div>}
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. 푸터 */}
            <footer className="home-footer">
                <p>&copy; 2026 ROOT STATION. All Rights Reserved.</p>
            </footer>
        </div>
    );
}

export default HomePage;
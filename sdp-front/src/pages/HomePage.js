import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // ⭐ 페이지 이동을 위해 추가
import './HomePage.css';

const API_BASE_URL = 'http://localhost:8080/api';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

const processSteps = [
    {
        id: 1, title: "의뢰 (Request)", icon: "🤝",
        details: ["고객 요구사항 분석", "주문 접수", "스펙 협의"]
    },
    {
        id: 2, title: "설계 (Design)", icon: "💻",
        details: ["도면 작성", "공정 계획", "자재 선정", "시뮬레이션"]
    },
    {
        id: 3, title: "제작 (Fabrication)", icon: "⚒️",
        details: ["원자재 가공", "용접", "절곡", "정밀 가공"]
    },
    {
        id: 4, title: "납품 (Delivery)", icon: "🚚",
        details: ["품질 검사", "포장", "출하", "설치 지원"]
    }
];

// 이미지 비율 유지 컴포넌트
const ProductImageWithRatio = ({ product }) => {
    const [imageRatio, setImageRatio] = useState(75); // 기본값 4:3 (75%)
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
                onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
            />
        </div>
    );
};

function HomePage() {
    const [companyInfo, setCompanyInfo] = useState(null);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);

    // ⭐ 페이지 이동 훅 사용
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const companyRes = await axios.get(`${API_BASE_URL}/company-info`);
                setCompanyInfo(companyRes.data);

                const productsRes = await axios.get(`${API_BASE_URL}/products`);
                setProducts(productsRes.data);
                setError(null);
            } catch (err) {
                console.error("데이터를 불러오는데 실패했습니다.", err);
                setError("데이터를 불러올 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.");
            }
        };
        fetchData();
    }, []);


    return (
        <div className="home-page-container">
            {/* 히어로 섹션 */}
            {companyInfo && (
                <section className="hero-section">
                    <img src="/images/hero-background.jpg" alt="Steel Mill Background" className="hero-image" />
                    <div className="hero-content">
                        <h1>{companyInfo.name}</h1>
                        <p>{companyInfo.description}</p>
                        {/* 버튼 클릭 시 제품 목록 페이지로 이동 */}
                        <button onClick={() => navigate('/products')} className="hero-button" style={{cursor:'pointer'}}>
                            OUR PRODUCTS
                        </button>
                    </div>
                </section>
            )}

            {error && <div className="error-message">{error}</div>}

            {/* 회사 소개 섹션 */}
            <div className="info-section">
                <h2>회사 소개</h2>
                {companyInfo ? (
                    <div>
                        <p>{companyInfo.description}</p>
                        <p>주소: {companyInfo.address}</p>
                        <p>전화: {companyInfo.phone}</p>
                        <p>이메일: {companyInfo.email}</p>
                    </div>
                ) : <p>회사 정보를 불러오는 중...</p>}
            </div>

            {/* 주요 제품 섹션 */}
            <div id="products" className="info-section">
                <h2>주요 제품</h2>
                {products.length > 0 ? (
                    <div className="product-grid">
                        {products.map(product => (
                            <div
                                key={product.id}
                                className="product-card"
                                // ⭐⭐⭐ [수정됨] 클릭 시 상세 페이지로 이동! ⭐⭐⭐
                                onClick={() => navigate(`/products/${product.id}`)}
                            >
                                {product.imageFileName && (
                                    <ProductImageWithRatio product={product} />
                                )}
                                <div className="product-card-body">
                                    <h3>{product.name}</h3>
                                    <p className="product-description">
                                        {product.description.length > 80
                                            ? `${product.description.substring(0, 80)}...`
                                            : product.description}
                                    </p>
                                    <p className="product-price">{product.price?.toLocaleString()}원</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p>등록된 제품이 없습니다.</p>}
            </div>

            {/* 제조 공정 섹션 */}
            <div className="info-section">
                <h2>제조 공정</h2>
                <div className="process-horizontal-container">
                    {processSteps.map((step, index) => (
                        <div key={step.id} className="process-step-box">
                            <div className="process-step-header">
                                <span className="step-icon">{step.icon}</span>
                                <h3>{step.title}</h3>
                            </div>
                            <ul className="process-detail-list">
                                {step.details.map((detail, idx) => (
                                    <li key={idx}>{detail}</li>
                                ))}
                            </ul>
                            {index < processSteps.length - 1 && <div className="process-arrow">▶</div>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default HomePage;
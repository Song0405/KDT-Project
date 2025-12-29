import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './HomePage.css';

const API_BASE_URL = 'http://localhost:8080/api';
// 💡 추가: 백엔드 WebConfig에서 설정한 이미지 경로입니다.
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

// --- 독립적인 컴포넌트들 ---

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
                // 💡 수정: 로컬 /images/ 대신 서버 주소를 사용합니다.
                src={`${IMAGE_SERVER_URL}/${product.imageFileName}`}
                alt={product.name}
                className="product-image"
                // 💡 수정: 로드 실패 시 숨기는 대신 대체 이미지를 보여줄 수도 있습니다.
                onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
            />
        </div>
    );
};

const ExpandedProductCard = ({ product, onClose }) => {
    const [imageRatio, setImageRatio] = useState(75);
    const imgRef = useRef();

    useEffect(() => {
        const img = imgRef.current;
        if (img && product) {
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
    }, [product]);

    if (!product) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="expanded-product-card" onClick={(e) => e.stopPropagation()}>
                <div className="expanded-image-container" style={{ paddingTop: `${imageRatio}%` }}>
                    <img
                        ref={imgRef}
                        // 💡 수정: 서버 주소를 사용합니다.
                        src={`${IMAGE_SERVER_URL}/${product.imageFileName}`}
                        alt={product.name}
                        className="expanded-product-image"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/600x400?text=No+Image'; }}
                    />
                </div>
                <div className="expanded-product-info">
                    <h3>{product.name}</h3>
                    <p className="expanded-product-description">{product.description}</p>
                    <p className="expanded-product-price">{product.price?.toLocaleString()}원</p>
                    <button onClick={onClose} className="close-button">닫기</button>
                </div>
            </div>
        </div>
    );
};


function HomePage() {
    const [companyInfo, setCompanyInfo] = useState(null);
    const [notices, setNotices] = useState([]);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [expandedProduct, setExpandedProduct] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const companyRes = await axios.get(`${API_BASE_URL}/company-info`);
                setCompanyInfo(companyRes.data);
                const noticesRes = await axios.get(`${API_BASE_URL}/notices`);
                setNotices(noticesRes.data);
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
                    {/* 히어로 배경은 public/images에 있다면 그대로 둡니다. */}
                    <img src="/images/hero-background.jpg" alt="Steel Mill Background" className="hero-image" />
                    <div className="hero-content">
                        <h1>{companyInfo.name}</h1>
                        <p>{companyInfo.description}</p>
                        <a href="#products" className="hero-button">OUR PRODUCTS</a>
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
                            <div key={product.id} className="product-card" onClick={() => setExpandedProduct(product)}>
                                {product.imageFileName && (
                                    <ProductImageWithRatio product={product} />
                                )}
                                <div className="product-card-body">
                                    <h3>{product.name}</h3>
                                    {/* 글자수가 너무 많을 경우를 대비해 자르기 유지 */}
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
            {/* ⭐ 가로 정렬로 수정된 제조 공정 섹션 */}
            <div className="info-section">
                <h2>제조 공정</h2>
                <div className="process-horizontal-container">
                    {processSteps.map((step, index) => (
                        <div key={step.id} className="process-step-box">
                            {/* 상단 타이틀 영역 */}
                            <div className="process-step-header">
                                <span className="step-icon">{step.icon}</span>
                                <h3>{step.title}</h3>
                            </div>

                            {/* 상세 내용 리스트 영역 */}
                            <ul className="process-detail-list">
                                {step.details.map((detail, idx) => (
                                    <li key={idx}>{detail}</li>
                                ))}
                            </ul>

                            {/* 단계 사이 화살표 (마지막 제외) */}
                            {index < processSteps.length - 1 && <div className="process-arrow">▶</div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* 공지사항 섹션 */}
            <div className="info-section">
                <h2>공지사항</h2>
                {notices.length > 0 ? (
                    <ul className="notice-list">
                        {notices.map(notice => (
                            <li key={notice.id} className="notice-item">
                                <strong>{notice.title}</strong>
                                <p>{notice.content}</p>
                            </li>
                        ))}
                    </ul>
                ) : <p>등록된 공지사항이 없습니다.</p>}
            </div>

            <ExpandedProductCard product={expandedProduct} onClose={() => setExpandedProduct(null)} />
        </div>
    );
}

export default HomePage;
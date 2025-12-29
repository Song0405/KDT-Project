import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './HomePage.css';

const API_BASE_URL = 'http://localhost:8080/api';

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
                src={`/images/${product.imageFileName}`}
                alt={product.name}
                className="product-image"
                onError={(e) => { e.target.style.display = 'none'; }} // 이미지 로드 실패 시 숨김
            />
        </div>
    );
};

// ExpandedProductCard 컴포넌트 수정: 조건문 위치 변경
const ExpandedProductCard = ({ product, onClose }) => {
    // Hook들을 최상위 레벨에서 호출
    const [imageRatio, setImageRatio] = useState(75); // 기본값 4:3 (75%)
    const imgRef = useRef();

    useEffect(() => {
        const img = imgRef.current;
        if (img && product) { // product가 있을 때만 이미지 로딩 로직 실행
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
    }, [product]); // product가 변경될 때마다 다시 실행

    //  Hook 호출 이후에 조건문을 사용하여 렌더링을 제어
    if (!product) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="expanded-product-card" onClick={(e) => e.stopPropagation()}>
                <div className="expanded-image-container" style={{ paddingTop: `${imageRatio}%` }}>
                    <img
                        ref={imgRef}
                        src={`/images/${product.imageFileName}`}
                        alt={product.name}
                        className="expanded-product-image"
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
                    <img src="/images/hero-background.jpg" alt="Steel Mill Background" className="hero-image" />
                    <div className="hero-content">
                        <h1>{companyInfo.name}</h1>
                        <p>{companyInfo.description}</p>
                        <a href="#products" className="hero-button">OUR PRODUCTS</a>
                    </div>
                </section>
            )}

            {error && <div className="error-message">{error}</div>}

            {/* 나머지 정보 섹션 */}
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
                                    <p className="product-description">{product.description.substring(0, 80)}...</p>
                                    <p className="product-price">{product.price?.toLocaleString()}원</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p>등록된 제품이 없습니다.</p>}
            </div>

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
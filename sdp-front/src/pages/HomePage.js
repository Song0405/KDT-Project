import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import SearchBar from '../components/SearchBar';

const API_BASE_URL = 'http://localhost:8080/api';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

// 이미지 비율 계산 컴포넌트 (생략 없이 유지)
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
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Root+Station'; }}
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
                // 페이지네이션이 적용된 서버는 데이터를 content에 담아 보냅니다.
                const res = await axios.get(`${API_BASE_URL}/products?page=0&size=4`);
                const data = res.data.content ? res.data.content : res.data;
                setProducts(data);
                setError(null);
            } catch (err) {
                console.error("데이터 로드 중 오류 발생:", err);
                setError("서버 데이터를 불러오는 데 실패했습니다.");
            }
        };
        fetchData();
    }, []);

    const handleNavigateToProducts = () => {
        navigate('/products');
        window.scrollTo(0, 0);
    };

    return (
        <div className="home-page-container">
            <section className="hero-section">
                <div className="hero-content">
                    <span className="hero-tagline">THE ART OF WORKSTATION LAYOUT</span>
                    <h1 className="brand-logo-text">ROOT STATION</h1>
                    <div style={{ marginTop: '20px', marginBottom: '30px' }}><SearchBar /></div>
                    <p className="hero-subtext">당신의 몰입을 설계합니다. <br/>전문가가 제안하는 메탈 감성 워크스테이션 가이드</p>
                    <div className="hero-actions">
                        <button onClick={handleNavigateToProducts} className="hero-button primary">GEAR LIBRARY</button>
                    </div>
                </div>
            </section>

            <section id="products" className="info-section">
                <div className="section-header-wrap">
                    <div className="section-header">
                        <h2>Featured Selections</h2>
                        <p>공간의 완성도를 높이는 하이엔드 데스크 기어</p>
                    </div>
                    <div className="view-more-top">
                        <button onClick={handleNavigateToProducts} className="view-more-btn-text">모든 장비 보기 →</button>
                    </div>
                </div>

                {products.length > 0 ? (
                    <div className="product-grid">
                        {products.map(product => (
                            <div key={product.id} className="product-card" onClick={() => navigate(`/products/${product.id}`)}>
                                <ProductImageWithRatio product={product} />
                                <div className="product-card-body">
                                    <span className="category-tag">{product.category || 'PREMIUM'}</span>
                                    <h3>{product.name}</h3>
                                    <p className="product-price">{Number(product.price).toLocaleString()} KRW</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <div className="loading-text">큐레이션된 제품을 불러오는 중입니다. 📡</div>}
            </section>

            <footer className="home-footer"><p>&copy; 2026 ROOT STATION. All Rights Reserved.</p></footer>
        </div>
    );
}

export default HomePage;
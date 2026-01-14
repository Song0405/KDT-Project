import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProductListPage.css';

const API_BASE_URL = 'http://localhost:8080/api/products';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

function ProductListPage() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await axios.get(API_BASE_URL);
            setProducts(response.data);
            setFilteredProducts(response.data);
        } catch (err) {
            console.error("데이터 로드 실패:", err);
        } finally {
            setLoading(false);
        }
    };

    // ⭐ 카테고리 및 검색어 필터링 핵심 로직
    useEffect(() => {
        let result = products;

        // 1. 카테고리 필터링 (대소문자 무시 비교)
        if (activeCategory !== 'ALL') {
            result = result.filter(p =>
                p.category && p.category.toUpperCase() === activeCategory.toUpperCase()
            );
        }

        // 2. 검색어 필터링
        if (searchTerm) {
            result = result.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredProducts(result);
    }, [searchTerm, activeCategory, products]);

    if (loading) return <div className="loading-screen">시스템 장비 동기화 중...</div>;

    return (
        <div className="product-list-wrapper">
            <header className="list-header">
                <h1 className="list-title">GEAR <span className="highlight">LIBRARY</span></h1>

                <div className="filter-container">
                    {/* 검색 영역 */}
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="찾으시는 장비명을 입력하세요..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* 카테고리 탭 영역 (DB의 카테고리 값과 일치해야 함) */}
                    <div className="category-tabs">
                        {['ALL', 'KEYBOARD', 'PC', 'MONITOR', 'ACC'].map(cat => (
                            <button
                                key={cat}
                                className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="gear-grid">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="gear-card"
                            onClick={() => navigate(`/products/${product.id}`)}
                        >
                            <div className="gear-img-container">
                                <img
                                    src={product.imageFileName
                                        ? (product.imageFileName.startsWith('http')
                                            ? product.imageFileName
                                            : `${IMAGE_SERVER_URL}/${product.imageFileName}`)
                                        : 'https://via.placeholder.com/400x300?text=ROOT+STATION'}
                                    alt={product.name}
                                    className="gear-img"
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=NO+IMAGE'; }}
                                />
                                <div className="card-overlay">
                                    <span>상세 정보 보기</span>
                                </div>
                            </div>

                            <div className="gear-content">
                                <div className="gear-category">// {product.category || 'PREMIUM'}</div>
                                <h3 className="gear-name">{product.name}</h3>
                                <div className="gear-footer">
                                    <span className="gear-price">{product.price?.toLocaleString()} KRW</span>
                                    <button className="gear-action-btn">→</button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-gear-message">
                        <p>선택하신 카테고리에 등록된 장비가 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProductListPage;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProductListPage.css';

const API_BASE_URL = 'http://localhost:8080/api/products';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

function ProductListPage() {
    // 1. 상태 관리 (용도와 카테고리 둘 다 관리)
    const [products, setProducts] = useState([]);         // 서버에서 받아온 원본 데이터
    const [filteredProducts, setFilteredProducts] = useState([]); // 화면에 보여줄 최종 데이터

    const [activeUsage, setActiveUsage] = useState('ALL');    // 1차 필터: 용도 (GAMING, OFFICE...)
    const [activeCategory, setActiveCategory] = useState('ALL'); // 2차 필터: 카테고리 (PC, KEYBOARD...)
    const [searchTerm, setSearchTerm] = useState('');         // 검색어

    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // 2. 서버에서 데이터 가져오기 (activeUsage가 바뀔 때마다 실행)
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                // 용도(Usage)에 따라 서버에 요청 (전체 or 특정 용도)
                const url = activeUsage === 'ALL'
                    ? API_BASE_URL
                    : `${API_BASE_URL}?usage=${activeUsage}`;

                const response = await axios.get(url);
                setProducts(response.data);
                // 가져온 직후에는 아직 카테고리 필터를 적용하지 않음 (useEffect에서 처리)
            } catch (err) {
                console.error("데이터 로드 실패:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [activeUsage]); // 👈 용도 버튼을 누르면 서버에서 새로 가져옴!


    // 3. 프론트엔드 필터링 (데이터가 변경되거나, 카테고리/검색어가 바뀔 때 실행)
    useEffect(() => {
        let result = products;

        // (1) 카테고리 탭 필터링 (KEYBOARD, PC 등)
        if (activeCategory !== 'ALL') {
            result = result.filter(p =>
                p.category && p.category.toUpperCase() === activeCategory.toUpperCase()
            );
        }

        // (2) 검색어 필터링
        if (searchTerm) {
            result = result.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        setFilteredProducts(result);
    }, [products, activeCategory, searchTerm]); // 👈 여기가 핵심!


    if (loading) return <div className="loading-screen">장비 데이터 동기화 중...</div>;

    return (
        <div className="product-list-wrapper">
            <header className="list-header">
                <h1 className="list-title">GEAR <span className="highlight">LIBRARY</span></h1>

                <div className="filter-container">
                    {/* [NEW] 1. 용도 선택 버튼 (상단에 배치) */}
                    <div className="usage-filter-buttons">
                        {['ALL', 'GAMING', 'OFFICE', 'EXPERT'].map(usage => (
                            <button
                                key={usage}
                                className={`usage-btn ${activeUsage === usage ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveUsage(usage);
                                    setActiveCategory('ALL'); // 용도 바꾸면 카테고리는 전체로 초기화
                                }}
                            >
                                {usage === 'EXPERT' ? 'WORKSTATION' : usage} {/* 화면엔 멋진 이름으로 */}
                            </button>
                        ))}
                    </div>

                    <div className="search-bar" style={{marginTop: '15px'}}>
                        <input
                            type="text"
                            placeholder="찾으시는 장비명을 입력하세요..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* [RESTORED] 2. 기존 카테고리 탭 (하단 탭) */}
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

            {/* 상품 리스트 그리드 */}
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
                                    <span>VIEW DETAIL</span>
                                </div>
                            </div>

                            <div className="gear-content">
                                {/* 카테고리와 용도를 같이 보여줌 */}
                                <div className="gear-category">
                                    // {product.usageType || 'GEAR'} &gt; {product.category}
                                </div>
                                <h3 className="gear-name">{product.name}</h3>
                                <div className="gear-footer">
                                    <span className="gear-price">
                                        {product.price ? product.price.toLocaleString() : 0} KRW
                                    </span>
                                    <button className="gear-action-btn">→</button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-gear-message">
                        <p>선택하신 조건에 맞는 장비가 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProductListPage;
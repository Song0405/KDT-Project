import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProductListPage.css'; // 스타일 파일 (아까 주신 CSS 사용)

const API_BASE_URL = 'http://localhost:8080/api';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

function ProductListPage() {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // ⭐ [핵심] 필터 상태 관리
    // usageFilter: GAMING, OFFICE, WORKSTATION
    // categoryFilter: KEYBOARD, PC, MONITOR, ACC
    const [usageFilter, setUsageFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');

    const navigate = useNavigate();

    // 1. 데이터 가져오기 (전체 상품)
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/products`);
            setProducts(res.data);
        } catch (err) {
            console.error("상품 목록 로드 실패:", err);
        }
    };

    // ⭐ 2. 교집합(AND) 필터링 로직
    const filteredProducts = products.filter(p => {
        // (1) 용도 필터 (DB에 저장된 p.usage 값과 비교)
        // p.usage가 없을 수도 있으니 안전하게 체크
        const productUsage = p.usage || 'GAMING'; // 없으면 기본값 처리
        const matchUsage = (usageFilter === 'ALL') || (productUsage === usageFilter);

        // (2) 카테고리 필터
        const matchCategory = (categoryFilter === 'ALL') || (p.category === categoryFilter);

        // (3) 검색어 필터
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());

        // 셋 다 만족해야 함 (AND 조건)
        return matchUsage && matchCategory && matchSearch;
    });

    return (
        <div className="product-list-wrapper">
            <div className="list-header">
                <h1 className="list-title">GEAR <span className="highlight">LIBRARY</span></h1>
                <p className="list-subtitle">당신의 워크스테이션을 완성할 최고의 장비들을 만나보세요.</p>
            </div>

            {/* 필터 & 검색 컨테이너 */}
            <div className="filter-container">

                {/* 1. 용도(Usage) 필터 버튼 (상단) */}
                <div className="usage-filter-buttons">
                    {['ALL', 'GAMING', 'OFFICE', 'WORKSTATION'].map(usage => (
                        <button
                            key={usage}
                            className={`usage-btn ${usageFilter === usage ? 'active' : ''}`}
                            onClick={() => setUsageFilter(usage)}
                        >
                            {usage}
                        </button>
                    ))}
                </div>

                {/* 검색창 */}
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="찾으시는 장비명을 입력하세요..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* 2. 카테고리(Category) 필터 버튼 (하단) */}
                <div className="category-tabs">
                    {['ALL', 'KEYBOARD', 'PC', 'MONITOR', 'ACC'].map(cat => (
                        <button
                            key={cat}
                            className={`cat-tab ${categoryFilter === cat ? 'active' : ''}`}
                            onClick={() => setCategoryFilter(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* 결과 목록 그리드 */}
            <div className="gear-grid">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(p => (
                        <div key={p.id} className="gear-card" onClick={() => navigate(`/products/${p.id}`)}>
                            <div className="gear-img-container">
                                <img
                                    src={`${IMAGE_SERVER_URL}/${p.imageFileName}`}
                                    alt={p.name}
                                    className="gear-img"
                                    onError={(e) => {e.target.src = 'https://via.placeholder.com/300?text=No+Image'}}
                                />
                                <div className="card-overlay">
                                    <span>VIEW DETAILS</span>
                                </div>
                            </div>
                            <div className="gear-content">
                                {/* 디버깅용: 실제 적용된 태그 보여주기 */}
                                <div className="gear-category">
                                    [{p.usage || 'GAMING'}] {p.category}
                                </div>
                                <h3 className="gear-name">{p.name}</h3>
                                <div className="gear-footer">
                                    <span className="gear-price">{p.price.toLocaleString()} KRW</span>
                                    <button className="gear-action-btn">➜</button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-gear-message">
                        <p>해당 조건에 맞는 장비가 없습니다. 📡</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProductListPage;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProductListPage.css';

const API_BASE_URL = 'http://localhost:8080/api';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

function ProductListPage() {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // 필터 상태
    const [usageFilter, setUsageFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');

    // ⭐ [추가 1] 정렬 상태 관리 (기본값: 최신순 'latest')
    const [sortOrder, setSortOrder] = useState('latest');

    const navigate = useNavigate();

    // ⭐ [수정 1] 데이터 가져오기 (sortOrder가 바뀔 때마다 실행됨!)
    useEffect(() => {
        fetchProducts();
    }, [sortOrder]); // 👈 여기에 sortOrder를 넣어서, 선택할 때마다 재실행되게 함

    const fetchProducts = async () => {
        try {
            // ⭐ [수정 2] 서버에 요청할 때 ?sort=... 를 붙여서 보냄
            const res = await axios.get(`${API_BASE_URL}/products?sort=${sortOrder}`);
            setProducts(res.data);
        } catch (err) {
            console.error("상품 목록 로드 실패:", err);
        }
    };

    // 교집합 필터링 로직 (프론트엔드 필터)
    const filteredProducts = products.filter(p => {
        const productUsage = p.usage || 'GAMING';
        const matchUsage = (usageFilter === 'ALL') || (productUsage === usageFilter);
        const matchCategory = (categoryFilter === 'ALL') || (p.category === categoryFilter);
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
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

                {/* 1. 용도 필터 */}
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

                {/* 2. 검색창 및 정렬 드롭다운 */}
                <div className="search-bar" style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        placeholder="찾으시는 장비명을 입력하세요..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: 1 }}
                    />

                    {/* ⭐ [추가 2] 정렬 선택 드롭다운 (여기 추가됨!) */}
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        style={{
                            padding: '0 15px',
                            borderRadius: '50px',
                            border: '1px solid #333',
                            background: '#111',
                            color: '#fff',
                            cursor: 'pointer',
                            height: '50px' // 검색창 높이와 맞춤
                        }}
                    >
                        <option value="latest">⚡ 최신 등록순</option>
                        <option value="low">💰 낮은 가격순</option>
                        <option value="high">💎 높은 가격순</option>
                        <option value="name">가나다순</option>
                    </select>
                </div>

                {/* 3. 카테고리 필터 */}
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
                                <div className="gear-category">
                                    [{p.usage || 'GAMING'}] {p.category}
                                </div>
                                <h3 className="gear-name">{p.name}</h3>
                                <div className="gear-footer">
                                    <span className="gear-price">{Number(p.price).toLocaleString()} KRW</span>
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
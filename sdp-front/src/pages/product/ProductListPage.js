import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProductListPage.css';

const API_BASE_URL = 'http://localhost:8080/api';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

function ProductListPage() {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [usageFilter, setUsageFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [sortOrder, setSortOrder] = useState('latest');

    // 페이지네이션 상태 (0부터 시작)
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const itemsPerPage = 20;

    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
    }, [currentPage, sortOrder]);

    const fetchProducts = async () => {
        try {
            // 주소 중복(/api/api) 해결을 위해 정확한 경로 사용
            const res = await axios.get(
                `${API_BASE_URL}/products?page=${currentPage}&size=${itemsPerPage}&sort=${sortOrder}`
            );
            setProducts(res.data.content);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error("데이터 로드 실패 (CORS 또는 경로 확인 필요):", err);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="product-list-wrapper">
            <div className="list-header">
                <h1 className="list-title">GEAR <span className="highlight">LIBRARY</span></h1>
                <p className="list-subtitle">최상의 퍼포먼스를 위한 루트 스테이션의 정밀 가공 기어 라인업입니다.</p>
            </div>

            <div className="filter-container">
                {/* 용도 필터 */}
                <div className="usage-filter-buttons">
                    {['ALL', 'GAMING', 'OFFICE', 'WORKSTATION'].map(usage => (
                        <button key={usage} className={`usage-btn ${usageFilter === usage ? 'active' : ''}`} onClick={() => {setUsageFilter(usage); setCurrentPage(0);}}>
                            {usage}
                        </button>
                    ))}
                </div>

                {/* ✨ 개선된 검색 & 정렬 바 (사진 속 어색한 부분 수정) */}
                <div className="search-sort-combined-row">
                    <div className="search-box">
                        <input type="text" placeholder="장비명을 검색하세요..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="sort-box">
                        <select value={sortOrder} onChange={(e) => {setSortOrder(e.target.value); setCurrentPage(0);}}>
                            <option value="latest">⚡ 최신 등록순</option>
                            <option value="low">💰 낮은 가격순</option>
                            <option value="high">💎 높은 가격순</option>
                            <option value="name">가나다순</option>
                        </select>
                    </div>
                </div>

                {/* 카테고리 탭 */}
                <div className="category-tabs">
                    {['ALL', 'KEYBOARD', 'PC', 'MONITOR', 'ACC'].map(cat => (
                        <button key={cat} className={`cat-tab ${categoryFilter === cat ? 'active' : ''}`} onClick={() => {setCategoryFilter(cat); setCurrentPage(0);}}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* 제품 그리드 (5x4) */}
            <div className="gear-grid">
                {products.filter(p => {
                    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchUsage = usageFilter === 'ALL' || (p.usage || 'GAMING') === usageFilter;
                    const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
                    return matchSearch && matchUsage && matchCategory;
                }).map(p => (
                    <div key={p.id} className="gear-card" onClick={() => navigate(`/products/${p.id}`)}>
                        <div className="gear-img-container">
                            <img src={`${IMAGE_SERVER_URL}/${p.imageFileName}`} alt={p.name} className="gear-img" onError={(e) => e.target.src = 'https://via.placeholder.com/300?text=ROOT+STATION'} />
                            <div className="card-overlay"><span>VIEW DETAILS</span></div>
                        </div>
                        <div className="gear-content">
                            <div className="gear-category">[{p.usage || 'GAMING'}] {p.category}</div>
                            <h3 className="gear-name">{p.name}</h3>
                            <div className="gear-footer">
                                <span className="gear-price">{Number(p.price).toLocaleString()} KRW</span>
                                <button className="gear-action-btn">➜</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ✨ 개선된 페이지네이션 (사진 속 어색한 부분 수정) */}
            {totalPages > 0 && (
                <div className="pagination-container">
                    <button className="nav-btn" disabled={currentPage === 0} onClick={() => handlePageChange(currentPage - 1)}>PREV</button>
                    <div className="page-list">
                        {[...Array(totalPages)].map((_, idx) => (
                            <button key={idx} className={`num-btn ${currentPage === idx ? 'active' : ''}`} onClick={() => handlePageChange(idx)}>
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                    <button className="nav-btn" disabled={currentPage === totalPages - 1} onClick={() => handlePageChange(currentPage + 1)}>NEXT</button>
                </div>
            )}
        </div>
    );
}

export default ProductListPage;
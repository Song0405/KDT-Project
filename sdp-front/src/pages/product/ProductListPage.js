import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom'; // useLocation 추가
import './ProductListPage.css';

const API_BASE_URL = 'http://localhost:8080/api';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

function ProductListPage() {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [usageFilter, setUsageFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [sortOrder, setSortOrder] = useState('latest');

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const itemsPerPage = 100; // 검색을 위해 한 번에 많이 가져옴 (임시)

    const navigate = useNavigate();
    const location = useLocation(); // 메인에서 보낸 정보 받기

    // 1. 제품 데이터 로드
    useEffect(() => {
        fetchProducts();
    }, [currentPage, sortOrder]);

    // 2. 메인에서 검색해서 들어왔을 때 검색어 적용
    useEffect(() => {
        if (location.state?.searchKeyword) {
            setSearchTerm(location.state.searchKeyword);
        }
        // AI 이미지 검색 결과가 있다면 (파일명 비교 등 로직 확장 가능)
        if (location.state?.aiImageFile) {
            // 임시로 파일명이 포함된 제품을 찾도록 설정
            // 실제로는 백엔드에서 파일명으로 검색하는 API가 필요할 수 있음
            console.log("AI 검색 파일명:", location.state.aiImageFile);
        }
    }, [location.state]);

    const fetchProducts = async () => {
        try {
            const res = await axios.get(
                `${API_BASE_URL}/products?page=${currentPage}&size=${itemsPerPage}&sort=${sortOrder}`
            );
            // content가 있으면 content, 없으면 data (구조 방어)
            setProducts(res.data.content || res.data);
            setTotalPages(res.data.totalPages || 1);
        } catch (err) {
            console.error("데이터 로드 실패:", err);
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
                <div className="usage-filter-buttons">
                    {['ALL', 'GAMING', 'OFFICE', 'WORKSTATION'].map(usage => (
                        <button key={usage} className={`usage-btn ${usageFilter === usage ? 'active' : ''}`} onClick={() => {setUsageFilter(usage); setCurrentPage(0);}}>
                            {usage}
                        </button>
                    ))}
                </div>

                <div className="search-sort-combined-row">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="장비명을 검색하세요..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
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

                <div className="category-tabs">
                    {['ALL', 'KEYBOARD', 'PC', 'MONITOR', 'ACC'].map(cat => (
                        <button key={cat} className={`cat-tab ${categoryFilter === cat ? 'active' : ''}`} onClick={() => {setCategoryFilter(cat); setCurrentPage(0);}}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* 필터링된 결과 표시 */}
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

            {/* 검색 결과가 없을 때 메시지 */}
            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                <div style={{textAlign:'center', padding:'50px', color:'#666'}}>
                    검색 결과가 없습니다.
                </div>
            )}
        </div>
    );
}

export default ProductListPage;
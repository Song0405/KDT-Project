import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
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

    const itemsPerPage = 20; // 5가로 x 4세로
    const navigate = useNavigate();
    const location = useLocation();

    // 1. 데이터 로드 (한 번에 전체를 가져와 프론트에서 필터링하거나, 백엔드 사양에 맞춤)
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // 페이지네이션을 프론트에서 제어하기 위해 일단 넉넉히 가져옴
                // (실제 운영 환경에서는 백엔드 API에 필터 조건을 파라미터로 보내는 것이 좋습니다)
                const res = await axios.get(`${API_BASE_URL}/products?size=1000`);
                setProducts(res.data.content || res.data);
            } catch (err) {
                console.error("데이터 로드 실패:", err);
            }
        };
        fetchProducts();
    }, []);

    // 2. 메인 페이지에서 전달된 검색어 처리
    useEffect(() => {
        if (location.state?.searchKeyword) {
            setSearchTerm(location.state.searchKeyword);
        }
    }, [location.state]);

    // 3. 필터링 및 정렬 로직 (이 계산 결과가 실제 화면에 보일 대상)
    const filteredProducts = useMemo(() => {
        let result = [...products];

        // 검색어 필터
        if (searchTerm) {
            result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        // 용도 필터
        if (usageFilter !== 'ALL') {
            result = result.filter(p => (p.usage || 'GAMING') === usageFilter);
        }
        // 카테고리 필터
        if (categoryFilter !== 'ALL') {
            result = result.filter(p => p.category === categoryFilter);
        }

        // 정렬
        if (sortOrder === 'low') result.sort((a, b) => a.price - b.price);
        else if (sortOrder === 'high') result.sort((a, b) => b.price - a.price);
        else if (sortOrder === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
        else result.sort((a, b) => b.id - a.id); // latest (기본값)

        return result;
    }, [products, searchTerm, usageFilter, categoryFilter, sortOrder]);

    // 4. 페이지네이션 계산
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const currentItems = filteredProducts.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    );

    // 필터 변경 시 첫 페이지로 이동
    const handleFilterChange = (type, value) => {
        if (type === 'usage') setUsageFilter(value);
        if (type === 'category') setCategoryFilter(value);
        if (type === 'search') setSearchTerm(value);
        if (type === 'sort') setSortOrder(value);
        setCurrentPage(0);
    };

    const handlePageChange = (pageIndex) => {
        setCurrentPage(pageIndex);
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
                        <button
                            key={usage}
                            className={`usage-btn ${usageFilter === usage ? 'active' : ''}`}
                            onClick={() => handleFilterChange('usage', usage)}
                        >
                            {usage}
                        </button>
                    ))}
                </div>

                {/* 검색 및 정렬 */}
                <div className="search-sort-combined-row">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="장비명을 검색하세요..."
                            value={searchTerm}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                    <div className="sort-box">
                        <select value={sortOrder} onChange={(e) => handleFilterChange('sort', e.target.value)}>
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
                        <button
                            key={cat}
                            className={`cat-tab ${categoryFilter === cat ? 'active' : ''}`}
                            onClick={() => handleFilterChange('category', cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* 상품 그리드 (가로 5개) */}
            <div className="gear-grid">
                {currentItems.map(p => (
                    <div key={p.id} className="gear-card" onClick={() => navigate(`/products/${p.id}`)}>
                        <div className="gear-img-container">
                            <img
                                src={`${IMAGE_SERVER_URL}/${p.imageFileName}`}
                                alt={p.name}
                                className="gear-img"
                                onError={(e) => e.target.src = 'https://via.placeholder.com/300?text=ROOT+STATION'}
                            />
                            <div className="card-overlay"><span>VIEW DETAILS</span></div>
                        </div>
                        <div className="gear-content">
                            <div className="gear-category">[{p.usage || 'GAMING'}] {p.category}</div>
                            <h3 className="gear-name">{p.name}</h3>
                            <div className="gear-footer">
                                <span className="gear-price">{Number(p.price).toLocaleString()} KRW</span>
                                <button className="gear-action-btn" style={{background:'none', border:'none', color:'#00d4ff', cursor:'pointer', fontSize:'1.2rem'}}>➜</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 검색 결과 없음 */}
            {filteredProducts.length === 0 && (
                <div style={{textAlign:'center', padding:'100px', color:'#555', fontSize:'1.2rem'}}>
                    검색 결과가 없습니다. 다른 검색어를 입력해보세요.
                </div>
            )}

            {/* 페이지네이션 (요청하신 스타일 적용) */}
            {totalPages > 1 && (
                <div className="pagination-container">
                    <button
                        className="nav-btn"
                        disabled={currentPage === 0}
                        onClick={() => handlePageChange(currentPage - 1)}
                    >
                        PREV
                    </button>

                    <div className="page-list">
                        {[...Array(totalPages)].map((_, idx) => (
                            <button
                                key={idx}
                                className={`num-btn ${currentPage === idx ? 'active' : ''}`}
                                onClick={() => handlePageChange(idx)}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    <button
                        className="nav-btn"
                        disabled={currentPage === totalPages - 1}
                        onClick={() => handlePageChange(currentPage + 1)}
                    >
                        NEXT
                    </button>
                </div>
            )}
        </div>
    );
}

export default ProductListPage;
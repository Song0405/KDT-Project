import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

// 서버 주소 설정
const API_BASE_URL = 'http://localhost:8080/api';
const AI_SERVER_URL = 'http://localhost:5002'; // 🐍 파이썬 AI 서버

const SearchBar = () => {
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState([]);
    const [isAiSearching, setIsAiSearching] = useState(false);

    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // 1. 일반 텍스트 검색
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!keyword.trim()) return;

        try {
            const response = await axios.get(`${API_BASE_URL}/products/search?keyword=${keyword}`);
            setResults(response.data);
            if(response.data.length === 0) alert("검색 결과가 없습니다.");
        } catch (error) {
            console.error("검색 에러:", error);
        }
    };

    // 2. 카메라 버튼 클릭
    const handleCameraClick = () => {
        fileInputRef.current.click();
    };

    // 3. 사진 업로드 및 검색
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsAiSearching(true);
        setKeyword("📸 이미지 분석 중...");
        setResults([]);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const aiRes = await axios.post(`${AI_SERVER_URL}/search-image`, formData);
            const aiResults = aiRes.data.results;

            if (!aiResults || aiResults.length === 0) {
                alert("비슷한 상품을 찾지 못했습니다.");
                setKeyword("");
                setIsAiSearching(false);
                return;
            }

            const productRes = await axios.get(`${API_BASE_URL}/products`);
            const allProducts = productRes.data;

            const matchedProducts = [];
            aiResults.forEach(aiItem => {
                const found = allProducts.find(p => p.imageFileName === aiItem.filename);
                if (found) matchedProducts.push(found);
            });

            setResults(matchedProducts);
            setKeyword(`📸 이미지 검색 결과 (${matchedProducts.length}건)`);

            if (matchedProducts.length === 0) {
                alert("AI가 이미지는 찾았는데, 상품 DB에는 없는 파일이네요.");
            }

        } catch (error) {
            console.error("이미지 검색 실패:", error);
            alert("이미지 검색 중 오류가 발생했습니다.");
            setKeyword("");
        } finally {
            setIsAiSearching(false);
            e.target.value = '';
        }
    };

    const handleResultClick = (productId) => {
        navigate(`/products/${productId}`);
        setResults([]);
        setKeyword('');
    };

    return (
        <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">

                {/* ✨ [수정] 입력창과 카메라 버튼을 감싸는 래퍼(Wrapper) 추가 */}
                <div className="input-wrapper">
                    <input
                        type="text"
                        placeholder="Search Gears..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="search-input"
                        disabled={isAiSearching}
                    />

                    {/* 📷 카메라 버튼 (입력창 안으로 이동) */}
                    <button
                        type="button"
                        className="btn-camera"
                        onClick={handleCameraClick}
                        title="사진으로 상품 찾기"
                        disabled={isAiSearching}
                    >
                        {isAiSearching ? '⏳' : '📷'}
                    </button>
                </div>

                {/* 숨겨진 파일 입력창 */}
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{display: 'none'}}
                    onChange={handleImageUpload}
                />

                <button type="submit" className="search-button">SEARCH</button>
            </form>

            {/* 검색 결과 드롭다운 */}
            {results.length > 0 && (
                <div className="search-results-dropdown">
                    {results.map((product) => (
                        <div
                            key={product.id}
                            className="search-result-item"
                            onClick={() => handleResultClick(product.id)}
                        >
                            <img
                                src={`http://localhost:8080/uploads/${product.imageFileName}`}
                                alt=""
                                style={{width:'40px', height:'40px', objectFit:'cover', borderRadius:'4px', marginRight:'10px'}}
                            />
                            <div style={{display:'flex', flexDirection:'column', alignItems:'flex-start'}}>
                                <span className="result-name">{product.name}</span>
                                <span className="result-price">
                                    {product.price ? product.price.toLocaleString() : 0} KRW
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
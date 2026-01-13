import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // 페이지 이동 훅 추가
import './SearchBar.css';

const SearchBar = () => {
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState([]);
    const navigate = useNavigate(); // 이동 함수

    const handleSearch = async (e) => {
        e.preventDefault(); // 새로고침 방지
        if (!keyword.trim()) return; // 빈 칸이면 검색 안 함

        try {
            // ✅ 백엔드 API 호출 (주소 주의: products 복수형)
            const response = await axios.get(`http://localhost:8080/api/products/search?keyword=${keyword}`);

            console.log("검색 결과:", response.data);
            setResults(response.data);

            if(response.data.length === 0) {
                alert("검색 결과가 없습니다.");
            }
        } catch (error) {
            console.error("검색 에러:", error);
            alert("서버와 연결할 수 없습니다.");
        }
    };

    // 검색 결과 클릭 시 상세 페이지로 이동
    const handleResultClick = (productId) => {
        navigate(`/products/${productId}`); // 상세 페이지로 이동
        setResults([]); // 이동 후 검색 결과창 닫기
        setKeyword(''); // 검색어 초기화
    };

    return (
        <div className="search-container">
            {/* 검색 입력 폼 */}
            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    placeholder="Search Gears (ex: RTX 4090)"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="search-input"
                />
                <button type="submit" className="search-button">SEARCH</button>
            </form>

            {/* 검색 결과 리스트 (결과가 있을 때만 보여줌) */}
            {results.length > 0 && (
                <div className="search-results-dropdown">
                    {results.map((product) => (
                        <div
                            key={product.id}
                            className="search-result-item"
                            onClick={() => handleResultClick(product.id)}
                        >
                            <span className="result-name">{product.name}</span>
                            <span className="result-price">
                                {product.price ? product.price.toLocaleString() : 0} KRW
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
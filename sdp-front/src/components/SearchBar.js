import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './SearchBar.css';

// 서버 주소 설정
const API_BASE_URL = 'http://localhost:8080/api';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';
const AI_SERVER_URL = 'http://localhost:5002';

const SearchBar = () => {
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState([]);
    const [isAiSearching, setIsAiSearching] = useState(false);

    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // 🛡️ 데이터 추출 헬퍼 함수
    const extractData = (resData) => {
        if (Array.isArray(resData)) return resData;
        if (resData.content && Array.isArray(resData.content)) return resData.content;
        if (resData.data && Array.isArray(resData.data)) return resData.data;
        return [];
    };

    // 1. 텍스트 검색 (백엔드가 필터링 안 해주면, 프론트에서 직접 함)
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!keyword.trim()) {
            Swal.fire({ icon:'warning', title:'검색어 입력', text:'찾으시는 장비 이름을 입력해주세요.', background:'#333', color:'#fff' });
            return;
        }

        try {
            // 1. 일단 전체 목록을 가져옵니다.
            const response = await axios.get(`${API_BASE_URL}/products`);

            // 2. 안전하게 배열로 변환
            const allProducts = extractData(response.data);

            // 3. ⭐ [핵심] 여기서 자바스크립트로 직접 필터링합니다!
            // (제품 이름에 검색어가 포함된 것만 남김, 대소문자 구분 없이)
            const filteredList = allProducts.filter(product =>
                product.name.toLowerCase().includes(keyword.toLowerCase())
            );

            setResults(filteredList);

            if(filteredList.length === 0) {
                Swal.fire({
                    icon: 'info', title: '검색 결과 없음', text: `"${keyword}"에 대한 장비를 찾을 수 없습니다.`,
                    background: '#333', color: '#fff', confirmButtonColor: '#00d4ff'
                });
            }
        } catch (error) {
            console.error("검색 에러:", error);
            Swal.fire({ icon:'error', title:'검색 실패', text:'서버 통신 중 오류가 발생했습니다.', background:'#333', color:'#fff' });
        }
    };

    // 2. 카메라 버튼 클릭
    const handleCameraClick = () => {
        fileInputRef.current.click();
    };

    // 3. 이미지 검색
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
                Swal.fire({ icon:'error', title:'분석 실패', text:'비슷한 상품을 찾지 못했습니다.', background:'#333', color:'#fff' });
                setKeyword("");
                setIsAiSearching(false);
                return;
            }

            // 전체 제품 가져오기
            const productRes = await axios.get(`${API_BASE_URL}/products`);
            const allProducts = extractData(productRes.data);

            const matchedProducts = [];
            aiResults.forEach(aiItem => {
                const found = allProducts.find(p => p.imageFileName === aiItem.filename);
                if (found) matchedProducts.push(found);
            });

            setResults(matchedProducts);
            setKeyword(`📸 이미지 검색 결과 (${matchedProducts.length}건)`);

            if (matchedProducts.length === 0) {
                Swal.fire({ icon:'question', title:'DB 미등록', text:'AI가 이미지는 찾았는데, 판매 중인 상품이 아닙니다.', background:'#333', color:'#fff' });
            } else {
                Swal.fire({
                    icon: 'success', title: '분석 완료!', text: `유사한 장비 ${matchedProducts.length}개를 찾았습니다.`,
                    background: '#333', color: '#fff', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end'
                });
            }

        } catch (error) {
            console.error("이미지 검색 오류:", error);
            Swal.fire({ icon:'error', title:'오류', text:'AI 서버와 연결할 수 없습니다.', background:'#333', color:'#fff' });
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
                <div className="input-wrapper">
                    <input
                        type="text"
                        placeholder="Search Gears..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="search-input"
                        disabled={isAiSearching}
                    />
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
                                src={`${IMAGE_SERVER_URL}/${product.imageFileName}`}
                                alt=""
                                style={{width:'40px', height:'40px', objectFit:'cover', borderRadius:'4px', marginRight:'10px'}}
                                onError={(e)=>e.target.src='https://via.placeholder.com/40'}
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
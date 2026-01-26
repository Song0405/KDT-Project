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

    // 데이터 추출 헬퍼
    const extractData = (resData) => {
        if (Array.isArray(resData)) return resData;
        if (resData.content && Array.isArray(resData.content)) return resData.content;
        if (resData.data && Array.isArray(resData.data)) return resData.data;
        return [];
    };

    // 1. 텍스트 검색
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!keyword.trim()) {
            Swal.fire({ icon:'warning', title:'검색어 입력', text:'찾으시는 장비 이름을 입력해주세요.', background:'#333', color:'#fff' });
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/products`);
            const allProducts = extractData(response.data);
            const filteredList = allProducts.filter(product =>
                product.name.toLowerCase().includes(keyword.toLowerCase())
            );

            setResults(filteredList);

            if(filteredList.length === 0) {
                Swal.fire({
                    icon: 'info', title: '검색 결과 없음', text: `"${keyword}"에 대한 장비를 찾을 수 없습니다.`,
                    background: '#333', color: '#fff'
                });
            }
        } catch (error) {
            console.error("검색 에러:", error);
        }
    };

    const handleCameraClick = () => fileInputRef.current.click();

    // 2. ⭐ [업그레이드] 이미지 검색 (유사 이미지 -> 실패 시 카테고리 검색)
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsAiSearching(true);
        setKeyword("📸 AI 분석 중...");
        setResults([]);

        const formData = new FormData();
        formData.append('image', file);

        try {
            // 1단계: 전체 제품 목록 미리 확보
            const productRes = await axios.get(`${API_BASE_URL}/products`);
            const allProducts = extractData(productRes.data);

            // 2단계: 유사 이미지 검색 시도
            const aiRes = await axios.post(`${AI_SERVER_URL}/search-image`, formData);
            const aiResults = aiRes.data.results;

            let matchedProducts = [];

            if (aiResults && aiResults.length > 0) {
                // 유사 이미지가 있으면 매칭 시도
                aiResults.forEach(aiItem => {
                    const found = allProducts.find(p => p.imageFileName === aiItem.filename);
                    if (found) matchedProducts.push(found);
                });
            }

            // 3단계: 유사 이미지를 못 찾았거나 매칭된 게 없으면 -> "카테고리 예측" 시도!
            if (matchedProducts.length === 0) {
                setKeyword("🔍 유사품 없음 -> 카테고리 분석 중...");

                // AI에게 "이거 무슨 물건이야?" 물어보기
                const catRes = await axios.post(`${AI_SERVER_URL}/predict-category`, formData);

                if (catRes.data.status === 'success') {
                    const detectedCategory = catRes.data.category;

                    if (detectedCategory !== 'ETC') {
                        // 예측된 카테고리의 모든 제품을 가져옴
                        matchedProducts = allProducts.filter(p => p.category === detectedCategory);

                        Swal.fire({
                            icon: 'info',
                            title: '유사 제품 추천',
                            html: `정확히 일치하는 사진은 없지만,<br/><b>'${detectedCategory}'</b> 제품들을 찾아냈습니다!`,
                            background: '#333', color: '#fff',
                            timer: 2000, showConfirmButton: false, position: 'top-end', toast: true
                        });
                        setKeyword(`🤖 AI 자동 인식: ${detectedCategory}`);
                    }
                }
            } else {
                Swal.fire({
                    icon: 'success', title: '분석 완료!', text: `유사한 장비 ${matchedProducts.length}개를 찾았습니다.`,
                    background: '#333', color: '#fff', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end'
                });
                setKeyword(`📸 이미지 검색 결과 (${matchedProducts.length}건)`);
            }

            setResults(matchedProducts);

            if (matchedProducts.length === 0) {
                Swal.fire({ icon:'warning', title:'분석 실패', text:'이미지에서 제품을 식별할 수 없습니다.', background:'#333', color:'#fff' });
                setKeyword("");
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
                    <button type="button" className="btn-camera" onClick={handleCameraClick} disabled={isAiSearching}>
                        {isAiSearching ? '⏳' : '📷'}
                    </button>
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} style={{display: 'none'}} onChange={handleImageUpload} />
                <button type="submit" className="search-button">SEARCH</button>
            </form>

            {results.length > 0 && (
                <div className="search-results-dropdown">
                    {results.map((product) => (
                        <div key={product.id} className="search-result-item" onClick={() => handleResultClick(product.id)}>
                            <img
                                src={`${IMAGE_SERVER_URL}/${product.imageFileName}`}
                                alt=""
                                style={{width:'40px', height:'40px', objectFit:'cover', borderRadius:'4px', marginRight:'10px'}}
                                onError={(e)=>e.target.src='https://via.placeholder.com/40'}
                            />
                            <div style={{display:'flex', flexDirection:'column', alignItems:'flex-start'}}>
                                <span className="result-name">{product.name}</span>
                                <span className="result-price">{product.price ? product.price.toLocaleString() : 0} KRW</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
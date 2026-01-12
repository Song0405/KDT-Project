import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './Product.css';

const API_BASE_URL = 'http://localhost:8080/api/products';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

function ProductDetailPage() {
    const { id } = useParams(); // URL에서 id 가져오기
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/${id}`)
            .then(res => setProduct(res.data))
            .catch(err => {
                alert("상품 정보를 찾을 수 없습니다.");
                navigate('/products');
            });
    }, [id, navigate]);

    if (!product) return <div className="product-page-container">로딩 중...</div>;

    const imgUrl = product.imageUrl
        ? (product.imageUrl.startsWith('http') ? product.imageUrl : `${IMAGE_SERVER_URL}/${product.imageUrl}`)
        : 'https://via.placeholder.com/500?text=No+Image';

    return (
        <div className="product-page-container">
            <button className="btn-back" onClick={() => navigate('/products')}>← 목록으로</button>

            <div className="detail-content">
                {/* 왼쪽: 이미지 */}
                <div className="detail-img-area">
                    <img src={imgUrl} alt={product.name} />
                </div>

                {/* 오른쪽: 정보 */}
                <div className="detail-info-area">
                    <span className="detail-badge">NEW ARRIVAL</span>
                    <h2 className="detail-title">{product.name}</h2>
                    <div className="detail-price">{product.price?.toLocaleString()}원</div>
                    <p className="detail-desc">{product.description}</p>

                    {/* 👇 AI 추천 섹션 (데이터가 있을 때만 표시) */}
                    {product.recommendations && product.recommendations.length > 0 && (
                        <div className="ai-recommendation-section">
                            <div className="ai-header">
                                <span className="ai-badge">AI ✨</span>
                                <span className="ai-title">함께 사용하면 좋은 제품</span>
                            </div>
                            {product.recommendations.map((rec, index) => (
                                <div
                                    key={index}
                                    className="ai-item"
                                    // ⭐ [추가] 클릭 시 해당 제품으로 이동 (ID가 있을 때만)
                                    onClick={() => rec.targetProductId && navigate(`/products/${rec.targetProductId}`)}
                                    style={{
                                        cursor: rec.targetProductId ? 'pointer' : 'default',
                                        transition: 'background 0.2s'
                                    }}
                                    // 마우스 올렸을 때 효과 추가
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                >
                                    <div className="ai-target">
                                        👉 추천: {rec.targetProductName}
                                        {rec.targetProductId && <span style={{fontSize:'0.8em', marginLeft:'5px'}}> (보러가기 ↗)</span>}
                                    </div>
                                    <span className="ai-reason">{rec.reason}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProductDetailPage;
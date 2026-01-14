import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetailPage.css';

// ⭐ [추가] 결제 버튼 컴포넌트 임포트 (경로 확인 필요)
import PaymentButton from '../../components/PaymentButton';

const API_BASE_URL = 'http://localhost:8080/api/products';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);

    // ⭐ [추가] 결제에 필요한 사용자 정보 가져오기 (로그인 정보)
    const userInfo = {
        name: localStorage.getItem('memberName') || 'Unknown Agent',
        email: localStorage.getItem('memberEmail') || 'guest@rootstation.com',
        tel: localStorage.getItem('memberTel') || '010-0000-0000'
    };

    useEffect(() => {
        axios.get(`${API_BASE_URL}/${id}`)
            .then(res => setProduct(res.data))
            .catch(err => {
                alert("장비 정보를 찾을 수 없습니다.");
                navigate('/products');
            });
    }, [id, navigate]);

    if (!product) return (
        <div className="product-loading-wrapper">
            <div className="cyber-loader"></div>
            <p>ACCESSING GEAR DATA...</p>
        </div>
    );

    const imgUrl = product.imageUrl
        ? (product.imageUrl.startsWith('http') ? product.imageUrl : `${IMAGE_SERVER_URL}/${product.imageUrl}`)
        : 'https://via.placeholder.com/600?text=ROOT+STATION+GEAR';

    return (
        <div className="detail-page-wrapper">
            {/* 상단 컨트롤 바 */}
            <div className="detail-control-bar">
                <button className="btn-back-glow" onClick={() => navigate('/products')}>
                    <span className="arrow">←</span> BACK TO LIBRARY
                </button>
                <div className="status-indicator">
                    <span className="dot pulse"></span> SYSTEM ACTIVE
                </div>
            </div>

            <div className="detail-main-layout">
                {/* 왼쪽: 제품 시각화 영역 */}
                <div className="detail-visual-section">
                    <div className="image-frame">
                        <img src={imgUrl} alt={product.name} className="main-gear-img" />
                        <div className="grid-overlay"></div>
                    </div>
                </div>

                {/* 오른쪽: 사양 및 분석 영역 */}
                <div className="detail-specs-section">
                    <div className="specs-header">
                        <span className="category-label">// {product.category || 'PREMIUM GEAR'}</span>
                        <h2 className="gear-title">{product.name}</h2>
                        <div className="gear-price-tag">{Number(product.price).toLocaleString()} KRW</div>
                    </div>

                    <div className="specs-body">
                        <div className="desc-box">
                            <label>DESCRIPTION</label>
                            <p>{product.description}</p>
                        </div>

                        <div className="action-buttons">
                            {/* ⭐ [변경] 기존 'ACQUIRE GEAR' 버튼을 PaymentButton으로 교체 */}
                            <PaymentButton productInfo={product} userInfo={userInfo} />

                            <button className="btn-cart-add">ADD TO SYSTEM</button>
                        </div>
                    </div>

                    {/* AI 추천 리포트 섹션 */}
                    {product.recommendations && product.recommendations.length > 0 && (
                        <div className="ai-analysis-box">
                            <div className="ai-header">
                                <span className="ai-spark">✨</span>
                                <h3>AI SMART CURATION</h3>
                            </div>
                            <div className="ai-recommendation-list">
                                {product.recommendations.map((rec, index) => (
                                    <div
                                        key={index}
                                        className="ai-rec-card"
                                        onClick={() => rec.targetProductId && navigate(`/products/${rec.targetProductId}`)}
                                        style={{ cursor: rec.targetProductId ? 'pointer' : 'default' }}
                                    >
                                        <div className="rec-target">
                                            <span className="rec-link-icon">🔗</span>
                                            {rec.targetProductName}
                                            {rec.targetProductId && <span className="view-more-tag">GO TO GEAR →</span>}
                                        </div>
                                        <div className="rec-reason">
                                            <span className="reason-label">MATCH REASON:</span> {rec.reason}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProductDetailPage;
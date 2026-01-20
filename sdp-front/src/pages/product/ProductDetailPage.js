import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetailPage.css';
import PaymentButton from '../../components/PaymentButton';

// ⭐ [수정 1] 주소를 더 유연하게 쓰기 위해 '/api'까지만 잡습니다.
const BASE_URL = 'http://localhost:8080/api';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);

    const userInfo = {
        memberId: localStorage.getItem('memberId'),
        name: localStorage.getItem('memberName') || 'Unknown Agent',
        email: localStorage.getItem('memberEmail') || 'guest@rootstation.com',
        tel: localStorage.getItem('memberTel') || '010-0000-0000'
    };

    useEffect(() => {
        // ⭐ [수정 2] BASE_URL을 사용해 제품 상세 조회
        axios.get(`${BASE_URL}/products/${id}`)
            .then(res => setProduct(res.data))
            .catch(err => {
                alert("장비 정보를 찾을 수 없습니다.");
                navigate('/products');
            });
    }, [id, navigate]);

    // 장바구니 담기 기능
    const addToCart = async () => {
        if (!userInfo.name || userInfo.name === 'Unknown Agent') {
            alert('로그인이 필요한 기능입니다.');
            navigate('/members/login');
            return;
        }

        try {
            const targetImage = product.imageFileName
                ? (product.imageFileName.startsWith('http') ? product.imageFileName : `${IMAGE_SERVER_URL}/${product.imageFileName}`)
                : '';

            // ⭐ [핵심 수정] 서버로 요청 보내기 (경로: /api/cart)
            const res = await axios.post(`${BASE_URL}/cart`, {
                memberName: userInfo.name,
                productId: product.id,
                productName: product.name,
                price: product.price,
                imageUrl: targetImage
            });

            // ⭐ [핵심 수정] 서버의 응답(DUPLICATE vs SUCCESS)을 구분해서 처리
            if (res.data === "DUPLICATE") {
                // 이미 있을 때
                const move = window.confirm("이미 장바구니에 담긴 상품입니다.\n장바구니로 이동하시겠습니까?");
                if (move) {
                    navigate('/cart');
                }
            } else {
                // 성공했을 때 (SUCCESS)
                const move = window.confirm("장바구니에 상품을 담았습니다.\n확인하러 가시겠습니까?");
                if (move) {
                    navigate('/cart');
                }
            }

        } catch (err) {
            console.error(err);
            // 서버가 500 에러 등을 냈을 때
            alert('장바구니 담기 실패: 서버와 통신 중 오류가 발생했습니다.');
        }
    };

    if (!product) return (
        <div className="product-loading-wrapper">
            <div className="cyber-loader"></div>
            <p>ACCESSING GEAR DATA...</p>
        </div>
    );

    const imgUrl = product.imageFileName
        ? (product.imageFileName.startsWith('http') ? product.imageFileName : `${IMAGE_SERVER_URL}/${product.imageFileName}`)
        : 'https://via.placeholder.com/600?text=ROOT+STATION+GEAR';

    return (
        <div className="detail-page-wrapper">
            <div className="detail-control-bar">
                <button className="btn-back-glow" onClick={() => navigate('/products')}>
                    <span className="arrow">←</span> BACK TO LIBRARY
                </button>
                <div className="status-indicator">
                    <span className="dot pulse"></span> SYSTEM ACTIVE
                </div>
            </div>

            <div className="detail-main-layout">
                {/* 왼쪽: 이미지 영역 */}
                <div className="detail-visual-section">
                    <div className="image-frame">
                        <img src={imgUrl} alt={product.name} className="main-gear-img" />
                        <div className="grid-overlay"></div>
                    </div>
                </div>

                {/* 오른쪽: 스펙 영역 */}
                <div className="detail-specs-section">
                    <div className="specs-header">
                        <span className="category-label">
                            [{product.usage || 'GEAR'}] // {product.category || 'PREMIUM'}
                        </span>
                        <h2 className="gear-title">{product.name}</h2>
                        <div className="gear-price-tag">{Number(product.price).toLocaleString()} KRW</div>
                    </div>

                    <div className="specs-body">
                        <div className="desc-box">
                            <label>DESCRIPTION</label>
                            <p>{product.description}</p>
                        </div>

                        <div className="action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {/* 결제 버튼 */}
                            <PaymentButton productInfo={product} userInfo={userInfo} />

                            {/* 장바구니 버튼 */}
                            <button className="btn-cart-action" onClick={addToCart}>
                                🛒 ADD TO CART (장바구니)
                            </button>
                        </div>
                    </div>

                    {/* AI 추천 섹션 */}
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
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetailPage.css';
import PaymentButton from '../../components/PaymentButton';

// 서버 주소 설정
const BASE_URL = 'http://localhost:8080/api';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    // 상태 관리
    const [product, setProduct] = useState(null);

    // ⭐ [추가] 리뷰 관련 상태
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ content: '', rating: 5 });

    // 사용자 정보
    const userInfo = {
        memberId: localStorage.getItem('memberId'),
        name: localStorage.getItem('memberName') || 'Unknown Agent',
        email: localStorage.getItem('memberEmail') || 'guest@rootstation.com',
        tel: localStorage.getItem('memberTel') || '010-0000-0000'
    };

    // 1. 데이터 로드 (상품정보 + 리뷰)
    useEffect(() => {
        fetchProduct();
        fetchReviews();
    }, [id]);

    const fetchProduct = () => {
        axios.get(`${BASE_URL}/products/${id}`)
            .then(res => setProduct(res.data))
            .catch(err => {
                alert("장비 정보를 찾을 수 없습니다.");
                navigate('/products');
            });
    };

    // ⭐ [추가] 리뷰 목록 불러오기
    const fetchReviews = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/reviews/${id}`);
            setReviews(res.data);
        } catch (err) {
            console.error("리뷰 로드 실패", err);
        }
    };

    // 2. 장바구니 담기 (중복 체크 포함)
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

            const res = await axios.post(`${BASE_URL}/cart`, {
                memberName: userInfo.name,
                productId: product.id,
                productName: product.name,
                price: product.price,
                imageUrl: targetImage
            });

            if (res.data === "DUPLICATE") {
                const move = window.confirm("이미 장바구니에 담긴 상품입니다.\n장바구니로 이동하시겠습니까?");
                if (move) navigate('/cart');
            } else {
                const move = window.confirm("장바구니에 상품을 담았습니다.\n확인하러 가시겠습니까?");
                if (move) navigate('/cart');
            }

        } catch (err) {
            console.error(err);
            alert('장바구니 담기 실패: 서버와 통신 중 오류가 발생했습니다.');
        }
    };

    // ⭐ [추가] 리뷰 등록 함수
    const submitReview = async () => {
        if (!userInfo.name || userInfo.name === 'Unknown Agent') {
            alert("로그인이 필요합니다.");
            return;
        }
        if (!newReview.content.trim()) {
            alert("내용을 입력해주세요.");
            return;
        }

        try {
            await axios.post(`${BASE_URL}/reviews`, {
                productId: id,
                writer: userInfo.name,
                content: newReview.content,
                rating: newReview.rating
            });
            alert("리뷰가 등록되었습니다!");
            setNewReview({ content: '', rating: 5 }); // 초기화
            fetchReviews(); // 목록 새로고침
        } catch (err) {
            console.error(err);
            alert("리뷰 등록 실패");
        }
    };

    // ⭐ [추가] 리뷰 삭제 함수
    const deleteReview = async (reviewId) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            await axios.delete(`${BASE_URL}/reviews/${reviewId}`);
            alert("삭제되었습니다.");
            fetchReviews();
        } catch (err) {
            alert("삭제 실패");
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

                {/* 오른쪽: 스펙 및 정보 영역 */}
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
                            <PaymentButton productInfo={product} userInfo={userInfo} />
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

                    {/* ⭐ [추가됨] 리뷰 섹션 */}
                    <div className="review-section-container" style={{ marginTop: '50px', borderTop: '1px solid #333', paddingTop: '30px' }}>
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '20px', color: '#fff', display:'flex', alignItems:'center', gap:'10px' }}>
                            📋 USER REVIEWS <span style={{ color: '#00d4ff', fontSize: '1rem' }}>({reviews.length})</span>
                        </h3>

                        {/* 1. 리뷰 작성 폼 */}
                        <div className="review-form" style={{ background: '#111', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #222' }}>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
                                <span style={{ color: '#aaa', fontSize: '0.9rem' }}>RATING :</span>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span
                                        key={star}
                                        onClick={() => setNewReview({ ...newReview, rating: star })}
                                        style={{ cursor: 'pointer', color: star <= newReview.rating ? '#FFD700' : '#444', fontSize: '1.4rem', transition: '0.2s' }}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                            <textarea
                                value={newReview.content}
                                onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                                placeholder="이 장비에 대한 솔직한 분석을 남겨주세요."
                                style={{ width: '100%', background: '#050505', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '4px', minHeight: '80px', fontSize: '0.95rem', resize: 'vertical' }}
                            />
                            <div style={{textAlign: 'right', marginTop: '10px'}}>
                                <button
                                    onClick={submitReview}
                                    style={{ padding: '8px 25px', background: '#00d4ff', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    리뷰 등록
                                </button>
                            </div>
                        </div>

                        {/* 2. 리뷰 목록 리스트 */}
                        <div className="review-list">
                            {reviews.length > 0 ? (
                                reviews.map(review => (
                                    <div key={review.id} style={{ borderBottom: '1px solid #222', padding: '20px 0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                                <span style={{ fontWeight: 'bold', color: '#00d4ff' }}>{review.writer}</span>
                                                <span style={{ color: '#FFD700', fontSize: '0.9rem' }}>{'★'.repeat(review.rating)}</span>
                                            </div>
                                            <span style={{ color: '#555', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                                {new Date(review.createdDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p style={{ color: '#ddd', lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
                                            {review.content}
                                        </p>

                                        {/* 본인이 쓴 글이면 삭제 버튼 노출 */}
                                        {userInfo.name === review.writer && (
                                            <div style={{textAlign: 'right'}}>
                                                <button
                                                    onClick={() => deleteReview(review.id)}
                                                    style={{ background: 'none', border: '1px solid #ff4d4d', color: '#ff4d4d', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', marginTop: '5px' }}
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#666', textAlign: 'center', padding: '30px', background: '#111', borderRadius: '8px', border:'1px dashed #333' }}>
                                    아직 등록된 리뷰가 없습니다. 첫 번째 리뷰어가 되어보세요! 📡
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductDetailPage;
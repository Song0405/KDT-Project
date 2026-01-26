import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetailPage.css';
import PaymentButton from '../../components/PaymentButton'; // 결제 버튼 (경로 확인 필요)

// 서버 주소 설정
const BASE_URL = 'http://localhost:8080/api';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';
const AI_SERVER_URL = 'http://localhost:5002'; // 🐍 Python AI 주소

function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    // 상태 관리
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ content: '', rating: 5 });
    const [reviewStats, setReviewStats] = useState(null);

    // 🤖 AI 추천 목록 상태 (여기에 저장됨)
    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [loadingAI, setLoadingAI] = useState(false);

    // 사용자 정보
    const userInfo = {
        memberId: localStorage.getItem('memberId'),
        name: localStorage.getItem('memberName') || 'Unknown Agent',
        email: localStorage.getItem('memberEmail') || 'guest@rootstation.com',
        tel: localStorage.getItem('memberTel') || '010-0000-0000'
    };

    // 1. 초기 데이터 로드
    useEffect(() => {
        fetchProduct();
        fetchReviews();
        fetchReviewStats();
    }, [id]);

    // 2. 제품 정보가 로드되면 -> AI에게 추천 요청
    useEffect(() => {
        if (product) {
            fetchAIRecommendations();
        }
    }, [product]);

    const fetchProduct = () => {
        axios.get(`${BASE_URL}/products/${id}`)
            .then(res => setProduct(res.data))
            .catch(err => {
                alert("장비 정보를 찾을 수 없습니다.");
                navigate('/products');
            });
    };

    // 🤖 [핵심] Python AI에게 추천 요청하는 함수
    const fetchAIRecommendations = async () => {
        try {
            setLoadingAI(true);

            // 1. 비교군(전체 제품) 가져오기
            const allRes = await axios.get(`${BASE_URL}/products`);
            let allProducts = [];
            if (Array.isArray(allRes.data)) allProducts = allRes.data;
            else if (allRes.data.content) allProducts = allRes.data.content;

            // 2. Python 서버에 분석 요청
            const aiRes = await axios.post(`${AI_SERVER_URL}/recommend`, {
                targetName: product.name,
                targetCategory: product.category,
                targetUsage: product.usage,
                candidates: allProducts
            });

            if (aiRes.data.status === 'success') {
                setAiRecommendations(aiRes.data.recommendations);
            }
        } catch (err) {
            console.error("AI 추천 로드 실패:", err);
        } finally {
            setLoadingAI(false);
        }
    };

    const fetchReviews = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/reviews/${id}`);
            setReviews(res.data);
        } catch (err) { console.error("리뷰 로드 실패", err); }
    };

    const fetchReviewStats = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/reviews/${id}/summary`);
            setReviewStats(res.data);
        } catch (err) { console.error("통계 로드 실패", err); }
    };

    // 장바구니 담기
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
                if(window.confirm("이미 장바구니에 있습니다. 이동하시겠습니까?")) navigate('/cart');
            } else {
                if(window.confirm("장바구니에 담았습니다. 확인하시겠습니까?")) navigate('/cart');
            }
        } catch (err) { alert('장바구니 담기 실패'); }
    };

    // 리뷰 등록
    const submitReview = async () => {
        if (!userInfo.name || userInfo.name === 'Unknown Agent') return alert("로그인이 필요합니다.");
        if (!newReview.content.trim()) return alert("내용을 입력해주세요.");

        try {
            const res = await axios.post(`${BASE_URL}/reviews`, {
                productId: id,
                memberId: userInfo.memberId,
                writer: userInfo.name,
                content: newReview.content,
                rating: newReview.rating
            });

            if (res.data === "NOT_PURCHASED") alert("⛔ 구매 고객만 작성 가능합니다.");
            else if (res.data === "SUCCESS") {
                alert("리뷰 등록 완료!");
                setNewReview({ content: '', rating: 5 });
                fetchReviews();
                fetchReviewStats();
            } else alert(res.data);
        } catch (err) { alert("오류 발생"); }
    };

    // 리뷰 삭제
    const deleteReview = async (reviewId) => {
        if (!window.confirm("삭제하시겠습니까?")) return;
        try {
            await axios.delete(`${BASE_URL}/reviews/${reviewId}`);
            alert("삭제됨");
            fetchReviews();
            fetchReviewStats();
        } catch (err) { alert("삭제 실패"); }
    };

    if (!product) return (
        <div className="product-loading-wrapper">
            <div className="cyber-loader"></div>
            <p>ACCESSING GEAR DATA...</p>
        </div>
    );

    const imgUrl = product.imageFileName
        ? (product.imageFileName.startsWith('http') ? product.imageFileName : `${IMAGE_SERVER_URL}/${product.imageFileName}`)
        : 'https://via.placeholder.com/600';

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
                {/* 이미지 영역 */}
                <div className="detail-visual-section">
                    <div className="image-frame">
                        <img src={imgUrl} alt={product.name} className="main-gear-img" />
                        <div className="grid-overlay"></div>
                    </div>
                </div>

                {/* 정보 영역 */}
                <div className="detail-specs-section">
                    <div className="specs-header">
                        <span className="category-label">[{product.usage}] // {product.category}</span>
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
                            <button className="btn-cart-action" onClick={addToCart}>🛒 ADD TO CART</button>
                        </div>
                    </div>

                    {/* 🤖 AI 추천 섹션 (수정됨: state 사용) */}
                    {/* 로딩 중이거나 추천 목록이 있을 때 표시 */}
                    {(loadingAI || aiRecommendations.length > 0) && (
                        <div className="ai-analysis-box">
                            <div className="ai-header">
                                <span className="ai-spark">✨</span>
                                <h3>AI SMART CURATION</h3>
                            </div>

                            {loadingAI ? (
                                <p style={{color:'#888', padding:'10px'}}>AI가 적합한 장비를 분석 중입니다... 🧠</p>
                            ) : (
                                <div className="ai-recommendation-list">
                                    {aiRecommendations.map((rec, index) => (
                                        <div
                                            key={index}
                                            className="ai-rec-card"
                                            onClick={() => rec.targetProductId && navigate(`/products/${rec.targetProductId}`)} // 상세페이지 이동
                                        >
                                            <div className="rec-target">
                                                <span className="rec-link-icon">🔗</span>
                                                {rec.targetProductName}
                                                <span className="view-more-tag">GO TO GEAR →</span>
                                            </div>
                                            <div className="rec-reason">
                                                <span className="reason-label">MATCH REASON:</span> {rec.reason}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 리뷰 섹션 */}
                    <div className="review-section-container" style={{ marginTop: '50px', borderTop: '1px solid #333', paddingTop: '30px' }}>
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '20px', color: '#fff' }}>
                            📋 USER REVIEWS <span style={{ color: '#00d4ff', fontSize: '1rem' }}>({reviews.length})</span>
                        </h3>

                        {/* AI 키워드 인사이트 */}
                        {reviewStats && reviewStats.topTags.length > 0 && (
                            <div className="ai-stats-panel" style={{ background: '#111', border: '1px solid #333', borderRadius: '12px', padding: '20px', marginBottom: '30px' }}>
                                <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'15px'}}>
                                    <span style={{fontSize:'1.2rem'}}>📊</span>
                                    <span style={{color:'#fff', fontWeight:'bold'}}>AI KEYWORD INSIGHT</span>
                                </div>
                                <div style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
                                    {reviewStats.topTags.map((stat, idx) => (
                                        <div key={idx} style={{ background: idx===0?'rgba(0,212,255,0.1)':'#222', border: idx===0?'1px solid #00d4ff':'1px solid #444', padding: '6px 14px', borderRadius: '20px' }}>
                                            <span style={{color: idx===0?'#00d4ff':'#ccc', fontWeight:'bold'}}>#{stat.tag}</span>
                                            <span style={{marginLeft:'8px', fontSize:'0.8rem', color:'#888'}}>{stat.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 리뷰 작성 */}
                        <div className="review-form" style={{ background: '#111', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span key={star} onClick={() => setNewReview({ ...newReview, rating: star })} style={{ cursor: 'pointer', color: star <= newReview.rating ? '#FFD700' : '#444', fontSize: '1.4rem' }}>★</span>
                                ))}
                            </div>
                            <textarea value={newReview.content} onChange={(e) => setNewReview({ ...newReview, content: e.target.value })} placeholder="리뷰를 작성해주세요." style={{ width: '100%', background: '#050505', border: '1px solid #333', color: '#fff', padding: '10px', minHeight: '80px' }} />
                            <div style={{textAlign: 'right', marginTop: '10px'}}>
                                <button onClick={submitReview} style={{ padding: '8px 25px', background: '#00d4ff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>등록</button>
                            </div>
                        </div>

                        {/* 리뷰 목록 */}
                        <div className="review-list">
                            {reviews.map(review => (
                                <div key={review.id} style={{ borderBottom: '1px solid #222', padding: '20px 0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div>
                                            <span style={{ fontWeight: 'bold', color: '#00d4ff', marginRight:'10px' }}>{review.writer}</span>
                                            <span style={{ color: '#FFD700' }}>{'★'.repeat(review.rating)}</span>
                                            {/* AI 감정 분석 뱃지 */}
                                            {review.sentiment === 'POSITIVE' && <span style={{marginLeft:'10px', fontSize:'0.7rem', color:'#00ff7f', border:'1px solid #00ff7f', padding:'2px 5px', borderRadius:'4px'}}>😊 긍정</span>}
                                            {review.sentiment === 'NEGATIVE' && <span style={{marginLeft:'10px', fontSize:'0.7rem', color:'#ff6347', border:'1px solid #ff6347', padding:'2px 5px', borderRadius:'4px'}}>😡 부정</span>}
                                        </div>
                                        <span style={{ color: '#555', fontSize: '0.8rem' }}>{new Date(review.createdDate).toLocaleDateString()}</span>
                                    </div>
                                    <p style={{ color: '#ddd' }}>{review.content}</p>
                                    {/* AI 태그 */}
                                    {review.aiTags && (
                                        <div style={{marginTop:'10px', display:'flex', gap:'5px'}}>
                                            {review.aiTags.split('#').filter(t=>t).map((tag, i) => (
                                                <span key={i} style={{fontSize:'0.8rem', color:'#00d4ff', background:'rgba(0,212,255,0.1)', padding:'2px 8px', borderRadius:'10px'}}>#{tag.trim()}</span>
                                            ))}
                                        </div>
                                    )}
                                    {userInfo.name === review.writer && <button onClick={() => deleteReview(review.id)} style={{color:'#ff4d4d', background:'none', border:'none', marginTop:'10px', fontSize:'0.8rem', cursor:'pointer'}}>삭제</button>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductDetailPage;
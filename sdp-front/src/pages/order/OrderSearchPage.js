import React, { useState } from 'react';
import axios from 'axios';
import './Order.css';

function OrderSearchPage() {
    const [searchInput, setSearchInput] = useState('');
    const [orderResult, setOrderResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchInput.trim()) {
            alert("송장 번호(시리얼 코드)를 입력해주세요.");
            return;
        }

        setLoading(true);
        setError('');
        setOrderResult(null);

        try {
            // ⭐ [수정 1] 주소를 백엔드 설정(/api/shop-orders/track)에 맞춤
            const response = await axios.get(`http://localhost:8080/api/shop-orders/track?code=${searchInput}`);
            setOrderResult(response.data);
        } catch (err) {
            console.error("조회 실패:", err);
            setError("해당 번호의 주문 내역을 찾을 수 없습니다. (코드 확인 필요)");
        } finally {
            setLoading(false);
        }
    };

    const getProgress = (status) => {
        switch (status) {
            case 'ORDERED': return 20;
            case 'MANUFACTURING': return 50;
            case 'QUALITY_CHECK': return 70;
            case 'SHIPPING': return 90;
            case 'COMPLETED': return 100;
            default: return 0;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'ORDERED': return '주문 접수됨 (Processing)';
            case 'MANUFACTURING': return '제작/조립 중 (Manufacturing)';
            case 'QUALITY_CHECK': return '최종 검수 중 (Quality Check)';
            case 'SHIPPING': return '배송 중 (Shipping)';
            case 'COMPLETED': return '배송 완료 (Completed)';
            default: return '상태 확인 불가';
        }
    };

    return (
        <div className="order-manage-wrapper" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <header className="order-header" style={{ border: 'none', textAlign: 'center', marginBottom: '30px' }}>
                <h2 className="order-page-title">TRACK YOUR <span className="highlight">GEAR</span></h2>
                <p className="order-subtitle">부여받은 시리얼 코드(송장번호)를 입력하여 진행 상황을 확인하세요.</p>
            </header>

            <div className="order-input-section" style={{ width: '100%', maxWidth: '600px' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        placeholder="예: mid_1768..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        style={{ flex: 1, padding: '15px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
                    />
                    <button
                        type="submit"
                        className="btn-order-create"
                        style={{ width: '120px' }}
                        disabled={loading}
                    >
                        {loading ? '조회 중...' : '조회하기'}
                    </button>
                </form>
            </div>

            {error && (
                <div style={{ marginTop: '20px', color: '#ff4d4d', fontWeight: 'bold', background: 'rgba(255, 77, 77, 0.1)', padding: '15px', borderRadius: '8px' }}>
                    ⚠️ {error}
                </div>
            )}

            {orderResult && (
                <div className="ai-analysis-box" style={{ marginTop: '40px', width: '100%', maxWidth: '600px', animation: 'fadeIn 0.5s', background: '#111', padding: '30px', borderRadius: '12px', border: '1px solid #333' }}>
                    <div className="ai-header" style={{justifyContent: 'space-between', display:'flex', marginBottom:'20px'}}>
                        <h3 style={{fontSize: '1.2rem', color:'#fff', margin:0}}>LOG SEARCH RESULT</h3>
                        {/* ⭐ [수정 2] trackingCode -> merchantUid로 변경 */}
                        <span className="tracking-code" style={{color:'#bb86fc', fontWeight:'bold'}}>{orderResult.merchantUid}</span>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '2rem', margin: '10px 0', color: '#fff' }}>{orderResult.productName}</h2>
                        {/* ⭐ [수정 3] clientName -> memberName으로 변경 */}
                        <p style={{ color: '#888' }}>주문 고객: {orderResult.memberName}</p>
                        <p style={{ color: '#888' }}>주문 일자: {new Date(orderResult.orderDate).toLocaleDateString()}</p>
                    </div>

                    <div style={{ background: '#222', height: '10px', borderRadius: '5px', overflow: 'hidden', margin: '20px 0' }}>
                        <div style={{
                            width: `${getProgress(orderResult.status)}%`,
                            height: '100%',
                            background: '#00d4ff',
                            transition: 'width 1s ease-in-out',
                            boxShadow: '0 0 10px #00d4ff'
                        }}></div>
                    </div>

                    <div style={{ textAlign: 'right', color: '#00d4ff', fontWeight: 'bold', fontSize: '1.5rem' }}>
                        {getStatusText(orderResult.status)}
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderSearchPage;
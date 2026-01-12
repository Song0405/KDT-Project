import React, { useState } from 'react';
import axios from 'axios';
import './Order.css'; // 스타일은 기존 것 공유

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
            // 백엔드의 송장번호 조회 API 호출 (/api/orders/track?code=...)
            // OrderController.java 에 trackOrder 메서드가 이 역할을 합니다.
            const response = await axios.get(`http://localhost:8080/api/orders/track?code=${searchInput}`);
            setOrderResult(response.data);
        } catch (err) {
            console.error("조회 실패:", err);
            setError("해당 번호의 주문 내역을 찾을 수 없습니다. (코드 확인 필요)");
        } finally {
            setLoading(false);
        }
    };

    // 상태에 따른 진행률(퍼센트) 계산 함수
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

    // 상태 한글 변환
    const getStatusText = (status) => {
        switch (status) {
            case 'ORDERED': return '주문 접수됨';
            case 'MANUFACTURING': return '제작/조립 중';
            case 'QUALITY_CHECK': return '최종 검수 중';
            case 'SHIPPING': return '배송 중';
            case 'COMPLETED': return '배송 완료';
            default: return '상태 확인 불가';
        }
    };

    return (
        <div className="order-manage-wrapper" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <header className="order-header" style={{ border: 'none', textAlign: 'center', marginBottom: '30px' }}>
                <h2 className="order-page-title">TRACK YOUR <span className="highlight">GEAR</span></h2>
                <p className="order-subtitle">부여받은 시리얼 코드(송장번호)를 입력하여 진행 상황을 확인하세요.</p>
            </header>

            {/* 1. 검색 입력창 */}
            <div className="order-input-section" style={{ width: '100%', maxWidth: '600px' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        placeholder="예: SDP-20260112-ABCD"
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

            {/* 2. 에러 메시지 */}
            {error && (
                <div style={{ marginTop: '20px', color: '#ff4d4d', fontWeight: 'bold', background: 'rgba(255, 77, 77, 0.1)', padding: '15px', borderRadius: '8px' }}>
                    ⚠️ {error}
                </div>
            )}

            {/* 3. 조회 결과 카드 */}
            {orderResult && (
                <div className="ai-analysis-box" style={{ marginTop: '40px', width: '100%', maxWidth: '600px', animation: 'fadeIn 0.5s' }}>
                    <div className="ai-header" style={{justifyContent: 'space-between'}}>
                        <h3 style={{fontSize: '1.2rem'}}>LOG SEARCH RESULT</h3>
                        <span className="tracking-code">{orderResult.trackingCode}</span>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '2rem', margin: '10px 0', color: '#fff' }}>{orderResult.productName}</h2>
                        <p style={{ color: '#888' }}>주문 고객: {orderResult.clientName}</p>
                        <p style={{ color: '#888' }}>주문 일자: {new Date(orderResult.orderDate).toLocaleDateString()}</p>
                    </div>

                    {/* 진행 상태 바 */}
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
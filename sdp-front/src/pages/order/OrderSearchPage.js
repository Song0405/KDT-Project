import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2'; // 🍬 추가
import './Order.css';

function OrderSearchPage() {
    const [searchInput, setSearchInput] = useState('');
    const [orderList, setOrderList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchInput.trim()) {
            Swal.fire({ icon: 'warning', title: '입력 필요', text: '송장 번호를 입력해주세요.', background: '#333', color: '#fff' });
            return;
        }

        setLoading(true);
        setError('');
        setOrderList([]);

        try {
            const response = await axios.get(`http://localhost:8080/api/shop-orders/track?code=${searchInput}`);
            if (response.data.length === 0) {
                setError("해당 번호의 주문 내역을 찾을 수 없습니다.");
            }
            setOrderList(response.data);
        } catch (err) {
            console.error("조회 실패:", err);
            setError("조회 중 오류가 발생했습니다.");
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

            <div className="order-input-section" style={{ width: '100%', maxWidth: '600px' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        placeholder="예: cart_1768355..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        style={{ flex: 1, padding: '15px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
                    />
                    <button type="submit" className="btn-order-create" style={{ width: '120px' }} disabled={loading}>
                        {loading ? '...' : '조회하기'}
                    </button>
                </form>
            </div>

            {error && (
                <div style={{ marginTop: '20px', color: '#ff4d4d', fontWeight: 'bold', background: 'rgba(255, 77, 77, 0.1)', padding: '15px', borderRadius: '8px' }}>
                    ⚠️ {error}
                </div>
            )}

            {orderList.length > 0 && (
                <div style={{ marginTop: '40px', width: '100%', maxWidth: '600px', animation: 'fadeIn 0.5s' }}>
                    <div style={{background: '#111', padding: '20px', borderRadius: '12px 12px 0 0', borderBottom:'1px solid #333', display:'flex', justifyContent:'space-between'}}>
                        <h3 style={{margin:0, color:'#fff'}}>LOG SEARCH RESULT</h3>
                        <span style={{color:'#bb86fc', fontWeight:'bold'}}>{orderList[0].merchantUid}</span>
                    </div>

                    {orderList.map((order, index) => (
                        <div key={order.id} className="ai-analysis-box" style={{
                            background: '#0a0a0a',
                            marginTop: '0',
                            marginBottom: '2px',
                            borderRadius: index === orderList.length -1 ? '0 0 12px 12px' : '0',
                            borderTop: 'none'
                        }}>
                            <div style={{ marginBottom: '15px' }}>
                                <h2 style={{ fontSize: '1.4rem', margin: '0 0 5px 0', color: '#fff' }}>{order.productName}</h2>
                                <p style={{ color: '#666', fontSize:'0.9rem', margin:0 }}>주문 고객: {order.memberName}</p>
                            </div>

                            <div style={{ background: '#222', height: '8px', borderRadius: '4px', overflow: 'hidden', margin: '15px 0' }}>
                                <div style={{
                                    width: `${getProgress(order.status)}%`,
                                    height: '100%',
                                    background: order.status === 'COMPLETED' ? '#00d4ff' : '#bb86fc',
                                    transition: 'width 1s ease-in-out',
                                    boxShadow: `0 0 10px ${order.status === 'COMPLETED' ? '#00d4ff' : '#bb86fc'}`
                                }}></div>
                            </div>

                            <div style={{ textAlign: 'right', color: order.status === 'COMPLETED' ? '#00d4ff' : '#bb86fc', fontWeight: 'bold', fontSize: '1rem' }}>
                                {getStatusText(order.status)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default OrderSearchPage;
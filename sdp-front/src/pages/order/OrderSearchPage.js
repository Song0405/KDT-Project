import React, { useState } from 'react';
import axios from 'axios';
import './Order.css'; // 스타일 분리

function OrderSearchPage() {
    const [trackingCode, setTrackingCode] = useState('');
    const [orderResult, setOrderResult] = useState(null);
    const [error, setError] = useState('');

    const searchOrder = async () => {
        if (!trackingCode.trim()) return;
        try {
            const res = await axios.get(`http://localhost:8080/api/orders/track?code=${trackingCode}`);
            setOrderResult(res.data);
            setError('');
        } catch (err) {
            setOrderResult(null);
            setError("존재하지 않는 송장 번호입니다. 다시 확인해주세요.");
        }
    };

    // 단계 정의
    const steps = ["주문 접수", "제작/가공 중", "품질 검사", "배송 중", "납품 완료"];
    const statusMap = { "ORDERED": 0, "MANUFACTURING": 1, "QUALITY_CHECK": 2, "SHIPPING": 3, "COMPLETED": 4 };

    return (
        <div className="order-page-container">
            <h1>📦 배송 조회 시스템</h1>
            <p>송장 번호를 입력하여 현재 공정 상태를 실시간으로 확인하세요.</p>

            <div className="search-box">
                <input
                    type="text"
                    placeholder="송장 번호 (예: SDP-2025...)"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                />
                <button onClick={searchOrder}>조회</button>
            </div>

            {error && <p className="error-msg">{error}</p>}

            {orderResult && (
                <div className="tracker-result">
                    <h3>{orderResult.productName} ({orderResult.clientName} 님)</h3>
                    <p className="code">No. {orderResult.trackingCode}</p>

                    <div className="step-wizard">
                        <div className="progress-line" style={{ width: `${(statusMap[orderResult.status] / 4) * 100}%` }}></div>
                        {steps.map((stepLabel, index) => (
                            <div key={index} className={`step-item ${index <= statusMap[orderResult.status] ? 'active' : ''}`}>
                                <div className="step-circle">{index <= statusMap[orderResult.status] ? '✔' : index + 1}</div>
                                <div className="step-text">{stepLabel}</div>
                            </div>
                        ))}
                    </div>
                    <div className="current-status">현재 상태: <span>{steps[statusMap[orderResult.status]]}</span></div>
                </div>
            )}
        </div>
    );
}

export default OrderSearchPage;
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Order.css';

function OrderManagePage() {
    const navigate = useNavigate();
    const [rawOrders, setRawOrders] = useState([]); // 서버에서 받은 원본 데이터
    const [filterTerm, setFilterTerm] = useState('');

    useEffect(() => {
        const user = localStorage.getItem('memberName');
        if (user !== '관리자') {
            alert('관리자만 접근 가능합니다.');
            navigate('/');
            return;
        }
        fetchOrders();
    }, [navigate]);

    const fetchOrders = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/shop-orders/all');
            setRawOrders(res.data);
        } catch (error) {
            console.error("데이터 동기화 실패:", error);
        }
    };

    // ⭐ [핵심] 같은 주문번호끼리 그룹화하는 함수
    const groupedOrders = useMemo(() => {
        const groups = {};

        rawOrders.forEach(order => {
            const uid = order.merchantUid;
            if (!groups[uid]) {
                groups[uid] = {
                    merchantUid: uid,
                    memberName: order.memberName,
                    orderDate: order.orderDate,
                    items: [], // 여기에 개별 상품들을 담음
                    totalPrice: 0
                };
            }
            groups[uid].items.push(order);
            groups[uid].totalPrice += order.price;
        });

        // 객체를 배열로 변환하고 최신순 정렬
        return Object.values(groups).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    }, [rawOrders]);

    // 검색 필터링
    const filteredGroups = useMemo(() => {
        return groupedOrders.filter(group =>
            group.memberName.toLowerCase().includes(filterTerm.toLowerCase()) ||
            group.merchantUid.toLowerCase().includes(filterTerm.toLowerCase()) ||
            group.items.some(item => item.productName.toLowerCase().includes(filterTerm.toLowerCase()))
        );
    }, [filterTerm, groupedOrders]);

    // 상태 변경 (개별 아이템 ID로 요청)
    const updateStatus = async (id, status) => {
        try {
            await axios.put(`http://localhost:8080/api/shop-orders/${id}/status?status=${status}`);
            fetchOrders(); // 새로고침
        } catch (error) { console.error("업데이트 실패:", error); }
    };

    // 주문 삭제 (개별 삭제)
    const deleteOrder = async (id) => {
        if(window.confirm("이 상품 주문을 삭제하시겠습니까?")) {
            await axios.delete(`http://localhost:8080/api/shop-orders/${id}`);
            fetchOrders();
        }
    };

    // 통합 상품명 생성기 (예: "홍찬의 외 2건")
    const getDisplayName = (items) => {
        if (items.length === 1) return items[0].productName;
        return `${items[0].productName} 외 ${items.length - 1}건`;
    };

    return (
        <div className="order-manage-wrapper">
            <header className="order-header">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                        <h2 className="order-page-title">LOGISTICS <span className="highlight">CONTROL</span></h2>
                        <p className="order-subtitle">통합 주문 관리 및 개별 공정 제어 시스템</p>
                    </div>
                    <button onClick={() => navigate('/admin')} style={{background:'none', border:'1px solid #555', color:'#888', padding:'8px 15px', cursor:'pointer'}}>CLOSE</button>
                </div>
            </header>

            <div className="order-top-controls">
                <div className="order-search-filter" style={{width: '100%'}}>
                    <input
                        type="text"
                        placeholder="송장번호, 고객명, 포함된 제품명으로 검색..."
                        value={filterTerm}
                        onChange={(e) => setFilterTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            <section className="order-list-section">
                <div className="table-container">
                    <table className="root-order-table">
                        <thead>
                        <tr>
                            <th>INVOICE ID (통합)</th>
                            <th>CUSTOMER</th>
                            <th>SUMMARY</th>
                            <th>TOTAL PRICE</th>
                            <th>INDIVIDUAL STATUS (개별 관리)</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredGroups.length > 0 ? (
                            filteredGroups.map(group => (
                                <tr key={group.merchantUid} className="status-row">
                                    <td className="tracking-code" style={{verticalAlign: 'top'}}>
                                        # {group.merchantUid}
                                        <div style={{fontSize:'0.8rem', color:'#666', marginTop:'5px'}}>
                                            {new Date(group.orderDate).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="client-name" style={{verticalAlign: 'top'}}>{group.memberName}</td>

                                    {/* 통합 상품명 */}
                                    <td style={{verticalAlign: 'top'}}>
                                        <span style={{color: 'white', fontWeight: 'bold'}}>
                                            {getDisplayName(group.items)}
                                        </span>
                                    </td>

                                    {/* 총 가격 */}
                                    <td style={{color: '#00d4ff', fontWeight:'bold', verticalAlign: 'top'}}>
                                        {group.totalPrice.toLocaleString()} ₩
                                    </td>

                                    {/* ⭐ 개별 상태 관리 영역 */}
                                    <td>
                                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                            {group.items.map((item) => (
                                                <div key={item.id} style={{
                                                    background: '#1a1a1a',
                                                    padding: '10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #333',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <span style={{fontSize: '0.9rem', color: '#ccc'}}>
                                                        • {item.productName}
                                                    </span>

                                                    <div style={{display: 'flex', gap: '10px'}}>
                                                        <select
                                                            value={item.status || 'ORDERED'}
                                                            onChange={(e) => updateStatus(item.id, e.target.value)}
                                                            className={`status-select ${item.status}`}
                                                            style={{padding: '5px', fontSize: '0.8rem', width: 'auto'}}
                                                        >
                                                            <option value="ORDERED">접수</option>
                                                            <option value="MANUFACTURING">제작</option>
                                                            <option value="QUALITY_CHECK">검수</option>
                                                            <option value="SHIPPING">배송</option>
                                                            <option value="COMPLETED">완료</option>
                                                        </select>
                                                        <button
                                                            onClick={() => deleteOrder(item.id)}
                                                            className="btn-drop"
                                                            style={{padding: '5px 8px'}}
                                                        >
                                                            X
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="empty-msg">주문 내역이 없습니다.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

export default OrderManagePage;
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Order.css'; // 보내주신 CSS 파일 적용

function OrderManagePage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);

    // 수동 추가 폼 상태
    const [newOrder, setNewOrder] = useState({ memberName: '', productName: '', price: '' });
    const [filterTerm, setFilterTerm] = useState(''); // 검색어

    useEffect(() => {
        // 관리자 권한 체크
        const user = localStorage.getItem('memberName');
        if (user !== '관리자') {
            alert('관리자만 접근 가능합니다.');
            navigate('/');
            return;
        }
        fetchOrders();
    }, [navigate]);

    // 주문 목록 불러오기
    const fetchOrders = async () => {
        try {
            // ⭐ 우리가 만든 전체 조회 API 주소
            const res = await axios.get('http://localhost:8080/api/shop-orders/all');
            setOrders(res.data);
        } catch (error) {
            console.error("데이터 동기화 실패:", error);
        }
    };

    // 검색 필터링 로직
    const filteredOrders = useMemo(() => {
        return orders.filter(order =>
            (order.memberName && order.memberName.toLowerCase().includes(filterTerm.toLowerCase())) ||
            (order.productName && order.productName.toLowerCase().includes(filterTerm.toLowerCase())) ||
            (order.merchantUid && order.merchantUid.toLowerCase().includes(filterTerm.toLowerCase()))
        );
    }, [filterTerm, orders]);

    // 수동 주문 추가 (필요 시 사용)
    const addOrder = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8080/api/shop-orders', newOrder);
            alert('✅ 수동 주문이 생성되었습니다.');
            setNewOrder({ memberName: '', productName: '', price: '' });
            fetchOrders();
        } catch (error) { alert('로그 생성 실패'); }
    };

    // 상태 변경 (접수 -> 배송중 -> 완료 등)
    const updateStatus = async (id, status) => {
        try {
            await axios.put(`http://localhost:8080/api/shop-orders/${id}/status?status=${status}`);
            fetchOrders(); // 변경 후 목록 새로고침
        } catch (error) { console.error("업데이트 실패:", error); }
    };

    // 주문 삭제
    const deleteOrder = async (id) => {
        if(window.confirm("정말 이 주문 내역을 삭제하시겠습니까? (복구 불가)")) {
            await axios.delete(`http://localhost:8080/api/shop-orders/${id}`);
            fetchOrders();
        }
    };

    return (
        <div className="order-manage-wrapper">
            <header className="order-header">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                        <h2 className="order-page-title">LOGISTICS <span className="highlight">CONTROL</span></h2>
                        <p className="order-subtitle">실시간 워크스테이션 배송 로그 및 공정 제어 시스템</p>
                    </div>
                    <button onClick={() => navigate('/admin')} style={{background:'none', border:'1px solid #555', color:'#888', padding:'8px 15px', cursor:'pointer'}}>CLOSE</button>
                </div>
            </header>

            {/* 상단: 주문 수동 생성 및 검색 */}
            <div className="order-top-controls">
                {/* 수동 주문 추가 폼 */}
                <section className="order-input-section">
                    <form onSubmit={addOrder} className="order-form-grid">
                        <div className="input-field">
                            <label>CUSTOMER NAME</label>
                            <input placeholder="구매자명" value={newOrder.memberName} onChange={(e)=>setNewOrder({...newOrder, memberName: e.target.value})} required />
                        </div>
                        <div className="input-field">
                            <label>GEAR TYPE</label>
                            <input placeholder="제품명" value={newOrder.productName} onChange={(e)=>setNewOrder({...newOrder, productName: e.target.value})} required />
                        </div>
                        <div className="input-field">
                            <label>PRICE</label>
                            <input type="number" placeholder="가격" value={newOrder.price} onChange={(e)=>setNewOrder({...newOrder, price: e.target.value})} required />
                        </div>
                        <button type="submit" className="btn-order-create">MANUAL ADD</button>
                    </form>
                </section>

                {/* 검색창 */}
                <div className="order-search-filter">
                    <input
                        type="text"
                        placeholder="송장번호, 고객명, 품목으로 검색..."
                        value={filterTerm}
                        onChange={(e) => setFilterTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {/* 하단: 데이터 리스트 테이블 */}
            <section className="order-list-section">
                <div className="table-container">
                    <table className="root-order-table">
                        <thead>
                        <tr>
                            <th>INVOICE ID</th>
                            <th>CUSTOMER</th>
                            <th>GEAR INFO</th>
                            <th>PRICE</th>
                            <th>PROGRESS STATUS</th>
                            <th>ACTIONS</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map(order => (
                                <tr key={order.id} className={`status-row ${order.status}`}>
                                    <td className="tracking-code"># {order.merchantUid}</td>
                                    <td className="client-name">{order.memberName}</td>
                                    <td>
                                        {order.productName}
                                        <div style={{fontSize:'0.8rem', color:'#666'}}>{new Date(order.orderDate).toLocaleString()}</div>
                                    </td>
                                    <td style={{color: '#00d4ff', fontWeight:'bold'}}>{Number(order.price).toLocaleString()} ₩</td>
                                    <td>
                                        <div className="status-select-box">
                                            <select
                                                value={order.status || 'ORDERED'}
                                                onChange={(e) => updateStatus(order.id, e.target.value)}
                                                className={`status-select ${order.status}`}
                                            >
                                                <option value="ORDERED">접수됨 (ORDERED)</option>
                                                <option value="MANUFACTURING">제작 중 (MANUFACTURING)</option>
                                                <option value="QUALITY_CHECK">검수 중 (QC)</option>
                                                <option value="SHIPPING">배송 중 (SHIPPING)</option>
                                                <option value="COMPLETED">배송 완료 (COMPLETED)</option>
                                            </select>
                                        </div>
                                    </td>
                                    <td>
                                        <button onClick={() => deleteOrder(order.id)} className="btn-drop">삭제</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="empty-msg">일치하는 로그 데이터가 없습니다.</td>
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
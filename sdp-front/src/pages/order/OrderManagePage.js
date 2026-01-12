import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './Order.css';

function OrderManagePage() {
    const [orders, setOrders] = useState([]);
    const [newOrder, setNewOrder] = useState({ clientName: '', productName: '', contact: '' });
    const [filterTerm, setFilterTerm] = useState(''); // 검색 상태 추가

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/orders');
            setOrders(res.data);
        } catch (error) { console.error("데이터 동기화 실패:", error); }
    };

    // 실시간 검색 필터링 로직
    const filteredOrders = useMemo(() => {
        return orders.filter(order =>
            order.clientName.toLowerCase().includes(filterTerm.toLowerCase()) ||
            order.productName.toLowerCase().includes(filterTerm.toLowerCase()) ||
            order.trackingCode.toLowerCase().includes(filterTerm.toLowerCase())
        );
    }, [filterTerm, orders]);

    const addOrder = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8080/api/orders', newOrder);
            alert('✅ 새로운 시스템 로그가 생성되었습니다.');
            setNewOrder({ clientName: '', productName: '', contact: '' });
            fetchOrders();
        } catch (error) { alert('로그 생성 실패'); }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.put(`http://localhost:8080/api/orders/${id}/status?status=${status}`);
            fetchOrders();
        } catch (error) { console.error("프로세스 업데이트 실패:", error); }
    };

    const deleteOrder = async (id) => {
        if(window.confirm("해당 데이터를 폐기하시겠습니까?")) {
            await axios.delete(`http://localhost:8080/api/orders/${id}`);
            fetchOrders();
        }
    };

    return (
        <div className="order-manage-wrapper">
            <header className="order-header">
                <h2 className="order-page-title">LOGISTICS <span className="highlight">CONTROL</span></h2>
                <p className="order-subtitle">실시간 워크스테이션 배송 로그 및 공정 제어 시스템</p>
            </header>

            {/* 상단: 주문 생성 및 필터링 영역 */}
            <div className="order-top-controls">
                <section className="order-input-section">
                    <form onSubmit={addOrder} className="order-form-grid">
                        <div className="input-field">
                            <label>CUSTOMER</label>
                            <input placeholder="고객명" value={newOrder.clientName} onChange={(e)=>setNewOrder({...newOrder, clientName: e.target.value})} required />
                        </div>
                        <div className="input-field">
                            <label>GEAR TYPE</label>
                            <input placeholder="품목명" value={newOrder.productName} onChange={(e)=>setNewOrder({...newOrder, productName: e.target.value})} required />
                        </div>
                        <div className="input-field">
                            <label>CONTACT</label>
                            <input placeholder="연락처" value={newOrder.contact} onChange={(e)=>setNewOrder({...newOrder, contact: e.target.value})} required />
                        </div>
                        <button type="submit" className="btn-order-create">INITIATE</button>
                    </form>
                </section>

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

            {/* 하단: 데이터 그리드 리스트 */}
            <section className="order-list-section">
                <div className="table-container">
                    <table className="root-order-table">
                        <thead>
                        <tr>
                            <th>INVOICE</th>
                            <th>CUSTOMER</th>
                            <th>GEAR</th>
                            <th>PROGRESS STATUS</th>
                            <th>ACTIONS</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredOrders.map(order => (
                            <tr key={order.id} className={`status-row ${order.status}`}>
                                <td className="tracking-code"># {order.trackingCode}</td>
                                <td className="client-name">{order.clientName}</td>
                                <td>{order.productName}</td>
                                <td>
                                    <div className="status-select-box">
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateStatus(order.id, e.target.value)}
                                            className={`status-select ${order.status}`}
                                        >
                                            <option value="ORDERED">접수됨</option>
                                            <option value="MANUFACTURING">조립/커스텀</option>
                                            <option value="QUALITY_CHECK">최종 검수</option>
                                            <option value="SHIPPING">출고/배송</option>
                                            <option value="COMPLETED">배송 완료</option>
                                        </select>
                                    </div>
                                </td>
                                <td>
                                    <button onClick={() => deleteOrder(order.id)} className="btn-drop">폐기</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {filteredOrders.length === 0 && <div className="empty-msg">일치하는 로그 데이터가 없습니다.</div>}
                </div>
            </section>
        </div>
    );
}

export default OrderManagePage;
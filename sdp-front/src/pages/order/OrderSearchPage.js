import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Order.css';

function OrderManagePage() {
    const [orders, setOrders] = useState([]);
    const [newOrder, setNewOrder] = useState({ clientName: '', productName: '', contact: '' });

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/orders');
            setOrders(res.data);
        } catch (error) { console.error("데이터 로드 실패:", error); }
    };

    const addOrder = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8080/api/orders', newOrder);
            alert('✅ 시스템 주문 생성이 완료되었습니다.');
            setNewOrder({ clientName: '', productName: '', contact: '' });
            fetchOrders();
        } catch (error) { alert('주문 생성 실패'); }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.put(`http://localhost:8080/api/orders/${id}/status?status=${status}`);
            fetchOrders();
        } catch (error) { console.error("상태 업데이트 실패:", error); }
    };

    const deleteOrder = async (id) => {
        if(window.confirm("데이터를 영구 삭제하시겠습니까?")) {
            await axios.delete(`http://localhost:8080/api/orders/${id}`);
            fetchOrders();
        }
    };

    return (
        <div className="order-manage-wrapper">
            <header className="order-header">
                <h2 className="order-page-title">SYSTEM <span className="highlight">LOGISTICS</span></h2>
                <p className="order-subtitle">고객 주문 현황 및 배송 프로세스를 실시간으로 제어합니다.</p>
            </header>

            {/* 주문 생성 섹션 */}
            <section className="order-input-section">
                <form onSubmit={addOrder} className="order-form-grid">
                    <div className="input-field">
                        <label>CUSTOMER NAME</label>
                        <input placeholder="고객명 입력" value={newOrder.clientName} onChange={(e)=>setNewOrder({...newOrder, clientName: e.target.value})} required />
                    </div>
                    <div className="input-field">
                        <label>GEAR NAME</label>
                        <input placeholder="품목명 입력" value={newOrder.productName} onChange={(e)=>setNewOrder({...newOrder, productName: e.target.value})} required />
                    </div>
                    <div className="input-field">
                        <label>CONTACT</label>
                        <input placeholder="연락처 입력" value={newOrder.contact} onChange={(e)=>setNewOrder({...newOrder, contact: e.target.value})} required />
                    </div>
                    <button type="submit" className="btn-order-create">CREATE ORDER</button>
                </form>
            </section>

            {/* 주문 현황 리스트 */}
            <section className="order-list-section">
                <div className="list-header-box">
                    <h3>ACTIVE ORDERS ({orders.length})</h3>
                </div>
                <div className="table-responsive">
                    <table className="root-order-table">
                        <thead>
                        <tr>
                            <th>INVOICE</th>
                            <th>CUSTOMER</th>
                            <th>GEAR</th>
                            <th>PROCESS STATUS</th>
                            <th>MANAGEMENT</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.map(order => (
                            <tr key={order.id} className={`status-row ${order.status.toLowerCase()}`}>
                                <td className="tracking-code"># {order.trackingCode}</td>
                                <td>{order.clientName}</td>
                                <td className="gear-name-cell">{order.productName}</td>
                                <td>
                                    <div className="select-wrapper">
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateStatus(order.id, e.target.value)}
                                            className={`status-select ${order.status}`}
                                        >
                                            <option value="ORDERED">시스템 접수</option>
                                            <option value="MANUFACTURING">셋업/조립 중</option>
                                            <option value="QUALITY_CHECK">최종 검수</option>
                                            <option value="SHIPPING">배송 중</option>
                                            <option value="COMPLETED">배송 완료</option>
                                        </select>
                                    </div>
                                </td>
                                <td>
                                    <button onClick={() => deleteOrder(order.id)} className="btn-delete-small">DROP</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {orders.length === 0 && <div className="empty-msg">활성화된 주문 데이터가 없습니다.</div>}
                </div>
            </section>
        </div>
    );
}

export default OrderManagePage;
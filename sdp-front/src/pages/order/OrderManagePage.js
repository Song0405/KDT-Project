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
        } catch (error) { console.error(error); }
    };

    const addOrder = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8080/api/orders', newOrder);
            alert('주문 등록 완료!');
            setNewOrder({ clientName: '', productName: '', contact: '' });
            fetchOrders();
        } catch (error) { alert('등록 실패'); }
    };

    const updateStatus = async (id, status) => {
        await axios.put(`http://localhost:8080/api/orders/${id}/status?status=${status}`);
        fetchOrders();
    };

    const deleteOrder = async (id) => {
        if(window.confirm("삭제하시겠습니까?")) {
            await axios.delete(`http://localhost:8080/api/orders/${id}`);
            fetchOrders();
        }
    };

    return (
        <div className="order-manage-container">
            <h2>🏭 주문 공정 관리</h2>

            {/* 등록 폼 */}
            <form onSubmit={addOrder} className="order-form">
                <input placeholder="고객사명" value={newOrder.clientName} onChange={(e)=>setNewOrder({...newOrder, clientName: e.target.value})} required />
                <input placeholder="품목명" value={newOrder.productName} onChange={(e)=>setNewOrder({...newOrder, productName: e.target.value})} required />
                <input placeholder="연락처" value={newOrder.contact} onChange={(e)=>setNewOrder({...newOrder, contact: e.target.value})} required />
                <button type="submit">주문 생성</button>
            </form>

            {/* 목록 테이블 */}
            <table className="order-table">
                <thead>
                <tr>
                    <th>송장번호</th>
                    <th>고객사</th>
                    <th>품목</th>
                    <th>상태 변경</th>
                    <th>관리</th>
                </tr>
                </thead>
                <tbody>
                {orders.map(order => (
                    <tr key={order.id}>
                        <td>{order.trackingCode}</td>
                        <td>{order.clientName}</td>
                        <td>{order.productName}</td>
                        <td>
                            <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}>
                                <option value="ORDERED">주문 접수</option>
                                <option value="MANUFACTURING">제작/가공 중</option>
                                <option value="QUALITY_CHECK">품질 검사</option>
                                <option value="SHIPPING">배송 중</option>
                                <option value="COMPLETED">납품 완료</option>
                            </select>
                        </td>
                        <td><button onClick={() => deleteOrder(order.id)} className="del-btn">삭제</button></td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default OrderManagePage;
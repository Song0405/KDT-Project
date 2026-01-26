import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import './MyPage.css';

function MyPage() {
    const navigate = useNavigate();
    const hasAlerted = useRef(false);

    const [userInfo, setUserInfo] = useState({ name: '', email: '', joinDate: '' });
    const [rawOrderList, setRawOrderList] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [myContacts, setMyContacts] = useState([]);
    const [expandedContactId, setExpandedContactId] = useState(null);

    // 인라인 수정 상태
    const [editingContactId, setEditingContactId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    const realMemberId = localStorage.getItem('memberId');

    useEffect(() => {
        const storedName = localStorage.getItem('memberName');
        const storedEmail = localStorage.getItem('memberEmail') || 'guest@rootstation.com';

        if (!storedName) {
            if (!hasAlerted.current) {
                hasAlerted.current = true;
                Swal.fire({ icon: 'warning', title: '접근 제한', text: '로그인이 필요한 서비스입니다.', background: '#333', color: '#fff' })
                    .then(() => navigate('/members/login'));
            }
            return;
        }

        setUserInfo({
            name: storedName,
            joinDate: new Date().toLocaleDateString(),
            email: storedName === '관리자' ? 'root_admin@server.com' : storedEmail
        });

        if (storedName !== '관리자') {
            if (realMemberId) {
                axios.get(`http://localhost:8080/api/shop-orders?memberId=${realMemberId}`)
                    .then(res => setRawOrderList(res.data))
                    .catch(err => console.error(err));
            }
            axios.get(`http://localhost:8080/api/cart?memberName=${storedName}`)
                .then(res => setCartCount(res.data.length))
                .catch(err => console.error(err));
            axios.get(`http://localhost:8080/api/contact/my/${storedName}`)
                .then(res => setMyContacts(res.data))
                .catch(err => console.error(err));
        }
    }, [navigate, realMemberId]);

    // 주문 내역 그룹화
    const groupedOrders = useMemo(() => {
        const groups = {};
        rawOrderList.forEach(order => {
            const uid = order.merchantUid;
            if (!groups[uid]) {
                groups[uid] = {
                    merchantUid: uid,
                    orderDate: order.orderDate,
                    items: [],
                    totalPrice: 0,
                    repProductName: order.productName
                };
            }
            groups[uid].items.push(order);
            groups[uid].totalPrice += order.price;
        });
        return Object.values(groups).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    }, [rawOrderList]);

    const toggleContact = (id) => setExpandedContactId(expandedContactId === id ? null : id);

    // 문의 수정 관련
    const handleEditStart = (contact) => {
        setEditingContactId(contact.id);
        setEditTitle(contact.title);
        setEditContent(contact.content);
    };
    const handleEditCancel = () => {
        setEditingContactId(null);
        setEditTitle('');
        setEditContent('');
    };
    const handleEditSave = async (id) => {
        if (!editTitle.trim() || !editContent.trim()) {
            Swal.fire({ icon: 'warning', title: '입력 오류', text: '제목과 내용을 모두 입력해주세요.', background: '#333', color: '#fff' });
            return;
        }
        try {
            await axios.put(`http://localhost:8080/api/contact/${id}`, { title: editTitle, content: editContent });
            Swal.fire({ icon: 'success', title: '수정 완료', background: '#333', color: '#fff', confirmButtonColor: '#00d4ff' });
            setMyContacts(myContacts.map(c => c.id === id ? { ...c, title: editTitle, content: editContent } : c));
            setEditingContactId(null);
        } catch (err) { Swal.fire({ icon: 'error', title: '오류', text: '수정 중 문제가 발생했습니다.', background: '#333', color: '#fff' }); }
    };
    const handleDeleteContact = async (id) => {
        Swal.fire({
            title: '문의 삭제', text: "정말로 삭제하시겠습니까?", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#ff4d4d', cancelButtonColor: '#3085d6', confirmButtonText: '삭제',
            background: '#333', color: '#fff'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`http://localhost:8080/api/contact/${id}`);
                    Swal.fire({ icon: 'success', title: '삭제 완료', background: '#333', color: '#fff' });
                    setMyContacts(myContacts.filter(contact => contact.id !== id));
                } catch (err) { Swal.fire({ icon: 'error', title: '실패', background: '#333', color: '#fff' }); }
            }
        });
    };

    const handleWithdrawal = async () => {
        const { value: password } = await Swal.fire({
            title: '회원 탈퇴',
            input: 'password',
            inputLabel: '본인 확인을 위해 비밀번호를 입력해주세요',
            inputPlaceholder: '비밀번호 입력',
            showCancelButton: true,
            confirmButtonColor: '#ff4d4d',
            background: '#333', color: '#fff',
            inputAttributes: { autocapitalize: 'off', autocorrect: 'off' }
        });

        if (password) {
            try {
                await axios.post(`http://localhost:8080/api/members/withdraw`, {
                    memberId: realMemberId,
                    currentPassword: password,
                    type: 'individual'
                });
                Swal.fire({ icon: 'success', title: '탈퇴 완료', text: '이용해 주셔서 감사합니다.', background: '#333', color: '#fff' })
                    .then(() => { localStorage.clear(); window.location.href = '/'; });
            } catch (err) {
                Swal.fire({ icon: 'error', title: '탈퇴 실패', text: '비밀번호가 일치하지 않습니다.', background: '#333', color: '#fff' });
            }
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'ORDERED': return { text: '주문 접수', color: '#aaa', bg: '#333' };
            case 'MANUFACTURING': return { text: '상품 준비중', color: '#FFD700', bg: 'rgba(255, 215, 0, 0.1)' };
            case 'SHIPPING': return { text: '배송 중 🚚', color: '#00d4ff', bg: 'rgba(0, 212, 255, 0.1)' };
            case 'COMPLETED': return { text: '배송 완료 🎉', color: '#00ff7f', bg: 'rgba(0, 255, 127, 0.1)' };
            default: return { text: '처리 중', color: '#fff', bg: '#222' };
        }
    };

    const isAdmin = userInfo.name === '관리자';
    if (!userInfo.name) return null;

    return (
        <div className="mypage-container" style={{ color: 'white', padding: '50px 20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '40px' }}>MY PAGE</h1>

            {/* 프로필 카드 */}
            <div className="profile-card" style={{ display: 'flex', gap: '30px', alignItems: 'center', background: '#111', padding: '30px', borderRadius: '12px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: isAdmin ? '#3B82F6' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                    {isAdmin ? '🛡️' : '👤'}
                </div>
                <div className="profile-info">
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '1.8rem' }}>
                        {userInfo.name} <span style={{ fontSize: '1rem', color: isAdmin ? '#3B82F6' : '#888', fontWeight: 'normal' }}>
                            {isAdmin ? '[ SYSTEM ADMIN ]' : '[ MEMBER ]'}
                        </span>
                    </h2>
                    <p style={{ color: '#888', margin: '5px 0' }}>이메일: {userInfo.email}</p>
                </div>
            </div>

            <div className="dashboard-section" style={{ marginTop: '50px' }}>
                {isAdmin ? (
                    <div>
                        <h3 style={{ color: '#3B82F6' }}>🛡️ 관리자 전용 메뉴</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <Link to="/admin" style={adminButtonStyle}>⚙️ 제품 및 공지 관리</Link>
                            <Link to="/admin/orders" style={adminButtonStyle}>📦 전체 주문 공정 관리</Link>
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* 장바구니 섹션 */}
                        <div style={cartStatusStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#bb86fc' }}>🛒 MY SHOPPING CART</h3>
                                    <p style={{ margin: '5px 0 0 0', color: '#aaa' }}>현재 장바구니에 담긴 아이템</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{cartCount}</span>
                                    <span style={{ color: '#666' }}> 개</span>
                                </div>
                            </div>
                            <Link to="/cart" style={btnGoCart}>장바구니 확인하러 가기 →</Link>
                        </div>

                        {/* 문의 섹션 */}
                        <h3 style={{marginTop: '50px'}}>📩 내가 보낸 문의 ({myContacts.length}건)</h3>
                        <div style={{ marginTop: '20px', marginBottom: '50px' }}>
                            {myContacts.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {myContacts.map((contact) => (
                                        <div key={contact.id} style={{ background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
                                            <div
                                                onClick={() => !editingContactId && toggleContact(contact.id)}
                                                style={{
                                                    padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    cursor: editingContactId ? 'default' : 'pointer',
                                                    borderLeft: contact.answer ? '4px solid #00d4ff' : '4px solid #555',
                                                    background: expandedContactId === contact.id ? '#222' : '#1a1a1a', transition: '0.3s'
                                                }}
                                            >
                                                <div>
                                                    {editingContactId === contact.id ? (
                                                        <input style={editInputStyle} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onClick={(e) => e.stopPropagation()} />
                                                    ) : (
                                                        <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: 'white' }}>{contact.title}</h4>
                                                    )}
                                                    <p style={{ color: '#666', margin: 0, fontSize: '0.8rem' }}>{new Date(contact.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                                    {contact.answer ? <span style={{background: '#00d4ff', color: 'black', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold'}}>답변 완료</span> : <span style={{background: '#333', color: '#aaa', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px'}}>대기 중</span>}
                                                    <span style={{fontSize:'0.8rem', color:'#666'}}>{expandedContactId === contact.id ? '▲' : '▼'}</span>
                                                </div>
                                            </div>
                                            {expandedContactId === contact.id && (
                                                <div style={{ background: '#000', padding: '20px', borderTop: '1px solid #333' }}>
                                                    {editingContactId === contact.id ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                            <textarea style={{ ...editInputStyle, height: '150px', resize: 'none' }} value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                                <button onClick={() => handleEditSave(contact.id)} style={saveBtnStyle}>저장하기</button>
                                                                <button onClick={handleEditCancel} style={cancelBtnStyle}>취소</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p style={{color: '#ddd', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', marginBottom:'20px'}}>{contact.content}</p>
                                                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                                                {!contact.answer && <button onClick={(e) => { e.stopPropagation(); handleEditStart(contact); }} style={contactActionBtnStyle}>수정하기</button>}
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteContact(contact.id); }} style={{ ...contactActionBtnStyle, color: '#ff4d4d', borderColor: '#ff4d4d' }}>삭제하기</button>
                                                            </div>
                                                            {contact.answer && <div style={{background: 'rgba(0, 212, 255, 0.05)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #00d4ff'}}><h5 style={{margin: '0 0 10px 0', color: '#00d4ff', fontSize: '0.9rem'}}>↳ ROOT STATION 고객센터</h5><p style={{color: '#ccc', fontSize: '0.95rem', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap'}}>{contact.answer}</p></div>}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : <div style={{ background: '#1a1a1a', padding: '30px', textAlign: 'center', borderRadius: '8px', color: '#666' }}>작성한 문의 내역이 없습니다.</div>}
                        </div>

                        {/* ⭐ 주문 내역 (ORDER NO. 수정 완료) */}
                        <h3>📦 최근 주문 내역 ({groupedOrders.length}건)</h3>
                        <div className="order-list" style={{ marginTop: '20px' }}>
                            {groupedOrders.length > 0 ? groupedOrders.map((group) => (
                                <div key={group.merchantUid} className="order-group-card" style={{ marginBottom: '20px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>

                                    {/* 주문 헤더: .split('_')[1] 제거하여 전체 번호 노출 */}
                                    <div className="order-group-header" style={{ padding: '15px 20px', background: '#222', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                            <span style={{ fontSize: '0.9rem', color: '#aaa' }}>{new Date(group.orderDate).toLocaleDateString()}</span>
                                            {/* ⭐ 여기가 수정된 부분입니다! */}
                                            <span style={{ fontSize: '0.85rem', color: '#555', fontFamily: 'monospace' }}>ORDER NO. {group.merchantUid}</span>
                                        </div>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>{group.totalPrice.toLocaleString()} KRW</span>
                                    </div>

                                    <div className="order-items-list" style={{ padding: '0 20px' }}>
                                        {group.items.map(order => {
                                            const status = getStatusInfo(order.status || 'ORDERED');
                                            return (
                                                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px dashed #333' }}>
                                                    <div style={{display:'flex', flexDirection:'column'}}>
                                                        <span style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom:'5px'}}>{order.productName}</span>
                                                        <span style={{fontSize: '0.9rem', color: '#666'}}>{order.price.toLocaleString()} KRW</span>
                                                    </div>

                                                    <div style={{textAlign:'right'}}>
                                                        <span style={{
                                                            display: 'inline-block', padding: '6px 12px', borderRadius: '20px',
                                                            background: status.bg, color: status.color, fontSize: '0.85rem', fontWeight: 'bold', border: `1px solid ${status.color}`
                                                        }}>
                                                            {status.text}
                                                        </span>

                                                        {/* 송장 번호 표시 */}
                                                        {order.trackingNumber && (
                                                            <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#00d4ff', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                                                                <span>🚚 송장:</span>
                                                                <span style={{ fontFamily: 'monospace', textDecoration: 'underline', cursor: 'pointer' }}
                                                                      onClick={() => Swal.fire({ icon: 'info', title: '배송 조회', text: `송장번호: ${order.trackingNumber}`, background: '#333', color: '#fff' })}
                                                                >
                                                                    {order.trackingNumber}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ padding: '15px 20px', textAlign: 'center', background: '#151515', fontSize: '0.8rem', color: '#555' }}>
                                        ROOT STATION LOGISTICS
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#666', border: '1px dashed #333', borderRadius: '8px' }}>
                                    주문 내역이 없습니다.
                                </div>
                            )}
                        </div>

                        <h3 style={{ marginTop: '40px' }}>🔐 개인정보 관리</h3>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                            <button style={outlineButtonStyle} onClick={() => navigate('/members/edit')}>개인정보 변경</button>
                            <button style={outlineButtonStyle} onClick={handleWithdrawal}>회원 탈퇴</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const adminButtonStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#1e293b', color: '#3B82F6', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', border: '1px solid #3B82F6', transition: '0.3s' };
const cartStatusStyle = { background: 'linear-gradient(45deg, #1a1a1a, #222)', padding: '25px', borderRadius: '12px', marginBottom: '40px', border: '1px solid #333', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' };
const btnGoCart = { display: 'block', marginTop: '15px', padding: '12px', background: '#bb86fc', color: '#000', textAlign: 'center', fontWeight: 'bold', borderRadius: '6px', textDecoration: 'none', transition: '0.3s' };
const outlineButtonStyle = { padding: '10px 20px', background: 'transparent', border: '1px solid #555', color: '#aaa', borderRadius: '4px', cursor: 'pointer' };
const contactActionBtnStyle = { padding: '6px 14px', background: 'transparent', border: '1px solid #444', color: '#00d4ff', borderRadius: '4px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' };
const editInputStyle = { width: '100%', padding: '10px', background: '#111', border: '1px solid #444', color: 'white', borderRadius: '4px', outline: 'none', marginBottom: '5px' };
const saveBtnStyle = { padding: '8px 16px', background: '#00d4ff', color: 'black', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' };
const cancelBtnStyle = { padding: '8px 16px', background: '#333', color: 'white', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer' };

export default MyPage;
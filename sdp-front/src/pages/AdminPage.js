import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './AdminPage.css';

const API_BASE_URL = 'http://localhost:8080/api';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

function AdminPage() {
    // --- 1. 상태 관리 (States) ---
    const [products, setProducts] = useState([]);
    const [newProduct, setNewProduct] = useState({
        name: '', description: '', price: '', category: 'KEYBOARD'
    });
    const [newProductFile, setNewProductFile] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingProductFile, setEditingProductFile] = useState(null);

    const [notices, setNotices] = useState([]);
    const [newNotice, setNewNotice] = useState({ title: '', content: '' });
    const [editingNotice, setEditingNotice] = useState(null);

    const [contacts, setContacts] = useState([]);

    // ✨ [추가] 답변 작성을 위한 상태변수
    const [activeContactId, setActiveContactId] = useState(null); // 현재 답변 중인 문의글 ID
    const [replyText, setReplyText] = useState(''); // 답변 내용

    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // --- 2. 초기 데이터 로드 ---
    useEffect(() => {
        fetchProducts();
        fetchNotices();
        fetchContacts();
    }, []);

    const fetchProducts = async () => {
        try { const res = await axios.get(`${API_BASE_URL}/products`); setProducts(res.data); }
        catch (err) { console.error('제품 로드 실패', err); }
    };

    const fetchNotices = async () => {
        try { const res = await axios.get(`${API_BASE_URL}/notices`); setNotices(res.data); }
        catch (err) { console.error('공지 로드 실패', err); }
    };

    const fetchContacts = async () => {
        try { const res = await axios.get(`${API_BASE_URL}/contact`); setContacts(res.data); }
        catch (err) { console.error('문의사항 로드 실패', err); }
    };

    // ✨ [추가] 답변 등록 함수
    const handleRegisterAnswer = async (id) => {
        if(!replyText.trim()) return alert("답변 내용을 입력해주세요.");

        try {
            await axios.put(`${API_BASE_URL}/contact/${id}/answer`, {
                answer: replyText
            });
            alert("✅ 답변이 등록되었습니다.");

            // 상태 초기화 및 목록 새로고침
            setActiveContactId(null);
            setReplyText('');
            fetchContacts();
        } catch (err) {
            console.error("답변 등록 실패", err);
            alert("답변 등록 중 오류가 발생했습니다.");
        }
    };

    // ✨ [추가] 답변 작성 모드 시작
    const startReplying = (contact) => {
        setActiveContactId(contact.id);
        setReplyText(contact.answer || ''); // 기존 답변이 있으면 불러오기
    };

    // --- 3. 제품 관리 함수 ---
    const handleAddProduct = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData();
        formData.append("product", new Blob([JSON.stringify(newProduct)], { type: "application/json" }));
        if (newProductFile) formData.append("image", newProductFile);

        try {
            await axios.post(`${API_BASE_URL}/products`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert('✅ 제품이 성공적으로 등록되었습니다.');
            setNewProduct({ name: '', description: '', price: '', category: 'KEYBOARD' });
            setNewProductFile(null);
            fetchProducts();
        } catch (err) { alert('등록 중 오류가 발생했습니다.'); }
        finally { setIsLoading(false); }
    };

    const startEditingProduct = (product) => {
        setEditingProduct({ ...product });
        setEditingProductFile(null);
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        const formData = new FormData();
        formData.append("product", new Blob([JSON.stringify(editingProduct)], { type: "application/json" }));
        if (editingProductFile) formData.append("image", editingProductFile);

        try {
            await axios.put(`${API_BASE_URL}/products/${editingProduct.id}`, formData);
            alert('✅ 제품 정보가 수정되었습니다.');
            setEditingProduct(null);
            fetchProducts();
        } catch (err) { alert('수정 중 오류가 발생했습니다.'); }
        finally { setIsUpdating(false); }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('이 제품을 삭제하시겠습니까?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/products/${id}`);
            fetchProducts();
        } catch (err) { alert('삭제 실패'); }
    };

    // --- 4. 공지사항 관리 함수 ---
    const handleAddNotice = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/notices`, newNotice);
            alert('✅ 공지사항이 등록되었습니다.');
            setNewNotice({ title: '', content: '' });
            fetchNotices();
        } catch (err) { alert('공지 등록 실패'); }
    };

    const startEditingNotice = (notice) => {
        setEditingNotice({ ...notice });
    };

    const handleUpdateNotice = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_BASE_URL}/notices/${editingNotice.id}`, editingNotice);
            alert('✅ 공지사항이 수정되었습니다.');
            setEditingNotice(null);
            fetchNotices();
        } catch (err) { alert('공지 수정 실패'); }
    };

    const deleteNotice = async (id) => {
        if (!window.confirm('공지사항을 삭제하시겠습니까?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/notices/${id}`);
            fetchNotices();
        } catch (err) { alert('공지 삭제 실패'); }
    };

    return (
        <div className="admin-dashboard">
            <header className="admin-hero">
                <h1>ROOT STATION <span className="highlight-text">CORE CONTROL</span></h1>
                <Link to="/admin/orders" className="nav-shortcut"><span>📦 주문 공정 시스템 이동</span></Link>
            </header>

            <div className="admin-grid">
                {/* 왼쪽 컬럼: 제품 및 공지 등록 */}
                <div className="admin-col">
                    <section className="admin-section">
                        <h2>✨ 신규 제품 등록</h2>
                        <form onSubmit={handleAddProduct} className="admin-form">
                            <div className="input-group-field">
                                <label>제품 분류 (Category)</label>
                                <select
                                    className="admin-select"
                                    value={newProduct.category}
                                    onChange={(e)=>setNewProduct({...newProduct, category: e.target.value})}
                                >
                                    <option value="KEYBOARD">KEYBOARD (키보드)</option>
                                    <option value="PC">PC (데스크탑)</option>
                                    <option value="MONITOR">MONITOR (모니터)</option>
                                    <option value="ACC">ACCESSORY (소품/기타)</option>
                                </select>
                            </div>
                            <input type="text" placeholder="제품 이름" value={newProduct.name} onChange={(e)=>setNewProduct({...newProduct, name: e.target.value})} required />
                            <textarea placeholder="상세 사양" value={newProduct.description} onChange={(e)=>setNewProduct({...newProduct, description: e.target.value})} required />
                            <input type="number" placeholder="가격 (KRW)" value={newProduct.price} onChange={(e)=>setNewProduct({...newProduct, price: e.target.value})} required />
                            <div className="custom-file-upload">
                                <label htmlFor="file-add">📸 제품 이미지 선택</label>
                                <input id="file-add" type="file" onChange={(e)=>setNewProductFile(e.target.files[0])} />
                                {newProductFile && <span className="file-name">{newProductFile.name}</span>}
                            </div>
                            <button type="submit" className="btn-submit-ai" disabled={isLoading}>
                                {isLoading ? 'AI 분석 중...' : '분석 및 제품 등록'}
                            </button>
                        </form>
                    </section>

                    <section className="admin-section">
                        <h2>📢 새 공지사항 작성</h2>
                        <form onSubmit={handleAddNotice} className="admin-form">
                            <input type="text" placeholder="공지사항 제목" value={newNotice.title} onChange={(e)=>setNewNotice({...newNotice, title: e.target.value})} required />
                            <textarea placeholder="내용을 입력하세요" value={newNotice.content} onChange={(e)=>setNewNotice({...newNotice, content: e.target.value})} required />
                            <button type="submit" className="btn-primary">공지사항 등록</button>
                        </form>
                    </section>
                </div>

                {/* 오른쪽 컬럼: 목록 관리 */}
                <div className="admin-col">
                    {/* ✨ [수정] 1:1 문의 내역 + 답변 기능 추가 */}
                    <section className="admin-section">
                        <h2>📩 1:1 문의 내역 ({contacts.length})</h2>
                        <div className="vertical-scroll-area">
                            {contacts.length > 0 ? contacts.map(c => (
                                <div key={c.id} className="admin-list-card" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '8px', padding: '15px'}}>

                                    {/* 1. 문의 내용 표시 */}
                                    <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                                        <h4 style={{color: '#00d4ff', margin: 0, fontSize: '1rem'}}>{c.title}</h4>
                                        <span style={{fontSize: '0.8rem', color: '#666'}}>
                                            {new Date(c.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div style={{background: '#111', padding: '10px', borderRadius: '5px', width: '100%', border: '1px solid #333'}}>
                                        <p style={{color: '#ddd', fontSize: '0.9rem', margin: 0, whiteSpace: 'pre-wrap'}}>{c.content}</p>
                                    </div>
                                    <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <span style={{fontSize: '0.85rem', color: '#888'}}>✍ 작성자: <span style={{color: '#aaa'}}>{c.writer || '익명'}</span></span>
                                        {/* 답변 완료 뱃지 */}
                                        {c.answer && activeContactId !== c.id && (
                                            <span style={{background: '#00d4ff', color: 'black', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold'}}>답변 완료</span>
                                        )}
                                    </div>

                                    {/* 2. 관리자 답변 표시 영역 */}
                                    {c.answer && activeContactId !== c.id && (
                                        <div style={{marginTop: '10px', width: '100%', background: 'rgba(0, 212, 255, 0.1)', padding: '10px', borderRadius: '5px', borderLeft: '3px solid #00d4ff'}}>
                                            <h5 style={{margin: '0 0 5px 0', color: '#00d4ff', fontSize: '0.9rem'}}>↳ 관리자 답변:</h5>
                                            <p style={{color: '#ccc', fontSize: '0.9rem', margin: 0, whiteSpace: 'pre-wrap'}}>{c.answer}</p>
                                        </div>
                                    )}

                                    {/* 3. 답변 작성 폼 (편집 모드일 때만 보임) */}
                                    {activeContactId === c.id ? (
                                        <div style={{width: '100%', marginTop: '10px', animation: 'fadeIn 0.3s'}}>
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="답변 내용을 입력하세요..."
                                                style={{width: '100%', minHeight: '80px', background: '#222', border: '1px solid #444', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '8px'}}
                                            />
                                            <div style={{display: 'flex', gap: '5px'}}>
                                                <button onClick={() => handleRegisterAnswer(c.id)} className="btn-save-small">답변 등록</button>
                                                <button onClick={() => {setActiveContactId(null); setReplyText('');}} className="btn-cancel-small">취소</button>
                                            </div>
                                        </div>
                                    ) : (
                                        // 4. 답변하기 버튼 (편집 모드가 아닐 때)
                                        <button
                                            onClick={() => startReplying(c)}
                                            style={{marginTop: '5px', background: 'none', border: '1px solid #555', color: '#aaa', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem'}}
                                        >
                                            {c.answer ? '답변 수정하기' : '답변 달기'}
                                        </button>
                                    )}

                                </div>
                            )) : <p className="dim-text">등록된 문의가 없습니다.</p>}
                        </div>
                    </section>

                    <section className="admin-section list-section">
                        <h2>📦 제품 라이브러리 ({products.length})</h2>
                        <div className="vertical-scroll-area">
                            {products.length > 0 ? products.map(p => (
                                <div key={p.id} className="admin-list-card">
                                    <img src={`${IMAGE_SERVER_URL}/${p.imageFileName}`} alt="" className="list-thumb" onError={(e)=>e.target.src='https://via.placeholder.com/50'}/>
                                    <div className="list-info">
                                        <div className="list-title-row">
                                            <span className="category-tag">[{p.category || 'GEAR'}]</span>
                                            <h4>{p.name}</h4>
                                        </div>
                                        <span className="price-tag">{p.price?.toLocaleString()} KRW</span>
                                    </div>
                                    <div className="list-btns">
                                        <button onClick={() => startEditingProduct(p)}>수정</button>
                                        <button onClick={() => handleDeleteProduct(p.id)} className="btn-del">삭제</button>
                                    </div>
                                </div>
                            )) : <p className="dim-text">등록된 제품이 없습니다.</p>}
                        </div>
                    </section>

                    <section className="admin-section">
                        <h2>🔔 공지사항 기록</h2>
                        <div className="vertical-scroll-area">
                            {notices.length > 0 ? notices.map(n => (
                                <div key={n.id} className="admin-list-card notice-item-vertical">
                                    {editingNotice && editingNotice.id === n.id ? (
                                        <form onSubmit={handleUpdateNotice} className="edit-inline-form">
                                            <input type="text" value={editingNotice.title} onChange={(e)=>setEditingNotice({...editingNotice, title: e.target.value})} />
                                            <textarea value={editingNotice.content} onChange={(e)=>setEditingNotice({...editingNotice, content: e.target.value})} />
                                            <div className="form-actions">
                                                <button type="submit" className="btn-save-small">저장</button>
                                                <button type="button" className="btn-cancel-small" onClick={()=>setEditingNotice(null)}>닫기</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <div className="list-info">
                                                <h4>{n.title}</h4>
                                                <p className="notice-preview">{n.content}</p>
                                            </div>
                                            <div className="list-btns">
                                                <button onClick={() => startEditingNotice(n)}>수정</button>
                                                <button onClick={() => deleteNotice(n.id)} className="btn-del">삭제</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )) : <p className="dim-text">등록된 공지사항이 없습니다.</p>}
                        </div>
                    </section>
                </div>
            </div>

            {/* 제품 수정 모달 */}
            {editingProduct && (
                <div className="edit-overlay">
                    <div className="edit-modal">
                        <h3>제품 상세 정보 수정</h3>
                        <form onSubmit={handleUpdateProduct} className="admin-form">
                            <label className="modal-label">제품 카테고리</label>
                            <select
                                className="admin-select"
                                value={editingProduct.category}
                                onChange={(e)=>setEditingProduct({...editingProduct, category: e.target.value})}
                            >
                                <option value="KEYBOARD">KEYBOARD</option>
                                <option value="PC">PC</option>
                                <option value="MONITOR">MONITOR</option>
                                <option value="ACC">ACC</option>
                            </select>
                            <input type="text" value={editingProduct.name} onChange={(e)=>setEditingProduct({...editingProduct, name: e.target.value})} placeholder="제품 이름" />
                            <textarea value={editingProduct.description} onChange={(e)=>setEditingProduct({...editingProduct, description: e.target.value})} placeholder="제품 설명" />
                            <input type="number" value={editingProduct.price} onChange={(e)=>setEditingProduct({...editingProduct, price: e.target.value})} placeholder="가격" />
                            <div className="form-actions">
                                <button type="submit" className="btn-primary" disabled={isUpdating}>{isUpdating ? '저장 중...' : '저장하기'}</button>
                                <button type="button" className="btn-cancel" onClick={() => setEditingProduct(null)}>취소</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPage;
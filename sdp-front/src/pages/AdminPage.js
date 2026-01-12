import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './AdminPage.css';

const API_BASE_URL = 'http://localhost:8080/api';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

function AdminPage() {
    // --- 1. 상태 관리 (States) ---
    const [products, setProducts] = useState([]);
    // category 필드 추가 (기본값: KEYBOARD)
    const [newProduct, setNewProduct] = useState({
        name: '', description: '', price: '', category: 'KEYBOARD'
    });
    const [newProductFile, setNewProductFile] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingProductFile, setEditingProductFile] = useState(null);

    const [notices, setNotices] = useState([]);
    const [newNotice, setNewNotice] = useState({ title: '', content: '' });
    const [editingNotice, setEditingNotice] = useState(null);

    const [companyInfo, setCompanyInfo] = useState(null);
    const [editingCompanyInfo, setEditingCompanyInfo] = useState(null);

    const [isLoading, setIsLoading] = useState(false); // 제품 등록 로딩
    const [isUpdating, setIsUpdating] = useState(false); // 제품 수정 로딩

    // --- 2. 초기 데이터 로드 ---
    useEffect(() => {
        fetchProducts();
        fetchNotices();
        fetchCompanyInfo();
    }, []);

    const fetchProducts = async () => {
        try { const res = await axios.get(`${API_BASE_URL}/products`); setProducts(res.data); }
        catch (err) { console.error('제품 로드 실패', err); }
    };

    const fetchNotices = async () => {
        try { const res = await axios.get(`${API_BASE_URL}/notices`); setNotices(res.data); }
        catch (err) { console.error('공지 로드 실패', err); }
    };

    const fetchCompanyInfo = async () => {
        try { const res = await axios.get(`${API_BASE_URL}/company-info`); setCompanyInfo(res.data); }
        catch (err) { console.error('회사정보 로드 실패', err); }
    };

    // --- 3. 제품 관리 함수 (CRUD) ---
    const handleAddProduct = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData();
        // newProduct 객체(카테고리 포함)를 Blob으로 변환
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

    // --- 5. 회사 정보 관리 함수 ---
    const handleUpdateCompany = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`${API_BASE_URL}/company-info`, editingCompanyInfo);
            setCompanyInfo(res.data);
            setEditingCompanyInfo(null);
            alert('✅ 브랜드 프로필이 업데이트되었습니다.');
        } catch (err) { alert('업데이트 실패'); }
    };

    // --- 6. JSX 렌더링 ---
    return (
        <div className="admin-dashboard">
            <header className="admin-hero">
                <h1>ROOT STATION <span className="highlight-text">CORE CONTROL</span></h1>
                <Link to="/admin/orders" className="nav-shortcut"><span>📦 주문 공정 시스템 이동</span></Link>
            </header>

            <div className="admin-grid">
                {/* 왼쪽 컬럼: 설정 및 등록 */}
                <div className="admin-col">
                    <section className="admin-section">
                        <h2>🏢 브랜드 프로필</h2>
                        {companyInfo && (
                            editingCompanyInfo ? (
                                <form onSubmit={handleUpdateCompany} className="admin-form">
                                    <input type="text" value={editingCompanyInfo.name} onChange={(e)=>setEditingCompanyInfo({...editingCompanyInfo, name: e.target.value})} placeholder="회사 이름" />
                                    <textarea value={editingCompanyInfo.description} onChange={(e)=>setEditingCompanyInfo({...editingCompanyInfo, description: e.target.value})} placeholder="브랜드 설명" />
                                    <div className="form-actions">
                                        <button type="submit" className="btn-save-small">저장</button>
                                        <button type="button" className="btn-cancel-small" onClick={() => setEditingCompanyInfo(null)}>취on</button>
                                    </div>
                                </form>
                            ) : (
                                <div className="info-preview-card">
                                    <p><strong>브랜드명:</strong> {companyInfo.name}</p>
                                    <p className="dim-text">{companyInfo.description}</p>
                                    <button className="btn-edit-outline" onClick={() => setEditingCompanyInfo(companyInfo)}>프로필 수정</button>
                                </div>
                            )
                        )}
                    </section>

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
                        <h2>📢 새 공지사항</h2>
                        <form onSubmit={handleAddNotice} className="admin-form">
                            <input type="text" placeholder="제목" value={newNotice.title} onChange={(e)=>setNewNotice({...newNotice, title: e.target.value})} required />
                            <textarea placeholder="내용" value={newNotice.content} onChange={(e)=>setNewNotice({...newNotice, content: e.target.value})} required />
                            <button type="submit" className="btn-primary">공지 등록</button>
                        </form>
                    </section>
                </div>

                {/* 오른쪽 컬럼: 목록 및 아카이브 */}
                <div className="admin-col">
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
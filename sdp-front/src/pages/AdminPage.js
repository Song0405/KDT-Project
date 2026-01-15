import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './AdminPage.css';

const API_BASE_URL = 'http://localhost:8080/api';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

function AdminPage() {
    // --- 1. 상태 관리 ---
    const [products, setProducts] = useState([]);

    // ⭐ [수정] usage(용도) 상태 추가 (기본값: GAMING)
    const [newProduct, setNewProduct] = useState({
        name: '', description: '', price: '',
        category: 'KEYBOARD',
        usage: 'GAMING'
    });
    const [newProductFile, setNewProductFile] = useState(null);

    // ✨ 수정용 상태 (이미지 포함)
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingProductFile, setEditingProductFile] = useState(null);

    const [notices, setNotices] = useState([]);
    const [newNotice, setNewNotice] = useState({ title: '', content: '' });
    const [editingNotice, setEditingNotice] = useState(null);

    const [contacts, setContacts] = useState([]);
    const [activeContactId, setActiveContactId] = useState(null);
    const [replyText, setReplyText] = useState('');

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

    // 답변 등록
    const handleRegisterAnswer = async (id) => {
        if(!replyText.trim()) return alert("답변 내용을 입력해주세요.");
        try {
            await axios.put(`${API_BASE_URL}/contact/${id}/answer`, { answer: replyText });
            alert("✅ 답변이 등록되었습니다.");
            setActiveContactId(null);
            setReplyText('');
            fetchContacts();
        } catch (err) { alert("답변 등록 실패"); }
    };

    // --- 3. 제품 등록/수정/삭제 ---
    const handleAddProduct = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData();
        formData.append("product", new Blob([JSON.stringify(newProduct)], { type: "application/json" }));
        if (newProductFile) formData.append("image", newProductFile);

        try {
            await axios.post(`${API_BASE_URL}/products`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert('✅ 제품 등록 완료!');
            // ⭐ 초기화 시 usage도 초기화
            setNewProduct({ name: '', description: '', price: '', category: 'KEYBOARD', usage: 'GAMING' });
            setNewProductFile(null);
            fetchProducts();
        } catch (err) { alert('등록 실패'); }
        finally { setIsLoading(false); }
    };

    const startEditingProduct = (product) => {
        // ⭐ 기존 데이터에 usage가 없으면 기본값 'GAMING' 부여
        setEditingProduct({ ...product, usage: product.usage || 'GAMING' });
        setEditingProductFile(null); // 이미지 파일 초기화
    };

    // ✨ 제품 수정 함수 (이미지 포함)
    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        const formData = new FormData();
        formData.append("product", new Blob([JSON.stringify(editingProduct)], { type: "application/json" }));

        // 새 이미지가 있으면 추가
        if (editingProductFile) {
            formData.append("image", editingProductFile);
        }

        try {
            await axios.put(`${API_BASE_URL}/products/${editingProduct.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('✅ 수정되었습니다!');
            setEditingProduct(null);
            setEditingProductFile(null);
            fetchProducts();
        } catch (err) { alert('수정 실패'); }
        finally { setIsUpdating(false); }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('삭제하시겠습니까?')) return;
        try { await axios.delete(`${API_BASE_URL}/products/${id}`); fetchProducts(); }
        catch (err) { alert('삭제 실패'); }
    };

    // --- 4. 공지사항 관리 ---
    const handleAddNotice = async (e) => {
        e.preventDefault();
        try { await axios.post(`${API_BASE_URL}/notices`, newNotice); alert('공지 등록 완료'); setNewNotice({ title: '', content: '' }); fetchNotices(); }
        catch (err) { alert('실패'); }
    };
    const handleUpdateNotice = async (e) => {
        e.preventDefault();
        try { await axios.put(`${API_BASE_URL}/notices/${editingNotice.id}`, editingNotice); alert('공지 수정 완료'); setEditingNotice(null); fetchNotices(); }
        catch (err) { alert('실패'); }
    };
    const deleteNotice = async (id) => {
        if (!window.confirm('삭제?')) return;
        try { await axios.delete(`${API_BASE_URL}/notices/${id}`); fetchNotices(); } catch (err) { alert('실패'); }
    };

    return (
        <div className="admin-dashboard">
            <header className="admin-hero">
                <h1>ROOT STATION <span className="highlight-text">CORE CONTROL</span></h1>
                <Link to="/admin/orders" className="nav-shortcut"><span>📦 주문 공정 시스템 이동</span></Link>
            </header>

            <div className="admin-grid">
                {/* 왼쪽: 등록 폼 */}
                <div className="admin-col">
                    <section className="admin-section">
                        <h2>✨ 신규 제품 등록</h2>
                        <form onSubmit={handleAddProduct} className="admin-form">

                            {/* ⭐ [추가] 용도(USAGE) 선택 드롭다운 */}
                            <div className="input-group-field">
                                <label style={{color:'#00d4ff'}}>용도 (USAGE)</label>
                                <select
                                    className="admin-select"
                                    value={newProduct.usage}
                                    onChange={(e) => setNewProduct({...newProduct, usage: e.target.value})}
                                    style={{ border: '1px solid #00d4ff' }}
                                >
                                    <option value="GAMING">GAMING (게이밍)</option>
                                    <option value="OFFICE">OFFICE (사무용)</option>
                                    <option value="WORKSTATION">WORKSTATION (워크스테이션)</option>
                                </select>
                            </div>

                            <div className="input-group-field">
                                <label>카테고리</label>
                                <select className="admin-select" value={newProduct.category} onChange={(e)=>setNewProduct({...newProduct, category: e.target.value})}>
                                    <option value="KEYBOARD">KEYBOARD</option>
                                    <option value="PC">PC</option>
                                    <option value="MONITOR">MONITOR</option>
                                    <option value="ACC">ACC</option>
                                </select>
                            </div>

                            <input type="text" placeholder="이름" value={newProduct.name} onChange={(e)=>setNewProduct({...newProduct, name: e.target.value})} required />
                            <textarea placeholder="설명" value={newProduct.description} onChange={(e)=>setNewProduct({...newProduct, description: e.target.value})} required />
                            <input type="number" placeholder="가격" value={newProduct.price} onChange={(e)=>setNewProduct({...newProduct, price: e.target.value})} required />
                            <div className="custom-file-upload">
                                <label htmlFor="file-add">📸 제품 이미지</label>
                                <input id="file-add" type="file" onChange={(e)=>setNewProductFile(e.target.files[0])} />
                                {newProductFile && <span className="file-name">{newProductFile.name}</span>}
                            </div>
                            <button type="submit" className="btn-submit-ai" disabled={isLoading}>{isLoading ? '등록 중...' : '등록'}</button>
                        </form>
                    </section>

                    <section className="admin-section">
                        <h2>📢 공지사항</h2>
                        <form onSubmit={handleAddNotice} className="admin-form">
                            <input type="text" placeholder="제목" value={newNotice.title} onChange={(e)=>setNewNotice({...newNotice, title: e.target.value})} required />
                            <textarea placeholder="내용" value={newNotice.content} onChange={(e)=>setNewNotice({...newNotice, content: e.target.value})} required />
                            <button type="submit" className="btn-primary">등록</button>
                        </form>
                    </section>
                </div>

                {/* 오른쪽: 목록 및 문의 */}
                <div className="admin-col">
                    <section className="admin-section">
                        <h2>📩 1:1 문의 ({contacts.length})</h2>
                        <div className="vertical-scroll-area">
                            {contacts.map(c => (
                                <div key={c.id} className="admin-list-card" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '8px'}}>
                                    <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                                        <h4 style={{color:'#00d4ff', margin:0}}>{c.title}</h4>
                                        <span style={{fontSize:'0.8rem', color:'#666'}}>{new Date(c.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p style={{color:'#ddd', fontSize:'0.9rem'}}>{c.content}</p>
                                    {c.answer && activeContactId !== c.id && (
                                        <div style={{background:'rgba(0,212,255,0.1)', padding:'10px', width:'100%', borderRadius:'4px', marginTop:'5px'}}>
                                            <p style={{color:'#ccc', margin:0}}>↳ {c.answer}</p>
                                        </div>
                                    )}
                                    {activeContactId === c.id ? (
                                        <div style={{width:'100%', marginTop:'5px'}}>
                                            <textarea value={replyText} onChange={(e)=>setReplyText(e.target.value)} style={{width:'100%', background:'#222', color:'white'}} placeholder="답변 입력..." />
                                            <button onClick={()=>handleRegisterAnswer(c.id)} className="btn-save-small">등록</button>
                                            <button onClick={()=>{setActiveContactId(null); setReplyText('');}} className="btn-cancel-small">취소</button>
                                        </div>
                                    ) : (
                                        <button onClick={()=>{setActiveContactId(c.id); setReplyText(c.answer||'');}} style={{background:'none', border:'1px solid #555', color:'#aaa', fontSize:'0.8rem', marginTop:'5px'}}>
                                            {c.answer ? '답변 수정' : '답변 달기'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="admin-section list-section">
                        <h2>📦 제품 목록 ({products.length})</h2>
                        <div className="vertical-scroll-area">
                            {products.map(p => (
                                <div key={p.id} className="admin-list-card">
                                    <img src={`${IMAGE_SERVER_URL}/${p.imageFileName}`} alt="" className="list-thumb" onError={(e)=>e.target.src='https://via.placeholder.com/50'}/>
                                    <div className="list-info">
                                        {/* ⭐ 목록에서도 [용도] [카테고리] 순으로 보여줍니다 */}
                                        <h4>
                                            <span style={{color:'#00d4ff', fontSize:'0.8rem', marginRight:'5px'}}>[{p.usage}]</span>
                                            <span style={{color:'#aaa', fontSize:'0.8rem'}}>[{p.category}]</span>
                                            {p.name}
                                        </h4>
                                        <span>{p.price?.toLocaleString()} KRW</span>
                                    </div>
                                    <div className="list-btns">
                                        <button onClick={()=>startEditingProduct(p)}>수정</button>
                                        <button onClick={()=>handleDeleteProduct(p.id)} className="btn-del">삭제</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* ✨ [수정 팝업창] 이미지 및 용도 수정 기능 포함 */}
            {editingProduct && (
                <div className="edit-overlay">
                    <div className="edit-modal">
                        <h3>제품 상세 정보 수정</h3>
                        <form onSubmit={handleUpdateProduct} className="admin-form">

                            {/* ⭐ [추가] 수정 시 용도 변경 */}
                            <label style={{color:'#00d4ff'}}>용도 (USAGE)</label>
                            <select
                                className="admin-select"
                                value={editingProduct.usage}
                                onChange={(e)=>setEditingProduct({...editingProduct, usage: e.target.value})}
                                style={{ marginBottom: '15px' }}
                            >
                                <option value="GAMING">GAMING</option>
                                <option value="OFFICE">OFFICE</option>
                                <option value="WORKSTATION">WORKSTATION</option>
                            </select>

                            <label>카테고리</label>
                            <select className="admin-select" value={editingProduct.category} onChange={(e)=>setEditingProduct({...editingProduct, category: e.target.value})}>
                                <option value="KEYBOARD">KEYBOARD</option>
                                <option value="PC">PC</option>
                                <option value="MONITOR">MONITOR</option>
                                <option value="ACC">ACC</option>
                            </select>

                            <input type="text" value={editingProduct.name} onChange={(e)=>setEditingProduct({...editingProduct, name: e.target.value})} placeholder="이름" />
                            <textarea value={editingProduct.description} onChange={(e)=>setEditingProduct({...editingProduct, description: e.target.value})} placeholder="설명" />
                            <input type="number" value={editingProduct.price} onChange={(e)=>setEditingProduct({...editingProduct, price: e.target.value})} placeholder="가격" />

                            <div style={{marginTop: '15px', border: '1px dashed #444', padding: '10px', borderRadius: '6px'}}>
                                <label style={{marginBottom: '10px', display: 'block', color:'#ccc'}}>제품 이미지 변경</label>

                                {/* 미리보기 화면 */}
                                <div style={{width: '100%', height: '150px', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', borderRadius: '4px'}}>
                                    {editingProductFile ? (
                                        <img src={URL.createObjectURL(editingProductFile)} alt="New Preview" style={{height: '100%', objectFit: 'contain'}} />
                                    ) : (
                                        <img src={`${IMAGE_SERVER_URL}/${editingProduct.imageFileName}`} alt="Current" style={{height: '100%', objectFit: 'contain'}} onError={(e)=>e.target.src='https://via.placeholder.com/150?text=No+Image'}/>
                                    )}
                                </div>

                                {/* 파일 선택 버튼 */}
                                <div className="custom-file-upload">
                                    <label htmlFor="file-edit" style={{cursor:'pointer', color:'#00d4ff'}}>🔄 새 이미지 선택하기</label>
                                    <input id="file-edit" type="file" onChange={(e)=>setEditingProductFile(e.target.files[0])} />
                                    {editingProductFile && <span className="file-name" style={{color: '#00d4ff'}}> {editingProductFile.name}</span>}
                                </div>
                            </div>

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
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import './AdminPage.css';

const API_BASE_URL = 'http://localhost:8080/api';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';
const AI_SERVER_URL = 'http://localhost:5002';

// 🤖 [AI ContactItem] 문의사항 카드
const ContactItem = ({ contact, activeContactId, setActiveContactId, replyText, setReplyText, handleRegisterAnswer }) => {
    const [aiAnalysis, setAiAnalysis] = useState(null);

    useEffect(() => {
        const analyze = async () => {
            try {
                const res = await axios.post(`${AI_SERVER_URL}/analyze-contact`, {
                    title: contact.title, content: contact.content
                });
                if (res.data.status === 'success') setAiAnalysis(res.data);
            } catch (err) { console.error("AI 분석 실패:", err); }
        };
        analyze();
    }, [contact]);

    const isCritical = aiAnalysis?.priority === 'CRITICAL';

    return (
        <div className="admin-list-card"
             style={{
                 flexDirection: 'column', alignItems: 'flex-start', gap: '8px',
                 border: isCritical ? '2px solid #ff4d4d' : '1px solid #444',
                 background: isCritical ? 'rgba(255, 77, 77, 0.1)' : '#333'
             }}>
            {aiAnalysis && (
                <div style={{fontSize: '0.8rem', fontWeight: 'bold', color: isCritical ? '#ff4d4d' : '#00d4ff', marginBottom: '5px'}}>
                    {aiAnalysis.ai_memo}
                </div>
            )}
            <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                <h4 style={{color: isCritical ? '#ffaaaa' : '#00d4ff', margin:0}}>{isCritical && "🔥 "} {contact.title}</h4>
                <span style={{fontSize:'0.8rem', color:'#666'}}>{new Date(contact.createdAt).toLocaleDateString()}</span>
            </div>
            <p style={{color:'#ddd', fontSize:'0.9rem'}}>{contact.content}</p>
            {contact.answer && activeContactId !== contact.id && (
                <div style={{background:'rgba(0,212,255,0.1)', padding:'10px', width:'100%', borderRadius:'4px', marginTop:'5px'}}>
                    <p style={{color:'#ccc', margin:0}}>↳ {contact.answer}</p>
                </div>
            )}
            {activeContactId === contact.id ? (
                <div style={{width:'100%', marginTop:'5px'}}>
                    <textarea value={replyText} onChange={(e)=>setReplyText(e.target.value)} style={{width:'100%', background:'#222', color:'white'}} placeholder="답변 입력..." />
                    <button onClick={()=>handleRegisterAnswer(contact.id)} className="btn-save-small">등록</button>
                    <button onClick={()=>{setActiveContactId(null); setReplyText('');}} className="btn-cancel-small">취소</button>
                </div>
            ) : (
                <button onClick={()=>{setActiveContactId(contact.id); setReplyText(contact.answer||'');}} style={{background:'none', border:'1px solid #555', color:'#aaa', fontSize:'0.8rem', marginTop:'5px'}}>
                    {contact.answer ? '답변 수정' : '답변 달기'}
                </button>
            )}
        </div>
    );
};

function AdminPage() {
    const [products, setProducts] = useState([]);
    const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', category: 'KEYBOARD', usage: 'GAMING' });
    const [newProductFile, setNewProductFile] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingProductFile, setEditingProductFile] = useState(null);
    const [notices, setNotices] = useState([]);
    const [newNotice, setNewNotice] = useState({ title: '', content: '' });
    const [contacts, setContacts] = useState([]);
    const [activeContactId, setActiveContactId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => { fetchProducts(); fetchNotices(); fetchContacts(); }, []);

    // 🔍 제품 조회
    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/products`);
            let productList = [];
            if (Array.isArray(res.data)) productList = res.data;
            else if (res.data.data && Array.isArray(res.data.data)) productList = res.data.data;
            else if (res.data.content && Array.isArray(res.data.content)) productList = res.data.content;
            setProducts(productList);
        } catch (err) { console.error('❌ 제품 로드 실패:', err); }
    };

    const fetchNotices = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/notices`);
            if (Array.isArray(res.data)) setNotices(res.data);
            else setNotices([]);
        } catch (err) { console.error(err); }
    };

    const fetchContacts = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/contact`);
            if (Array.isArray(res.data)) setContacts(res.data);
            else setContacts([]);
        } catch (err) { console.error(err); }
    };

    const checkImageDuplicate = async (file) => {
        if (!file) return { isDuplicate: false };
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await axios.post(`${AI_SERVER_URL}/search-image`, formData);
            if (res.data.status === 'success' && res.data.is_duplicate) {
                return { isDuplicate: true, msg: res.data.duplicate_msg };
            }
            return { isDuplicate: false };
        } catch (err) { return { isDuplicate: false }; }
    };

    const handleImageChange = async (e, isEditMode = false) => {
        const file = e.target.files[0];
        if (!file) return;
        if (isEditMode) setEditingProductFile(file);
        else setNewProductFile(file);

        const currentName = isEditMode ? editingProduct.name : newProduct.name;
        const currentDesc = isEditMode ? editingProduct.description : newProduct.description;

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('name', currentName || '');
            formData.append('description', currentDesc || '');
            const res = await axios.post(`${AI_SERVER_URL}/predict-category`, formData);
            if (res.data.status === 'success') {
                const aiCategory = res.data.category;
                if (aiCategory !== 'ETC') {
                    if (isEditMode) setEditingProduct(prev => ({ ...prev, category: aiCategory }));
                    else setNewProduct(prev => ({ ...prev, category: aiCategory }));
                }
            }
        } catch (err) { console.error("AI 분석 실패:", err); }
    };

    const handleRegisterAnswer = async (id) => {
        if(!replyText.trim()) return Swal.fire({ icon:'warning', title:'내용 입력', text:'답변 내용을 입력해주세요.', background:'#333', color:'#fff' });
        try {
            await axios.put(`${API_BASE_URL}/contact/${id}/answer`, { answer: replyText });
            Swal.fire({ icon:'success', title:'답변 등록 완료', background:'#333', color:'#fff', confirmButtonColor:'#00d4ff' });
            setActiveContactId(null); setReplyText(''); fetchContacts();
        } catch (err) { Swal.fire({ icon:'error', title:'실패', background:'#333', color:'#fff' }); }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!newProductFile) return Swal.fire({ icon:'warning', title:'이미지 없음', text:'제품 이미지를 등록해주세요.', background:'#333', color:'#fff' });
        setIsLoading(true);

        try {
            const aiCheck = await checkImageDuplicate(newProductFile);
            if (aiCheck.isDuplicate) {
                setIsLoading(false);
                return Swal.fire({
                    icon: 'error', title: '🚫 등록 차단됨',
                    html: `유사 상품 감지!<br/><br/><b>사유:</b> ${aiCheck.msg}`,
                    background: '#333', color: '#fff', confirmButtonColor: '#ff4d4d'
                });
            }

            const formData = new FormData();
            formData.append("product", new Blob([JSON.stringify(newProduct)], { type: "application/json" }));
            formData.append("image", newProductFile);
            await axios.post(`${API_BASE_URL}/products`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            Swal.fire({ icon:'success', title:'제품 등록 성공!', background:'#333', color:'#fff', confirmButtonColor:'#00d4ff' });
            setNewProduct({ name: '', description: '', price: '', category: 'KEYBOARD', usage: 'GAMING' });
            setNewProductFile(null); fetchProducts();

        } catch (err) {
            console.error("❌ 등록 에러:", err);
            Swal.fire({ icon: 'error', title: '등록 실패', text: err.response ? "서버 에러" : "서버 연결 실패", background: '#333', color: '#fff' });
        } finally { setIsLoading(false); }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        if (editingProductFile) {
            const aiCheck = await checkImageDuplicate(editingProductFile);
            if (aiCheck.isDuplicate) {
                setIsUpdating(false);
                return Swal.fire({
                    icon: 'error', title: '🚫 수정 차단됨',
                    html: `유사 상품 감지!<br/><br/><b>사유:</b> ${aiCheck.msg}`,
                    background: '#333', color: '#fff', confirmButtonColor: '#ff4d4d'
                });
            }
        }
        const formData = new FormData();
        formData.append("product", new Blob([JSON.stringify(editingProduct)], { type: "application/json" }));
        if (editingProductFile) formData.append("image", editingProductFile);
        try {
            await axios.put(`${API_BASE_URL}/products/${editingProduct.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            Swal.fire({ icon:'success', title:'수정 완료!', background:'#333', color:'#fff', confirmButtonColor:'#00d4ff' });
            setEditingProduct(null); setEditingProductFile(null); fetchProducts();
        } catch (err) { Swal.fire({ icon:'error', title:'수정 실패', background:'#333', color:'#fff' }); }
        finally { setIsUpdating(false); }
    };

    const handleDeleteProduct = (id) => {
        Swal.fire({
            title: '삭제하시겠습니까?', icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#ff4d4d', cancelButtonColor: '#3085d6', confirmButtonText: '삭제', background: '#333', color: '#fff'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`${API_BASE_URL}/products/${id}`);
                    fetchProducts();
                    Swal.fire({ title: '삭제 완료', icon: 'success', background: '#333', color: '#fff', confirmButtonColor: '#00d4ff' });
                } catch (err) { Swal.fire({ title: '삭제 실패', icon: 'error', background: '#333', color: '#fff' }); }
            }
        });
    };

    const handleAddNotice = async (e) => {
        e.preventDefault();
        try { await axios.post(`${API_BASE_URL}/notices`, newNotice); Swal.fire({ icon:'success', title:'공지 등록 완료', background:'#333', color:'#fff', confirmButtonColor:'#00d4ff' }); setNewNotice({ title: '', content: '' }); fetchNotices(); }
        catch (err) { Swal.fire({ icon:'error', title:'실패', background:'#333', color:'#fff' }); }
    };

    const deleteNotice = (id) => {
        Swal.fire({
            title: '공지 삭제', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ff4d4d', confirmButtonText: '삭제', background: '#333', color: '#fff'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try { await axios.delete(`${API_BASE_URL}/notices/${id}`); fetchNotices(); Swal.fire({ icon:'success', title:'삭제 완료', background:'#333', color:'#fff', confirmButtonColor:'#00d4ff' }); }
                catch (err) { Swal.fire({ icon:'error', title:'실패', background:'#333', color:'#fff' }); }
            }
        });
    };

    const startEditingProduct = (product) => { setEditingProduct({ ...product, usage: product.usage || 'GAMING' }); setEditingProductFile(null); };

    return (
        <div className="admin-dashboard">
            <header className="admin-hero">
                <h1>ROOT STATION <span className="highlight-text">CORE CONTROL</span></h1>
                <Link to="/admin/orders" className="nav-shortcut"><span>📦 주문 공정 시스템 이동</span></Link>
            </header>

            <div className="admin-grid">
                <div className="admin-col">
                    <section className="admin-section">
                        <h2>✨ 신규 제품 등록</h2>
                        <form onSubmit={handleAddProduct} className="admin-form">
                            <div className="input-group-field">
                                <label style={{color:'#00d4ff'}}>용도 (USAGE)</label>
                                <select className="admin-select" value={newProduct.usage} onChange={(e) => setNewProduct({...newProduct, usage: e.target.value})} style={{ border: '1px solid #00d4ff' }}>
                                    <option value="GAMING">GAMING</option><option value="OFFICE">OFFICE</option><option value="WORKSTATION">WORKSTATION</option>
                                </select>
                            </div>
                            <div className="input-group-field">
                                <label>카테고리</label>
                                {/* ⭐ [수정] MOUSE 제거됨 */}
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
                                <label htmlFor="file-add">📸 제품 이미지 (AI 검수+자동태깅)</label>
                                <input id="file-add" type="file" onChange={(e) => handleImageChange(e, false)} />
                                {newProductFile && <span className="file-name">{newProductFile.name}</span>}
                            </div>
                            <button type="submit" className="btn-submit-ai" disabled={isLoading}>{isLoading ? 'AI 분석 중... 🕵️' : '등록'}</button>
                        </form>
                    </section>
                    <section className="admin-section">
                        <h2>📢 공지사항</h2>
                        <form onSubmit={handleAddNotice} className="admin-form">
                            <input type="text" placeholder="제목" value={newNotice.title} onChange={(e)=>setNewNotice({...newNotice, title: e.target.value})} required />
                            <textarea placeholder="내용" value={newNotice.content} onChange={(e)=>setNewNotice({...newNotice, content: e.target.value})} required />
                            <button type="submit" className="btn-primary">등록</button>
                        </form>
                        <div className="vertical-scroll-area" style={{marginTop:'10px', height:'200px'}}>
                            {Array.isArray(notices) && notices.map(n => (
                                <div key={n.id} className="admin-list-card" style={{justifyContent:'space-between'}}>
                                    <div><h4 style={{margin:0}}>{n.title}</h4><p style={{margin:0, fontSize:'0.8rem', color:'#888'}}>{n.content}</p></div>
                                    <button onClick={()=>deleteNotice(n.id)} className="btn-del">삭제</button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="admin-col">
                    <section className="admin-section">
                        <h2>📩 1:1 문의 ({contacts.length})</h2>
                        <div className="vertical-scroll-area">
                            {Array.isArray(contacts) && contacts.map(c => (
                                <ContactItem
                                    key={c.id} contact={c}
                                    activeContactId={activeContactId} setActiveContactId={setActiveContactId}
                                    replyText={replyText} setReplyText={setReplyText}
                                    handleRegisterAnswer={handleRegisterAnswer}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="admin-section list-section">
                        <h2>📦 제품 목록 ({products.length})</h2>
                        <div className="vertical-scroll-area">
                            {Array.isArray(products) && products.length > 0 ? (
                                products.map(p => (
                                    <div key={p.id} className="admin-list-card">
                                        <img src={`${IMAGE_SERVER_URL}/${p.imageFileName}`} alt="" className="list-thumb" onError={(e)=>e.target.src='https://via.placeholder.com/50'}/>

                                        <div className="list-info">
                                            <h4>
                                                <span style={{color:'#00d4ff', fontSize:'0.9em', marginRight:'4px'}}>[{p.usage}]</span>
                                                <span style={{color:'#999', fontSize:'0.9em', marginRight:'6px'}}>[{p.category}]</span>
                                                {p.name}
                                            </h4>
                                            <span>{p.price?.toLocaleString()} KRW</span>
                                        </div>

                                        <div className="list-btns">
                                            <button onClick={()=>startEditingProduct(p)}>수정</button>
                                            <button onClick={()=>handleDeleteProduct(p.id)} className="btn-del">삭제</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{textAlign:'center', color:'#555', padding:'20px'}}>등록된 제품이 없습니다.</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {editingProduct && (
                <div className="edit-overlay">
                    <div className="edit-modal">
                        <h3>제품 수정</h3>
                        <form onSubmit={handleUpdateProduct} className="admin-form">
                            <div className="input-group-field">
                                <label style={{color:'#00d4ff'}}>용도 (USAGE)</label>
                                <select className="admin-select" value={editingProduct.usage} onChange={(e)=>setEditingProduct({...editingProduct, usage: e.target.value})}>
                                    <option value="GAMING">GAMING</option><option value="OFFICE">OFFICE</option><option value="WORKSTATION">WORKSTATION</option>
                                </select>
                            </div>
                            <label>카테고리</label>
                            {/* ⭐ [수정] 여기서도 MOUSE 제거됨 */}
                            <select className="admin-select" value={editingProduct.category} onChange={(e)=>setEditingProduct({...editingProduct, category: e.target.value})}>
                                <option value="KEYBOARD">KEYBOARD</option>
                                <option value="PC">PC</option>
                                <option value="MONITOR">MONITOR</option>
                                <option value="ACC">ACC</option>
                            </select>
                            <input type="text" value={editingProduct.name} onChange={(e)=>setEditingProduct({...editingProduct, name: e.target.value})} />
                            <textarea value={editingProduct.description} onChange={(e)=>setEditingProduct({...editingProduct, description: e.target.value})} />
                            <input type="number" value={editingProduct.price} onChange={(e)=>setEditingProduct({...editingProduct, price: e.target.value})} />
                            <div className="custom-file-upload">
                                <label htmlFor="file-edit">🔄 새 이미지 선택 (AI 검수)</label>
                                <input id="file-edit" type="file" onChange={(e) => handleImageChange(e, true)} />
                                {editingProductFile && <span className="file-name">{editingProductFile.name}</span>}
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
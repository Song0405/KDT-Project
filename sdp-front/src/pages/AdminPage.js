import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPage.css'; // 관리자 페이지 CSS (기존 파일)

const API_BASE_URL = 'http://localhost:8080/api'; // 백엔드 서버 포트 확인

function AdminPage() {
    // --- 상태 관리 Hooks ---
    // 제품(Product) 관련 상태
    const [products, setProducts] = useState([]); // 모든 제품 목록
    const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', imageFileName: '' }); // 새 제품 입력 폼 상태
    const [editingProduct, setEditingProduct] = useState(null); // 수정 중인 제품의 상태

    // 공지사항(Notice) 관련 상태
    const [notices, setNotices] = useState([]); // 모든 공지사항 목록
    const [newNotice, setNewNotice] = useState({ title: '', content: '' }); // 새 공지사항 입력 폼 상태
    const [editingNotice, setEditingNotice] = useState(null); // 수정 중인 공지사항의 상태

    // 회사 정보(CompanyInfo) 관련 상태
    const [companyInfo, setCompanyInfo] = useState(null); // 현재 회사 정보
    const [editingCompanyInfo, setEditingCompanyInfo] = useState(null); // 수정 중인 회사 정보 상태

    // --- 데이터 로딩 (컴포넌트 마운트 시 한 번 실행) ---
    useEffect(() => {
        fetchProducts();
        fetchNotices();
        fetchCompanyInfo();
    }, []);

    // --- 제품(Product) CRUD 함수 ---
    // 제품 목록 불러오기
    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/products`);
            setProducts(response.data);
        } catch (error) {
            alert('제품 데이터를 불러오는데 실패했습니다. 백엔드 서버를 확인해주세요.');
            console.error('제품을 불러오는데 실패했습니다:', error);
        }
    };

    // 새 제품 입력 필드 변경 핸들러
    const handleNewProductChange = (e) => {
        const { name, value } = e.target;
        setNewProduct(prev => ({ ...prev, [name]: value }));
    };

    // 새 제품 추가
    const addProduct = async (e) => {
        e.preventDefault(); // 폼 기본 동작 방지
        try {
            await axios.post(`${API_BASE_URL}/products`, newProduct);
            alert('제품이 성공적으로 추가되었습니다.');
            setNewProduct({ name: '', description: '', price: '', imageFileName: '' }); // 폼 초기화
            fetchProducts(); // 제품 목록 새로고침
        } catch (error) {
            alert('제품 추가에 실패했습니다. 모든 필드를 입력했는지 확인해주세요.');
            console.error('제품 추가에 실패했습니다:', error);
        }
    };

    // 제품 수정 모드 시작
    const startEditingProduct = (product) => {
        setEditingProduct({ ...product }); // 현재 제품 정보를 수정 상태로 복사
    };

    // 수정 중인 제품 입력 필드 변경 핸들러
    const handleEditingProductChange = (e) => {
        const { name, value } = e.target;
        setEditingProduct(prev => ({ ...prev, [name]: value }));
    };

    // 제품 수정 완료
    const updateProduct = async (e) => {
        e.preventDefault(); // 폼 기본 동작 방지
        if (!editingProduct) return; // 수정 중인 제품이 없으면 종료
        try {
            await axios.put(`${API_BASE_URL}/products/${editingProduct.id}`, editingProduct);
            alert('제품이 성공적으로 수정되었습니다.');
            setEditingProduct(null); // 수정 모드 종료
            fetchProducts(); // 제품 목록 새로고침
        } catch (error) {
            alert('제품 수정에 실패했습니다.');
            console.error('제품 수정에 실패했습니다:', error);
        }
    };

    // 제품 삭제
    const deleteProduct = async (id) => {
        if (window.confirm('정말로 이 제품을 삭제하시겠습니까?')) { // 사용자 확인
            try {
                await axios.delete(`${API_BASE_URL}/products/${id}`);
                alert('제품이 성공적으로 삭제되었습니다.');
                fetchProducts(); // 제품 목록 새로고침
            } catch (error) {
                alert('제품 삭제에 실패했습니다.');
                console.error('제품 삭제에 실패했습니다:', error);
            }
        }
    };

    // --- 공지사항(Notice) CRUD 함수 ---
    // 공지사항 목록 불러오기
    const fetchNotices = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/notices`);
            setNotices(response.data);
        } catch (error) {
            alert('공지사항 데이터를 불러오는데 실패했습니다. 백엔드 서버를 확인해주세요.');
            console.error('공지사항을 불러오는데 실패했습니다:', error);
        }
    };

    // 새 공지사항 입력 필드 변경 핸들러
    const handleNewNoticeChange = (e) => {
        const { name, value } = e.target;
        setNewNotice(prev => ({ ...prev, [name]: value }));
    };

    // 새 공지사항 추가
    const addNotice = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/notices`, newNotice);
            alert('공지사항이 성공적으로 추가되었습니다.');
            setNewNotice({ title: '', content: '' });
            fetchNotices();
        } catch (error) {
            alert('공지사항 추가에 실패했습니다. 모든 필드를 입력했는지 확인해주세요.');
            console.error('공지사항 추가에 실패했습니다:', error);
        }
    };

    // 공지사항 수정 모드 시작
    const startEditingNotice = (notice) => {
        setEditingNotice({ ...notice });
    };

    // 수정 중인 공지사항 입력 필드 변경 핸들러
    const handleEditingNoticeChange = (e) => {
        const { name, value } = e.target;
        setEditingNotice(prev => ({ ...prev, [name]: value }));
    };

    // 공지사항 수정 완료
    const updateNotice = async (e) => {
        e.preventDefault();
        if (!editingNotice) return;
        try {
            await axios.put(`${API_BASE_URL}/notices/${editingNotice.id}`, editingNotice);
            alert('공지사항이 성공적으로 수정되었습니다.');
            setEditingNotice(null);
            fetchNotices();
        } catch (error) {
            alert('공지사항 수정에 실패했습니다.');
            console.error('공지사항 수정에 실패했습니다:', error);
        }
    };

    // 공지사항 삭제
    const deleteNotice = async (id) => {
        if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
            try {
                await axios.delete(`${API_BASE_URL}/notices/${id}`);
                alert('공지사항이 성공적으로 삭제되었습니다.');
                fetchNotices();
            } catch (error) {
                alert('공지사항 삭제에 실패했습니다.');
                console.error('공지사항 삭제에 실패했습니다:', error);
            }
        }
    };

    // --- 회사 정보(Company Info) CRUD 함수 ---
    // 회사 정보 불러오기
    const fetchCompanyInfo = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/company-info`);
            setCompanyInfo(response.data);
        } catch (error) {
            alert('회사 정보를 불러오는데 실패했습니다. 백엔드 서버를 확인해주세요.');
            console.error('회사 정보를 불러오는데 실패했습니다:', error);
        }
    };

    // 회사 정보 수정 모드 시작
    const startEditingCompanyInfo = () => {
        setEditingCompanyInfo({ ...companyInfo });
    };

    // 수정 중인 회사 정보 입력 필드 변경 핸들러
    const handleEditingCompanyInfoChange = (e) => {
        const { name, value } = e.target;
        setEditingCompanyInfo(prev => ({ ...prev, [name]: value }));
    };

    // 회사 정보 수정 완료
    const updateCompanyInfo = async (e) => {
        e.preventDefault();
        if (!editingCompanyInfo) return;
        try {
            const response = await axios.put(`${API_BASE_URL}/company-info`, editingCompanyInfo);
            alert('회사 정보가 성공적으로 수정되었습니다.');
            setCompanyInfo(response.data); // 최신 정보로 업데이트
            setEditingCompanyInfo(null); // 수정 모드 종료
        } catch (error) {
            alert('회사 정보 수정에 실패했습니다.');
            console.error('회사 정보 수정에 실패했습니다:', error);
        }
    };

    // --- JSX 렌더링 ---
    return (
        <div className="admin-page-container">
            <h1>관리자 페이지</h1>

            {/* 회사 정보 관리 섹션 */}
            <section className="admin-section company-info-section">
                <h2>회사 정보 관리</h2>
                {companyInfo ? ( // 회사 정보가 로드되면 표시
                    editingCompanyInfo ? ( // 수정 모드일 때
                        <form onSubmit={updateCompanyInfo} className="admin-form edit-form">
                            <h3>회사 정보 수정</h3>
                            <input type="text" name="name" value={editingCompanyInfo.name || ''} onChange={handleEditingCompanyInfoChange} placeholder="회사 이름" required />
                            <textarea name="description" value={editingCompanyInfo.description || ''} onChange={handleEditingCompanyInfoChange} placeholder="회사 설명" required />
                            <input type="text" name="address" value={editingCompanyInfo.address || ''} onChange={handleEditingCompanyInfoChange} placeholder="주소" required />
                            <input type="text" name="phone" value={editingCompanyInfo.phone || ''} onChange={handleEditingCompanyInfoChange} placeholder="전화번호" required />
                            <input type="email" name="email" value={editingCompanyInfo.email || ''} onChange={handleEditingCompanyInfoChange} placeholder="이메일" required />
                            <div className="form-actions">
                                <button type="submit">저장</button>
                                <button type="button" onClick={() => setEditingCompanyInfo(null)}>취소</button>
                            </div>
                        </form>
                    ) : ( // 일반 표시 모드일 때
                        <div className="item-display">
                            <div className="item-info">
                                <h3>{companyInfo.name}</h3>
                                <p><strong>설명:</strong> {companyInfo.description}</p>
                                <p><strong>주소:</strong> {companyInfo.address}</p>
                                <p><strong>전화:</strong> {companyInfo.phone}</p>
                                <p><strong>이메일:</strong> {companyInfo.email}</p>
                            </div>
                            <div className="item-actions">
                                <button onClick={startEditingCompanyInfo}>수정</button>
                            </div>
                        </div>
                    )
                ) : <p>회사 정보를 불러오는 중...</p>}
            </section>

            {/* 제품 관리 섹션 */}
            <section className="admin-section product-section">
                <h2>제품 관리</h2>
                <form onSubmit={addProduct} className="admin-form">
                    <h3>새 제품 추가</h3>
                    <input type="text" name="name" value={newProduct.name} onChange={handleNewProductChange} placeholder="제품 이름" required />
                    <textarea name="description" value={newProduct.description} onChange={handleNewProductChange} placeholder="제품 설명" required />
                    <input type="number" name="price" value={newProduct.price} onChange={handleNewProductChange} placeholder="가격" required />
                    <input type="text" name="imageFileName" value={newProduct.imageFileName} onChange={handleNewProductChange} placeholder="이미지 파일 이름 (예: product1.jpg)" />
                    <button type="submit">제품 추가</button>
                </form>

                <div className="admin-list-container">
                    <h3>제품 목록</h3>
                    {products.length > 0 ? (
                        <ul className="admin-list">
                            {products.map(product => (
                                <li key={product.id} className="admin-list-item">
                                    {editingProduct && editingProduct.id === product.id ? ( // 수정 모드일 때
                                        <form onSubmit={updateProduct} className="edit-form">
                                            <input type="text" name="name" value={editingProduct.name} onChange={handleEditingProductChange} required />
                                            <textarea name="description" value={editingProduct.description} onChange={handleEditingProductChange} required />
                                            <input type="number" name="price" value={editingProduct.price} onChange={handleEditingProductChange} required />
                                            <input type="text" name="imageFileName" value={editingProduct.imageFileName} onChange={handleEditingProductChange} placeholder="이미지 파일 이름 (예: product1.jpg)" />
                                            <div className="form-actions">
                                                <button type="submit">저장</button>
                                                <button type="button" onClick={() => setEditingProduct(null)}>취소</button>
                                            </div>
                                        </form>
                                    ) : ( // 일반 표시 모드일 때
                                        <div className="item-display">
                                            <div className="item-info">
                                                <h4>{product.name} ({product.price?.toLocaleString()}원)</h4>
                                                <p>{product.description}</p>
                                                {product.imageFileName && <p>이미지: {product.imageFileName}</p>}
                                            </div>
                                            <div className="item-actions">
                                                <button onClick={() => startEditingProduct(product)}>수정</button>
                                                <button onClick={() => deleteProduct(product.id)} className="delete-button">삭제</button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : <p>등록된 제품이 없습니다.</p>}
                </div>
            </section>

            {/* 공지사항 관리 섹션 */}
            <section className="admin-section notice-section">
                <h2>공지사항 관리</h2>
                <form onSubmit={addNotice} className="admin-form">
                    <h3>새 공지사항 추가</h3>
                    <input type="text" name="title" value={newNotice.title} onChange={handleNewNoticeChange} placeholder="제목" required />
                    <textarea name="content" value={newNotice.content} onChange={handleNewNoticeChange} placeholder="내용" required />
                    <button type="submit">공지사항 추가</button>
                </form>

                <div className="admin-list-container">
                    <h3>공지사항 목록</h3>
                    {notices.length > 0 ? (
                        <ul className="admin-list">
                            {notices.map(notice => (
                                <li key={notice.id} className="admin-list-item">
                                    {editingNotice && editingNotice.id === notice.id ? ( // 수정 모드일 때
                                        <form onSubmit={updateNotice} className="edit-form">
                                            <input type="text" name="title" value={editingNotice.title} onChange={handleEditingNoticeChange} required />
                                            <textarea name="content" value={editingNotice.content} onChange={handleEditingNoticeChange} required />
                                            <div className="form-actions">
                                                <button type="submit">저장</button>
                                                <button type="button" onClick={() => setEditingNotice(null)}>취소</button>
                                            </div>
                                        </form>
                                    ) : ( // 일반 표시 모드일 때
                                        <div className="item-display">
                                            <div className="item-info">
                                                <h4>{notice.title}</h4>
                                                <p>{notice.content}</p>
                                            </div>
                                            <div className="item-actions">
                                                <button onClick={() => startEditingNotice(notice)}>수정</button>
                                                <button onClick={() => deleteNotice(notice.id)} className="delete-button">삭제</button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : <p>등록된 공지사항이 없습니다.</p>}
                </div>
            </section>
        </div>
    );
}

export default AdminPage;
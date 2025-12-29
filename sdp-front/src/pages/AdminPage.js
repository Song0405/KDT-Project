import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPage.css'; // 관리자 페이지 CSS (기존 파일)

const API_BASE_URL = 'http://localhost:8080/api'; // 백엔드 서버 포트 확인
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads'; // 업로드된 이미지 경로

function AdminPage() {
    // --- 상태 관리 Hooks ---
    // 제품(Product) 관련 상태
    const [products, setProducts] = useState([]); // 모든 제품 목록
    // imageFileName 필드 대신 실제 파일 객체를 관리할 상태를 추가합니다.
    const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '' });
    const [newProductFile, setNewProductFile] = useState(null); // 새 제품 이미지 파일

    const [editingProduct, setEditingProduct] = useState(null); // 수정 중인 제품 상태
    const [editingProductFile, setEditingProductFile] = useState(null); // 수정 중인 제품 이미지 파일

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

    // 새 제품 파일 선택 핸들러
    const handleNewProductFileChange = (e) => {
        setNewProductFile(e.target.files[0]); // 선택한 첫 번째 파일을 상태에 저장
    };

    // 새 제품 추가 (FormData 방식)
    const addProduct = async (e) => {
        e.preventDefault();

        // 이미지 파일을 포함하여 전송하기 위해 FormData를 사용합니다.
        const formData = new FormData();

        // 백엔드 @RequestPart("product")와 매칭하기 위해 Blob으로 감싸서 전달
        formData.append("product", new Blob([JSON.stringify(newProduct)], {
            type: "application/json"
        }));

        // 백엔드 @RequestPart("image")와 매칭
        if (newProductFile) {
            formData.append("image", newProductFile);
        }

        try {
            await axios.post(`${API_BASE_URL}/products`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('제품이 성공적으로 추가되었습니다.');
            setNewProduct({ name: '', description: '', price: '' }); // 폼 초기화
            setNewProductFile(null); // 파일 상태 초기화
            fetchProducts(); // 목록 새로고침
        } catch (error) {
            alert('제품 추가에 실패했습니다. 파일을 선택했는지 확인해주세요.');
            console.error('제품 추가 실패:', error);
        }
    };

    // 제품 수정 모드 시작
    const startEditingProduct = (product) => {
        setEditingProduct({ ...product });
        setEditingProductFile(null); // 수정 모드 진입 시 파일 선택 상태 초기화
    };

    // 수정 중인 제품 입력 필드 변경 핸들러
    const handleEditingProductChange = (e) => {
        const { name, value } = e.target;
        setEditingProduct(prev => ({ ...prev, [name]: value }));
    };

    // 수정 중인 제품 파일 선택 핸들러
    const handleEditingProductFileChange = (e) => {
        setEditingProductFile(e.target.files[0]);
    };

    // 제품 수정 완료 (FormData 방식)
    const updateProduct = async (e) => {
        e.preventDefault();
        if (!editingProduct) return;

        const formData = new FormData();
        formData.append("product", new Blob([JSON.stringify(editingProduct)], {
            type: "application/json"
        }));

        if (editingProductFile) {
            formData.append("image", editingProductFile);
        }

        try {
            await axios.put(`${API_BASE_URL}/products/${editingProduct.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('제품이 성공적으로 수정되었습니다.');
            setEditingProduct(null);
            setEditingProductFile(null);
            fetchProducts();
        } catch (error) {
            alert('제품 수정에 실패했습니다.');
            console.error('제품 수정 실패:', error);
        }
    };

    // 제품 삭제
    const deleteProduct = async (id) => {
        if (window.confirm('정말로 이 제품을 삭제하시겠습니까?')) {
            try {
                await axios.delete(`${API_BASE_URL}/products/${id}`);
                alert('제품이 성공적으로 삭제되었습니다.');
                fetchProducts();
            } catch (error) {
                alert('제품 삭제에 실패했습니다.');
                console.error('제품 삭제 실패:', error);
            }
        }
    };

    // --- 공지사항(Notice) CRUD 함수 ---
    const fetchNotices = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/notices`);
            setNotices(response.data);
        } catch (error) {
            console.error('공지사항 불러오기 실패:', error);
        }
    };

    const handleNewNoticeChange = (e) => {
        const { name, value } = e.target;
        setNewNotice(prev => ({ ...prev, [name]: value }));
    };

    const addNotice = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/notices`, newNotice);
            alert('공지사항이 추가되었습니다.');
            setNewNotice({ title: '', content: '' });
            fetchNotices();
        } catch (error) {
            console.error('공지사항 추가 실패:', error);
        }
    };

    const startEditingNotice = (notice) => {
        setEditingNotice({ ...notice });
    };

    const handleEditingNoticeChange = (e) => {
        const { name, value } = e.target;
        setEditingNotice(prev => ({ ...prev, [name]: value }));
    };

    const updateNotice = async (e) => {
        e.preventDefault();
        if (!editingNotice) return;
        try {
            await axios.put(`${API_BASE_URL}/notices/${editingNotice.id}`, editingNotice);
            alert('공지사항이 수정되었습니다.');
            setEditingNotice(null);
            fetchNotices();
        } catch (error) {
            console.error('공지사항 수정 실패:', error);
        }
    };

    const deleteNotice = async (id) => {
        if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
            try {
                await axios.delete(`${API_BASE_URL}/notices/${id}`);
                fetchNotices();
            } catch (error) {
                console.error('공지사항 삭제 실패:', error);
            }
        }
    };

    // --- 회사 정보(Company Info) CRUD 함수 ---
    const fetchCompanyInfo = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/company-info`);
            setCompanyInfo(response.data);
        } catch (error) {
            console.error('회사 정보 불러오기 실패:', error);
        }
    };

    const startEditingCompanyInfo = () => {
        setEditingCompanyInfo({ ...companyInfo });
    };

    const handleEditingCompanyInfoChange = (e) => {
        const { name, value } = e.target;
        setEditingCompanyInfo(prev => ({ ...prev, [name]: value }));
    };

    const updateCompanyInfo = async (e) => {
        e.preventDefault();
        if (!editingCompanyInfo) return;
        try {
            const response = await axios.put(`${API_BASE_URL}/company-info`, editingCompanyInfo);
            alert('회사 정보가 수정되었습니다.');
            setCompanyInfo(response.data);
            setEditingCompanyInfo(null);
        } catch (error) {
            console.error('회사 정보 수정 실패:', error);
        }
    };

    // --- JSX 렌더링 ---
    return (
        <div className="admin-page-container">
            <h1>관리자 페이지</h1>

            {/* 회사 정보 관리 섹션 */}
            <section className="admin-section company-info-section">
                <h2>회사 정보 관리</h2>
                {companyInfo ? (
                    editingCompanyInfo ? (
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
                    ) : (
                        <div className="item-display">
                            <div className="item-info">
                                <h3>{companyInfo.name}</h3>
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

                    {/* 텍스트 입력창 대신 파일 업로드 인풋 추가 */}
                    <div className="file-input-group" style={{ margin: '10px 0', textAlign: 'left' }}>
                        <label style={{ color: '#ff7a3c', display: 'block', marginBottom: '5px' }}>제품 이미지 업로드:</label>
                        <input type="file" accept="image/*" onChange={handleNewProductFileChange} required />
                    </div>

                    <button type="submit">제품 추가</button>
                </form>

                <div className="admin-list-container">
                    <h3>제품 목록</h3>
                    {products.length > 0 ? (
                        <ul className="admin-list">
                            {products.map(product => (
                                <li key={product.id} className="admin-list-item">
                                    {editingProduct && editingProduct.id === product.id ? (
                                        <form onSubmit={updateProduct} className="edit-form">
                                            <input type="text" name="name" value={editingProduct.name} onChange={handleEditingProductChange} required />
                                            <textarea name="description" value={editingProduct.description} onChange={handleEditingProductChange} required />
                                            <input type="number" name="price" value={editingProduct.price} onChange={handleEditingProductChange} required />

                                            {/* 수정 시에도 이미지 변경이 가능하도록 파일 인풋 추가 */}
                                            <div className="file-input-group" style={{ margin: '10px 0', textAlign: 'left' }}>
                                                <label style={{ color: '#ff7a3c' }}>이미지 변경(선택):</label>
                                                <input type="file" accept="image/*" onChange={handleEditingProductFileChange} />
                                            </div>

                                            <div className="form-actions">
                                                <button type="submit">저장</button>
                                                <button type="button" onClick={() => setEditingProduct(null)}>취소</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="item-display">
                                            <div className="item-info" style={{ display: 'flex', alignItems: 'center' }}>
                                                {/* 서버의 이미지 경로를 사용하여 이미지 표시 */}
                                                <img
                                                    src={`${IMAGE_SERVER_URL}/${product.imageFileName}`}
                                                    alt={product.name}
                                                    style={{ width: '60px', height: '60px', borderRadius: '5px', marginRight: '15px', objectFit: 'cover' }}
                                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/60'; }} // 이미지 없을 시 대체
                                                />
                                                <div>
                                                    <h4>{product.name} ({product.price?.toLocaleString()}원)</h4>
                                                    <p style={{ fontSize: '0.9em', color: '#ccc' }}>{product.description}</p>
                                                </div>
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
                                    {editingNotice && editingNotice.id === notice.id ? (
                                        <form onSubmit={updateNotice} className="edit-form">
                                            <input type="text" name="title" value={editingNotice.title} onChange={handleEditingNoticeChange} required />
                                            <textarea name="content" value={editingNotice.content} onChange={handleEditingNoticeChange} required />
                                            <div className="form-actions">
                                                <button type="submit">저장</button>
                                                <button type="button" onClick={() => setEditingNotice(null)}>취소</button>
                                            </div>
                                        </form>
                                    ) : (
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
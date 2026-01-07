import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Product.css'; // 위에서 만든 CSS 불러오기

const API_BASE_URL = 'http://localhost:8080/api/products';
const IMAGE_SERVER_URL = 'http://localhost:8080/uploads';

function ProductListPage() {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await axios.get(API_BASE_URL);
            setProducts(response.data);
        } catch (err) {
            console.error(err);
            setError("상품 목록을 불러올 수 없습니다.");
        }
    };

    return (
        <div className="product-page-container">
            <h1>📦 제품 목록 (Products)</h1>

            {error && <div className="error-message">{error}</div>}

            <div className="product-grid-container">
                {products.length > 0 ? (
                    products.map(product => (
                        <div
                            key={product.id}
                            className="product-item-card"
                            onClick={() => navigate(`/products/${product.id}`)} // 클릭 시 상세 페이지 이동
                        >
                            <div className="product-img-box">
                                <img
                                    src={product.imageFileName
                                        ? (product.imageFileName.startsWith('http') ? product.imageFileName : `${IMAGE_SERVER_URL}/${product.imageFileName}`)
                                        : 'https://via.placeholder.com/300?text=No+Image'}
                                    alt={product.name}
                                    className="product-img"
                                />
                            </div>
                            <div className="product-info-box">
                                <div className="product-name">{product.name}</div>
                                <div className="product-price">{product.price?.toLocaleString()}원</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={{textAlign: 'center', gridColumn: '1/-1'}}>등록된 상품이 없습니다.</p>
                )}
            </div>
        </div>
    );
}

export default ProductListPage;
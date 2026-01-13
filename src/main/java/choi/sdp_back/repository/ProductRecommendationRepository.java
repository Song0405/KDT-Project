package choi.sdp_back.repository;

import choi.sdp_back.entity.Product;
import choi.sdp_back.entity.ProductRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRecommendationRepository extends JpaRepository<ProductRecommendation, Long> {

    // 특정 상품(productId)에 달린 추천 멘트들을 몽땅 가져오는 메서드
    // SQL: SELECT * FROM product_recommendation WHERE product_id = ?
    List<ProductRecommendation> findByProductId(Long productId);
    void deleteByProductId(Long productId);

}
package choi.sdp_back.repository;

import choi.sdp_back.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    // 특정 상품의 리뷰를 최신순
    List<Review> findByProductIdOrderByCreatedDateDesc(Long productId);
}
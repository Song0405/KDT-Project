package choi.sdp_back.controller;

import choi.sdp_back.entity.Product;
import choi.sdp_back.entity.Review;
import choi.sdp_back.repository.ProductRepository;
import choi.sdp_back.repository.ReviewRepository;
import choi.sdp_back.repository.ShopOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final ShopOrderRepository shopOrderRepository; // ⭐ 검사용 추가
    private final ProductRepository productRepository;     // ⭐ 상품명 확인용 추가

    // 1. 리뷰 목록 조회 (특정 상품)
    @GetMapping("/{productId}")
    public List<Review> getReviews(@PathVariable Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedDateDesc(productId);
    }

    // 2. 리뷰 작성 (구매 인증 로직 추가)
    @PostMapping
    public String createReview(@RequestBody Map<String, Object> data) {
        Long productId = Long.valueOf(data.get("productId").toString());
        String memberId = (String) data.get("memberId"); // ⭐ 프론트에서 ID도 받아와야 함
        String writer = (String) data.get("writer");
        String content = (String) data.get("content");
        int rating = Integer.parseInt(data.get("rating").toString());

        // 🛑 [검문소] 1. 진짜 상품이 맞는지 확인
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품 없음"));

        // 🛑 [검문소] 2. 구매 내역 확인 (핵심!)
        // "이 멤버ID가 이 상품명을 주문한 적이 있니?"
        boolean hasPurchased = shopOrderRepository.existsByMemberIdAndProductName(memberId, product.getName());

        if (!hasPurchased) {
            return "NOT_PURCHASED"; // 🚨 구매 안 했으면 여기서 컷!
        }

        // 통과하면 저장
        Review review = Review.builder()
                .productId(productId)
                .writer(writer)
                .content(content)
                .rating(rating)
                .build();

        reviewRepository.save(review);
        return "SUCCESS";
    }

    // 3. 리뷰 삭제 (Delete)
    @DeleteMapping("/{id}")
    public void deleteReview(@PathVariable Long id) {
        reviewRepository.deleteById(id);
    }
}
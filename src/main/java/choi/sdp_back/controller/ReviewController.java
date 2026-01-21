package choi.sdp_back.controller;

import choi.sdp_back.entity.Review;
import choi.sdp_back.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;

    // 1. 리뷰 목록 조회 (특정 상품)
    @GetMapping("/{productId}")
    public List<Review> getReviews(@PathVariable Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedDateDesc(productId);
    }

    // 2. 리뷰 작성 (Create)
    @PostMapping
    public String createReview(@RequestBody Map<String, Object> data) {
        Review review = Review.builder()
                .productId(Long.valueOf(data.get("productId").toString()))
                .writer((String) data.get("writer"))
                .content((String) data.get("content"))
                .rating(Integer.parseInt(data.get("rating").toString()))
                .build();

        reviewRepository.save(review);
        return "리뷰 작성 완료";
    }

    // 3. 리뷰 삭제 (Delete)
    @DeleteMapping("/{id}")
    public void deleteReview(@PathVariable Long id) {
        reviewRepository.deleteById(id);
    }
}
package choi.sdp_back.controller;

import choi.sdp_back.entity.Product;
import choi.sdp_back.entity.Review;
import choi.sdp_back.repository.ProductRepository;
import choi.sdp_back.repository.ReviewRepository;
import choi.sdp_back.repository.ShopOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final ShopOrderRepository shopOrderRepository;
    private final ProductRepository productRepository;

    // 🐍 파이썬 AI 서버 주소
    private final String AI_URL = "http://localhost:5002/analyze-review";
    private final RestTemplate restTemplate = new RestTemplate();

    // 🤖 [NEW] 챗봇용: 상품명으로 리뷰 요약 조회
    @GetMapping("/summary-by-name")
    public Map<String, Object> getReviewSummaryByName(@RequestParam String productName) {
        // 1. 이름으로 상품 찾기 (Optional 처리)
        Product product = productRepository.findByName(productName).orElse(null);

        if (product == null) {
            return Map.of("status", "NOT_FOUND");
        }

        // 2. 기존 통계 로직 재사용
        return getReviewSummary(product.getId());
    }

    // 1. 리뷰 목록 조회 (특정 상품)
    @GetMapping("/{productId}")
    public List<Review> getReviews(@PathVariable Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedDateDesc(productId);
    }

    // 2. 리뷰 작성
    @PostMapping
    public String createReview(@RequestBody Map<String, Object> data) {
        try {
            Long productId = Long.valueOf(data.get("productId").toString());
            String memberId = (String) data.get("memberId");
            String writer = (String) data.get("writer");
            String content = (String) data.get("content");
            int rating = Integer.parseInt(data.get("rating").toString());

            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));

            boolean hasPurchased = shopOrderRepository.existsByMemberIdAndProductName(memberId, product.getName());
            if (!hasPurchased) return "NOT_PURCHASED";

            String sentiment = "NEUTRAL";
            String aiTags = "";

            try {
                Map<String, String> aiRequest = new HashMap<>();
                aiRequest.put("content", content);
                Map<String, Object> aiResponse = restTemplate.postForObject(AI_URL, aiRequest, Map.class);

                if (aiResponse != null && "success".equals(aiResponse.get("status"))) {
                    sentiment = (String) aiResponse.get("sentiment");
                    aiTags = (String) aiResponse.get("tags");
                    System.out.println("✅ AI 분석 완료: " + sentiment + " / " + aiTags);
                }
            } catch (Exception e) {
                System.out.println("⚠ AI 서버 연결 실패: " + e.getMessage());
            }

            Review review = Review.builder()
                    .productId(productId)
                    .writer(writer)
                    .content(content)
                    .rating(rating)
                    .sentiment(sentiment)
                    .aiTags(aiTags)
                    .build();

            reviewRepository.save(review);
            return "SUCCESS";

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    // 3. 리뷰 태그 통계 조회
    @GetMapping("/{productId}/summary")
    public Map<String, Object> getReviewSummary(@PathVariable Long productId) {
        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedDateDesc(productId);

        Map<String, Integer> tagCountMap = new HashMap<>();
        for (Review review : reviews) {
            String tags = review.getAiTags();
            if (tags != null && !tags.isEmpty()) {
                String[] splitTags = tags.split(" ");
                for (String tag : splitTags) {
                    String cleanTag = tag.replace("#", "").trim();
                    if (!cleanTag.isEmpty()) {
                        tagCountMap.put(cleanTag, tagCountMap.getOrDefault(cleanTag, 0) + 1);
                    }
                }
            }
        }

        List<Map.Entry<String, Integer>> sortedTags = new ArrayList<>(tagCountMap.entrySet());
        sortedTags.sort((a, b) -> b.getValue().compareTo(a.getValue()));

        List<Map<String, Object>> topTags = new ArrayList<>();
        int limit = Math.min(sortedTags.size(), 5);
        for (int i = 0; i < limit; i++) {
            Map.Entry<String, Integer> entry = sortedTags.get(i);
            Map<String, Object> tagInfo = new HashMap<>();
            tagInfo.put("tag", entry.getKey());
            tagInfo.put("count", entry.getValue());
            topTags.add(tagInfo);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalReviews", reviews.size());
        result.put("topTags", topTags);

        return result;
    }

    // 4. 리뷰 삭제
    @DeleteMapping("/{id}")
    public void deleteReview(@PathVariable Long id) {
        reviewRepository.deleteById(id);
    }
}
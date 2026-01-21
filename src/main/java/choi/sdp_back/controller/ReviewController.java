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
    private final ShopOrderRepository shopOrderRepository; // 구매 내역 확인용
    private final ProductRepository productRepository;     // 상품 정보 확인용

    // 🐍 파이썬 AI 서버 주소
    private final String AI_URL = "http://localhost:5002/analyze-review";
    private final RestTemplate restTemplate = new RestTemplate();

    // 1. 리뷰 목록 조회 (특정 상품)
    @GetMapping("/{productId}")
    public List<Review> getReviews(@PathVariable Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedDateDesc(productId);
    }

    // 2. 리뷰 작성 (구매 인증 + AI 분석 로직 통합)
    @PostMapping
    public String createReview(@RequestBody Map<String, Object> data) {
        try {
            Long productId = Long.valueOf(data.get("productId").toString());
            String memberId = (String) data.get("memberId");
            String writer = (String) data.get("writer");
            String content = (String) data.get("content");
            int rating = Integer.parseInt(data.get("rating").toString());

            // 🛑 [Step 1] 상품 존재 여부 확인
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));

            // 🛑 [Step 2] 구매 내역 검증 (Gatekeeper)
            // "이 멤버가 이 상품을 산 적이 있는가?"
            boolean hasPurchased = shopOrderRepository.existsByMemberIdAndProductName(memberId, product.getName());

            if (!hasPurchased) {
                return "NOT_PURCHASED"; // 구매하지 않았으면 여기서 차단 🚫
            }

            // 🤖 [Step 3] AI 분석 요청 (Brain)
            String sentiment = "NEUTRAL";
            String aiTags = "";

            try {
                // 파이썬 서버로 리뷰 내용 전송
                Map<String, String> aiRequest = new HashMap<>();
                aiRequest.put("content", content);

                // 결과 수신
                Map<String, Object> aiResponse = restTemplate.postForObject(AI_URL, aiRequest, Map.class);

                if (aiResponse != null && "success".equals(aiResponse.get("status"))) {
                    sentiment = (String) aiResponse.get("sentiment");
                    aiTags = (String) aiResponse.get("tags");
                    System.out.println("✅ AI 분석 완료: " + sentiment + " / " + aiTags);
                }
            } catch (Exception e) {
                System.out.println("⚠ AI 서버 연결 실패 (분석 없이 기본값으로 저장): " + e.getMessage());
                // AI 서버가 죽어도 리뷰 저장은 되어야 하므로 예외를 삼킵니다.
            }

            // ✅ [Step 4] 최종 저장 (DB)
            Review review = Review.builder()
                    .productId(productId)
                    .writer(writer)
                    .content(content)
                    .rating(rating)
                    .sentiment(sentiment) // AI 분석 결과
                    .aiTags(aiTags)       // AI 분석 결과
                    .build();

            reviewRepository.save(review);
            return "SUCCESS";

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }
    // 4. [NEW] 리뷰 태그 통계 조회 (상세 페이지 상단용)
    @GetMapping("/{productId}/summary")
    public Map<String, Object> getReviewSummary(@PathVariable Long productId) {
        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedDateDesc(productId);

        // 태그 개수 세기 (빈도수 계산)
        Map<String, Integer> tagCountMap = new HashMap<>();

        for (Review review : reviews) {
            String tags = review.getAiTags(); // 예: "#배송빠름 #가성비굿"
            if (tags != null && !tags.isEmpty()) {
                // 1. 공백으로 분리하고
                String[] splitTags = tags.split(" ");
                for (String tag : splitTags) {
                    // 2. # 기호 제거하고 카운팅
                    String cleanTag = tag.replace("#", "").trim();
                    if (!cleanTag.isEmpty()) {
                        tagCountMap.put(cleanTag, tagCountMap.getOrDefault(cleanTag, 0) + 1);
                    }
                }
            }
        }

        // 3. 많이 나온 순서대로 정렬 (내림차순)
        List<Map.Entry<String, Integer>> sortedTags = new ArrayList<>(tagCountMap.entrySet());
        sortedTags.sort((a, b) -> b.getValue().compareTo(a.getValue()));

        // 4. 상위 5개만 뽑기 (너무 많으면 지저분하니까)
        List<Map<String, Object>> topTags = new ArrayList<>();
        int limit = Math.min(sortedTags.size(), 5);

        for (int i = 0; i < limit; i++) {
            Map.Entry<String, Integer> entry = sortedTags.get(i);
            Map<String, Object> tagInfo = new HashMap<>();
            tagInfo.put("tag", entry.getKey());
            tagInfo.put("count", entry.getValue());
            topTags.add(tagInfo);
        }

        // 결과 반환
        Map<String, Object> result = new HashMap<>();
        result.put("totalReviews", reviews.size());
        result.put("topTags", topTags); // 예: [{"tag": "배송빠름", "count": 12}, ...]

        return result;
    }

    // 3. 리뷰 삭제
    @DeleteMapping("/{id}")
    public void deleteReview(@PathVariable Long id) {
        reviewRepository.deleteById(id);
    }
}
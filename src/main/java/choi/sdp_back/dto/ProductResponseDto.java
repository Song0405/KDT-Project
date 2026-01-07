package choi.sdp_back.dto;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder // ★ 중요: 이 줄이 있어야 .builder()를 쓸 수 있습니다.
public class ProductResponseDto {
    private Long id;
    private String name;
    private int price;
    private String description;
    private String imageUrl;

    // AI 추천 정보 리스트
    private List<AiRecommendation> recommendations;

    // 내부 클래스 정의
    @Getter
    @Builder // ★ 중요: 내부 클래스에도 이게 있어야 함
    public static class AiRecommendation {
        private String reason;
        private String targetProductName;
    }
}
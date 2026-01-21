package choi.sdp_back.dto;

import choi.sdp_back.entity.Product;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponseDto {

    // --- 1. 기본 제품 정보 ---
    private Long id;
    private String name;
    private int price;
    private String description;

    // ✨ [추가] 이미지와 카테고리 기능에 필수!
    private String category;
    private String imageFileName;

    // ✨ [추가] 용도 필드
    private String usage;

    // --- 2. AI 추천 정보 (기존 코드 유지) ---
    private String imageUrl; // (필요하다면 유지)
    private List<AiRecommendation> recommendations;

    // ✨ [핵심] 서비스(ProductService)에서 Entity -> DTO로 변환할 때 사용하는 메서드
    public static ProductResponseDto from(Product product) {
        return ProductResponseDto.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .category(product.getCategory())          // ✨ 카테고리 추가
                .imageFileName(product.getImageFileName()) // ✨ 이미지 파일명 추가
                .build();
    }

    // --- 3. 내부 클래스 (AI 추천용, 그대로 유지) ---
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiRecommendation {
        private String reason;
        private String targetProductName;
        private Long targetProductId;
    }
}
package choi.sdp_back.dto;

import choi.sdp_back.entity.Product;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor  // 1. 기본 생성자 추가
@AllArgsConstructor // 2. 모든 필드 생성자 추가 (Builder 쓰려면 필수!)
@Builder            // 3. ⭐ 이거 추가!! (빌더 패턴 활성화)
public class ProductDto {

    private Long id;
    private String name;
    private String description;
    private Integer price;
    private String category;
    private String imageFileName;
    private String usageType;

    // (기존에 from 메서드가 있었다면 그대로 두셔도 됩니다)
    public static ProductDto from(Product product) {
        return ProductDto.builder()
                .id(product.getId())
                .name(product.getName())
                .price(product.getPrice())
                .description(product.getDescription())
                .category(product.getCategory())
                .imageFileName(product.getImageFileName())
                .usageType(product.getUsageType())
                .build();
    }
}
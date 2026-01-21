package choi.sdp_back.dto;

import choi.sdp_back.entity.Product;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductDto {

    private Long id;
    private String name;
    private String description;
    private Integer price;
    private String category;
    private String imageFileName;

    private String usage;

    public static ProductDto from(Product product) {
        return ProductDto.builder()
                .id(product.getId())
                .name(product.getName())
                .price(product.getPrice())
                .description(product.getDescription())
                .category(product.getCategory())
                .imageFileName(product.getImageFileName())
                .usage(product.getUsage()) // ⭐ 여기서 DB 값을 꺼내 담습니다.
                .build();
    }
}
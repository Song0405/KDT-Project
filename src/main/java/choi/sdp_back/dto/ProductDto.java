package choi.sdp_back.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductDto {
    private Long id;
    private String name;
    private String description;
    private String imageFileName;
    private Integer price;

    // ⭐ 카테고리 필드 추가 (KEYBOARD, PC, MONITOR, ACC 등)
    private String category;
}
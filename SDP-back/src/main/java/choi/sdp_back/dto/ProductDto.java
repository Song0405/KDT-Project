package choi.sdp_back.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductDto {
    private Long id;
    private String name;
    private String description;
    private String imageFileName; // imageUrl -> imageFileName
    private Integer price;
}
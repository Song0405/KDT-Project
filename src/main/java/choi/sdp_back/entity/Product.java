package choi.sdp_back.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    private String imageFileName;
    private Integer price;

    // ⭐ 카테고리 필드 추가
    // ALL, KEYBOARD, PC, MONITOR, ACC 중 하나가 저장됩니다.
    @Column(length = 50)
    private String category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ProductRecommendation> recommendations = new ArrayList<>();
}
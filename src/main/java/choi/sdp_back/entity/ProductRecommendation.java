package choi.sdp_back.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    private String targetProductName;

    // 추천 제품의 고유 ID
    private Long targetProductId;

    @Column(length = 500)
    private String reason;

    // 생성자 수정 (targetProductId 추가)
    public ProductRecommendation(Product product, String targetProductName, Long targetProductId, String reason) {
        this.product = product;
        this.targetProductName = targetProductName;
        this.targetProductId = targetProductId; // ⭐ 저장!
        this.reason = reason;
    }
}
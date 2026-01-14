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

    // ★ 핵심: 올려주신 Product 엔티티와 연결하는 부분
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    // 추천하는 제품 이름
    private String targetProductName;

    // 추천 이유 (AI 멘트)
    @Column(length = 500)
    private String reason;

    // 생성자
    public ProductRecommendation(Product product, String targetProductName, String reason) {
        this.product = product;
        this.targetProductName = targetProductName;
        this.reason = reason;
    }
}
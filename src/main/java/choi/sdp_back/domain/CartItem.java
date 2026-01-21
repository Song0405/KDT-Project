package choi.sdp_back.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "cart_seq_gen")
    @SequenceGenerator(name = "cart_seq_gen", sequenceName = "CART_SEQ", allocationSize = 1)
    private Long id;

    private String memberName;   // 담은 사람

    // 상품 정보 (나중에 상품이 삭제돼도 장바구니엔 남도록 정보 직접 저장)
    private Long productId;      // 상품 고유 ID
    private String productName;  // 상품명
    private int price;           // 가격
    private String imageUrl;     // 이미지 경로

    private LocalDateTime createDate = LocalDateTime.now();
}
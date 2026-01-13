package choi.sdp_back.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "SHOP_ORDER")
@Getter @Setter
@NoArgsConstructor
public class ShopOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "shop_order_seq_gen")
    @SequenceGenerator(name = "shop_order_seq_gen", sequenceName = "SHOP_ORDER_SEQ", allocationSize = 1)
    private Long id;

    private String memberName;  // 구매자 이름
    private String productName; // 제품명
    private int price;          // 가격
    private String merchantUid; // 주문번호

    private LocalDateTime orderDate; // 주문일시

    @PrePersist
    public void prePersist() {
        this.orderDate = LocalDateTime.now();
    }
}

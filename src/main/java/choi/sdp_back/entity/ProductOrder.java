package choi.sdp_back.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@Table(name = "product_orders") // DB 테이블 이름
public class ProductOrder {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String clientName;   // 고객사 (예: 현대건설)
    private String productName;  // 주문 품목
    private String contact;      // 연락처

    @Column(unique = true)
    private String trackingCode; // ⭐ 송장 번호 (SDP-XXXX)

    @Enumerated(EnumType.STRING)
    private OrderStatus status;  // 현재 상태

    private LocalDateTime orderDate; // 주문 시간

    @PrePersist
    public void prePersist() {
        this.orderDate = LocalDateTime.now();
        if (this.status == null) {
            this.status = OrderStatus.ORDERED;
        }
    }
}
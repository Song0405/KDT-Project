package choi.sdp_back.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LayoutItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 배치될 실제 제품 정보 (기존 Product 엔티티와 연동)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    private Double x; // 3D 시뮬레이터 상의 X축 좌표
    private Double z; // 3D 시뮬레이터 상의 Z축 좌표

    // 해당 아이템이 속한 테마 정보
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "layout_id")
    private Layout layout;
}
package choi.sdp_back.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Layout {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String themeName; // 예: "개발자용 듀얼 모니터 셋업"
    private String description;

    // ⭐ 해당 배치를 보여주는 고화질 이미지 경로 추가
    private String layoutImageUrl;

    @OneToMany(mappedBy = "layout", cascade = CascadeType.ALL)
    private List<LayoutItem> items;
}
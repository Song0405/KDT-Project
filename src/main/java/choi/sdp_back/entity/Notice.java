package choi.sdp_back.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class) // ⭐ 날짜 자동 생성을 위해 필요
public class Notice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000) // 내용은 좀 길 수 있으니까
    private String content;

    // ⭐ [추가] 생성 날짜 (DB에 2026-01-07 형식으로 저장됨)
    @CreatedDate
    @Column(updatable = false)
    private LocalDate createdDate;
}
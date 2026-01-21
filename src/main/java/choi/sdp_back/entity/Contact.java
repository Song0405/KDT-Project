package choi.sdp_back.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "CONTACTS")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title; // 문의 제목

    // 오라클 DB 호환성을 위해 length 지정 (약 2000자까지 저장 가능)
    @Column(nullable = false, length = 2000)
    private String content; // 문의 내용

    private String writer; // 작성자 (누가 보냈는지)

    @CreationTimestamp
    private LocalDateTime createdAt; // 작성 시간 (언제 보냈는지)

    //  관리자 답변
    @Column(length = 2000)
    private String answer;

    @Column(length = 50)
    private String category; // AI가 자동 분류한 카테고리 (예: 배송 문의)

    @Column(length = 20)
    private String priority; // 중요도 (NORMAL / CRITICAL)

    @Column(length = 500)
    private String aiMemo;   // 관리자용 AI 분석 리포트
}
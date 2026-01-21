package choi.sdp_back.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "REVIEW")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long productId; // 어떤 상품에 대한 리뷰인지

    @Column(nullable = false)
    private String writer;  // 작성자 이름 (로그인한 사람)

    @Column(nullable = false, length = 1000)
    private String content; // 리뷰 내용

    private int rating;     // 별점 (1~5)

    @CreationTimestamp
    private LocalDateTime createdDate; // 작성일

    @Column(length = 20)
    private String sentiment; // 분석 결과: POSITIVE / NEGATIVE

    @Column(length = 200)
    private String aiTags;    // 분석 결과: #배송빠름 #가성비
}
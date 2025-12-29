package choi.sdp_back.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor; // ⭐ NoArgsConstructor 추가 (기본 생성자 필요)
import lombok.AllArgsConstructor; // ⭐ AllArgsConstructor 추가 (선택 사항)

@Entity
@Getter // ⭐ Getter 추가
@Setter // ⭐ Setter 추가
@NoArgsConstructor // ⭐ 기본 생성자 추가
@AllArgsConstructor // ⭐ 모든 필드를 인자로 받는 생성자 추가 (선택 사항)
@Table(name = "COMPANY_INFO") // 테이블 이름 지정 (대문자 권장)
public class CompanyInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Oracle에서는 IDENTITY 전략 사용 (Hibernate 6부터)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "VARCHAR2(2000)", nullable = false) // 긴 텍스트를 위해 VARCHAR2(2000) 사용
    private String description;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String phone;

    // ⭐ ⭐ ⭐ 새로 추가할 부분 ⭐ ⭐ ⭐
    @Column(nullable = false)
    private String email;
    // ⭐ ⭐ ⭐ 여기까지 ⭐ ⭐ ⭐
}
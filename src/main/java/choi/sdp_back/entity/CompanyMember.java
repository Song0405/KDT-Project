package choi.sdp_back.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "COMPANY_MEMBER") // 기업회원 테이블
public class CompanyMember extends MemberBase {

    @Column(name = "BUSINESS_NUMBER")
    private String businessNumber; // 사업자번호 (기업 전용)
}
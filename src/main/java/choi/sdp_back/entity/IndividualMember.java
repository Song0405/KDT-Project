package choi.sdp_back.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "INDIVIDUAL_MEMBER") // 개인회원 테이블
public class IndividualMember extends MemberBase {

    private String ssn; // 주민번호 (개인 전용)
}
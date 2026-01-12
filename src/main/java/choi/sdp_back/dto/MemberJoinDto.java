package choi.sdp_back.dto;

import lombok.Data;

@Data
public class MemberJoinDto {
    private String memberId;
    private String password;
    private String name;
    private String phoneNumber;
    private String email;

    // 선택 정보
    private String ssn;             // 개인일 때만 옴
    private String businessNumber;  // 기업일 때만 옴

    // "individual" 또는 "company" (회원가입 유형)
    private String type;
}

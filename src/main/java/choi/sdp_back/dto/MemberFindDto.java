package choi.sdp_back.dto;

import lombok.Data;

@Data
public class MemberFindDto {
    // 아이디 찾기용
    private String name;
    private String phoneNumber;

    // 비밀번호 재설정용 (위 2개 + 아이디 + 새비번)
    private String memberId;
    private String newPassword;
}

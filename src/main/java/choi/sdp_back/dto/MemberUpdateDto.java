package choi.sdp_back.dto;

import lombok.Data;

@Data
public class MemberUpdateDto {
    private String memberId;
    private String currentPassword; // 현재 비밀번호 (확인용)
    private String newPassword;     // 바꿀 비밀번호
    private String name;            // 이름 수정용
    private String phoneNumber;     // 전화번호 수정용
    private String email;           // 이메일 수정용
    private String type;            // individual 또는 company 구분
}

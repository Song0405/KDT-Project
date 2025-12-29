package choi.sdp_back.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompanyInfoDto {
    private Long id;
    private String name;
    private String description;
    private String address;
    private String phone;
    // ⭐ ⭐ ⭐ 새로 추가할 부분 ⭐ ⭐ ⭐
    private String email;
    // ⭐ ⭐ ⭐ 여기까지 ⭐ ⭐ ⭐
}
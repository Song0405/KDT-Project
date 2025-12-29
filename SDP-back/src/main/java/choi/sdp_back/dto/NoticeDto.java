package choi.sdp_back.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NoticeDto {
    private Long id;
    private String title;
    private String content;
}
package choi.sdp_back.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
public class NoticeDto {
    private Long id;
    private String title;
    private String content;

    // ⭐ [추가] 프론트엔드가 'date'를 원하므로 이름을 맞춰줍니다.
    private LocalDate date;
}
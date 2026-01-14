package choi.sdp_back.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class OllamaDto {

    @Data
    @AllArgsConstructor
    public static class Request {
        private String model;   // "gemma3:4b"
        private String prompt;  // "이거랑 어울리는 거 추천해줘"
        private boolean stream; // false (한번에 답변 받기 위해)
    }

    @Data
    @NoArgsConstructor
    public static class Response {
        private String response; // AI가 대답한 말
    }
}
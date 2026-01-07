package choi.sdp_back.service;

import choi.sdp_back.dto.OllamaDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
public class AiService {

    @Value("${ollama.url}")
    private String ollamaUrl;

    @Value("${ollama.model}")
    private String ollamaModel;

    // HTTP 요청을 보내는 도구 (Spring 6.1+ 최신 기능)
    private final RestClient restClient = RestClient.create();

    public String getRecommendation(String productName, String description) {
        // 1. 프롬프트(질문) 만들기
        String prompt = String.format(
                "제품명: %s\n설명: %s\n\n" +
                        "위 제품과 함께 사용하면 좋은 제품을 딱 1개만 추천해주고, 그 이유도 한 문장으로 설명해줘.\n" +
                        "형식은 반드시 '추천제품명 : 이유' 형태로만 답변해.",
                productName, description
        );

        // 2. 요청 데이터 만들기
        OllamaDto.Request request = new OllamaDto.Request(ollamaModel, prompt, false);

        try {
            // 3. Ollama에게 전송 (POST)
            OllamaDto.Response response = restClient.post()
                    .uri(ollamaUrl)
                    .body(request)
                    .retrieve()
                    .body(OllamaDto.Response.class);

            // 4. 답변 꺼내기
            if (response != null && response.getResponse() != null) {
                return response.getResponse().trim();
            }

        } catch (Exception e) {
            e.printStackTrace();
            return "AI 연결 실패 : 로지텍 마우스 (기본 추천)"; // 에러 시 기본값
        }

        return "추천 제품 없음";
    }
}
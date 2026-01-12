package choi.sdp_back.service;

import choi.sdp_back.dto.OllamaDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List; // ⭐ List import 필수!

@Service
@RequiredArgsConstructor
public class AiService {

    @Value("${ollama.url}")
    private String ollamaUrl;

    @Value("${ollama.model}")
    private String ollamaModel;

    private final RestClient restClient = RestClient.create();

    // ⭐ 파라미터에 'allProductNames' (전체 상품 리스트) 추가
    public String getRecommendation(String productName, String description, List<String> allProductNames) {

        // 1. 전체 상품 목록을 문자열로 변환 (예: "마우스, 키보드, 모니터")
        String productListString = String.join(", ", allProductNames);

        // 2. 프롬프트 업그레이드 (예시 추가 + 목록 제한)
        String prompt = String.format(
                """
                당신은 쇼핑몰 추천 AI입니다.
                
                [현재 보고 있는 제품]
                이름: %s
                설명: %s
                
                [우리 쇼핑몰 판매 목록]
                %s
                
                [지시사항]
                1. 반드시 위 [판매 목록]에 있는 제품 중 하나를 골라 추천하세요. (목록에 없는 것 금지)
                2. 현재 제품(%s)은 추천하지 마세요.
                3. 답변은 아래 [예시]와 똑같은 형식으로 작성하세요.
                
                [올바른 답변 예시]
                게이밍 키보드 : 반응 속도가 빨라 게임 환경에 최적화된 제품이라 추천합니다.
                
                [잘못된 답변 예시]
                추천제품명 : 추천하는 이유입니다. (X)
                """,
                productName, description, productListString, productName
        );

        OllamaDto.Request request = new OllamaDto.Request(ollamaModel, prompt, false);

        try {
            OllamaDto.Response response = restClient.post()
                    .uri(ollamaUrl)
                    .body(request)
                    .retrieve()
                    .body(OllamaDto.Response.class);

            if (response != null && response.getResponse() != null) {
                return response.getResponse().trim();
            }

        } catch (Exception e) {
            e.printStackTrace();
            // 에러 시 목록의 첫 번째 제품이라도 추천 (안전장치)
            if (!allProductNames.isEmpty()) {
                return allProductNames.get(0) + " : (AI 연결 불안정으로 자동 추천)";
            }
        }

        return "추천 제품 없음 : 데이터 부족";
    }
}
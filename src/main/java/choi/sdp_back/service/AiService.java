package choi.sdp_back.service;

import choi.sdp_back.dto.ProductDto;
import choi.sdp_back.entity.Product;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiService {

    // 파이썬 AI 서버 주소
    private final String AI_SERVER_URL = "http://localhost:5002/recommend";
    private final RestTemplate restTemplate = new RestTemplate();

    public List<Map<String, Object>> getRecommendationsFromPython(Product currentProduct, List<Product> candidates) {
        try {
            // 1. 파이썬으로 보낼 데이터 포장
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("targetName", currentProduct.getName());
            requestBody.put("targetCategory", currentProduct.getCategory());
            requestBody.put("targetUsage", currentProduct.getUsage()); // 용도 (GAMING 등)

            // 후보군 리스트 변환 (Entity -> Map)
            List<Map<String, Object>> candidateList = new ArrayList<>();
            for (Product p : candidates) {
                Map<String, Object> pMap = new HashMap<>();
                pMap.put("id", p.getId());
                pMap.put("name", p.getName());
                pMap.put("category", p.getCategory());
                candidateList.add(pMap);
            }
            requestBody.put("candidates", candidateList);

            // 2. 파이썬 서버 호출 (POST)
            Map<String, Object> response = restTemplate.postForObject(AI_SERVER_URL, requestBody, Map.class);

            // 3. 결과 받아서 리턴
            if (response != null && "success".equals(response.get("status"))) {
                return (List<Map<String, Object>>) response.get("recommendations");
            }

        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("❌ AI 서버 연결 실패: " + e.getMessage());
        }
        return new ArrayList<>(); // 실패 시 빈 리스트 반환
    }
}
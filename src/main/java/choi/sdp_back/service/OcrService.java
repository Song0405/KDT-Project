package choi.sdp_back.service;

import com.google.cloud.vision.v1.*;
import com.google.protobuf.ByteString;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OcrService {

    @Value("${google.cloud.vision.key-path}")
    private String keyPath;

    private ImageAnnotatorClient client;

    @PostConstruct
    public void init() throws IOException {
        // keyPath를 사용하여 인증 정보 설정
        // ClassPathResource를 사용하여 리소스 경로에서 파일을 읽음
        this.client = ImageAnnotatorClient.create(
                ImageAnnotatorSettings.newBuilder()
                        .setCredentialsProvider(() -> com.google.auth.oauth2.GoogleCredentials.fromStream(
                                new ClassPathResource(keyPath).getInputStream()))
                        .build());
    }

    public Map<String, String> extractBusinessInfo(MultipartFile file) throws IOException {
        // MultipartFile을 ByteString으로 변환
        ByteString imgBytes = ByteString.copyFrom(file.getBytes());

        // Vision API 요청 설정
        List<AnnotateImageRequest> requests = new ArrayList<>();
        Image img = Image.newBuilder().setContent(imgBytes).build();
        Feature feat = Feature.newBuilder().setType(Feature.Type.TEXT_DETECTION).build();
        AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                .addFeatures(feat)
                .setImage(img)
                .build();
        requests.add(request);

        // API 호출 및 응답 받기
        BatchAnnotateImagesResponse response = client.batchAnnotateImages(requests);
        List<AnnotateImageResponse> responses = response.getResponsesList();

        Map<String, String> extractedData = new HashMap<>();

        if (!responses.isEmpty()) {
            AnnotateImageResponse res = responses.get(0);
            if (res.hasError()) {
                System.err.println("Error: " + res.getError().getMessage());
                // 에러 발생 시 빈 맵 또는 예외 처리
                return extractedData;
            }

            // 전체 텍스트 추출
            String fullText = res.getTextAnnotationsList().get(0).getDescription();
            System.out.println("Full Extracted Text:\n" + fullText); // 디버깅용 로그

            // 정규식을 사용하여 정보 추출
            // 1. 사업자등록번호 (XXX-XX-XXXXX 형식)
            Pattern businessNumberPattern = Pattern.compile("(\\d{3}-\\d{2}-\\d{5})");
            Matcher businessNumberMatcher = businessNumberPattern.matcher(fullText);
            if (businessNumberMatcher.find()) {
                extractedData.put("businessNumber", businessNumberMatcher.group(1));
            }

            // 2. 상호 (회사명)
            // "상호 (법인명) :", "상 호:", "상호:" 등의 패턴을 찾습니다.
            Pattern companyNamePattern = Pattern.compile("(?:상\\s*호|법\\s*인\\s*명)\\s*[:(]?\\s*([^\\s(]+)");
            Matcher companyNameMatcher = companyNamePattern.matcher(fullText);
            if (companyNameMatcher.find()) {
                extractedData.put("companyName", companyNameMatcher.group(1).trim());
            }

            // 3. 대표자명
            // "성 명 :", "대표자 :", "성명 :" 등의 패턴을 찾습니다.
            Pattern representativeNamePattern = Pattern.compile("(?:성\\s*명|대\\s*표\\s*자)\\s*[:]?\\s*([^\\s(]+)");
            Matcher representativeNameMatcher = representativeNamePattern.matcher(fullText);
            if (representativeNameMatcher.find()) {
                extractedData.put("representativeName", representativeNameMatcher.group(1).trim());
            }
        }

        // 클라이언트 종료
        // client.close(); // Spring Bean으로 관리되므로 애플리케이션 종료 시 자동으로 닫힘

        return extractedData;
    }
}


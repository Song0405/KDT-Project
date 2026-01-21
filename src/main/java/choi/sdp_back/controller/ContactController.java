package choi.sdp_back.controller;

import choi.sdp_back.entity.Contact;
import choi.sdp_back.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final ContactRepository contactRepository;

    // 🐍 파이썬 AI 서버 주소 (스마트 민원 분류기)
    private final String AI_URL = "http://localhost:5002/analyze-contact";
    private final RestTemplate restTemplate = new RestTemplate();

    // 1. 문의하기 저장 (✨ AI 분석 로직 추가됨)
    @PostMapping
    public String saveContact(@RequestBody Contact contact) {

        // 🛑 [AI 분석 시작] 저장하기 전에 파이썬에게 분석 요청
        try {
            // 파이썬 서버로 보낼 데이터 준비
            Map<String, String> request = new HashMap<>();
            request.put("title", contact.getTitle());
            request.put("content", contact.getContent());

            // POST 요청 전송 및 결과 수신
            Map<String, Object> aiResult = restTemplate.postForObject(AI_URL, request, Map.class);

            if (aiResult != null && "success".equals(aiResult.get("status"))) {
                // 분석 결과를 Entity에 세팅 (자동 태깅)
                contact.setCategory((String) aiResult.get("category"));
                contact.setPriority((String) aiResult.get("priority"));
                contact.setAiMemo((String) aiResult.get("ai_memo"));

                System.out.println("✅ 민원 분석 완료: " + contact.getCategory() + " / " + contact.getPriority());
            }
        } catch (Exception e) {
            // AI 서버가 꺼져 있어도 문의는 정상적으로 받아야 함 (기본값 설정)
            System.out.println("⚠ AI 서버 연결 실패 (분석 없이 저장됩니다): " + e.getMessage());
            contact.setCategory("미분류");
            contact.setPriority("NORMAL");
            contact.setAiMemo("AI 서버 응답 없음");
        }

        // DB 저장
        contactRepository.save(contact);
        return "문의가 접수되었습니다.";
    }

    // 2. (관리자용) 전체 문의 내역 조회
    @GetMapping
    public List<Contact> getAllContacts() {
        // 기존에 쓰시던 메소드 그대로 유지
        return contactRepository.findAllByOrderByCreatedAtDesc();
    }

    // ✨ (사용자용) 내 문의 내역만 조회
    @GetMapping("/my/{writer}")
    public List<Contact> getMyContacts(@PathVariable String writer) {
        // 기존에 쓰시던 메소드 그대로 유지
        return contactRepository.findAllByWriterOrderByCreatedAtDesc(writer);
    }

    // 3. (관리자용) 답변 등록하기
    @PutMapping("/{id}/answer")
    public String updateAnswer(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 문의가 없습니다."));
        contact.setAnswer(request.get("answer"));
        contactRepository.save(contact);
        return "답변이 등록되었습니다.";
    }
}
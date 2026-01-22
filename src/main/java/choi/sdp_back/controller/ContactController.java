package choi.sdp_back.controller;

import choi.sdp_back.entity.Contact;
import choi.sdp_back.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // ✨ 405 에러 해결 필수
public class ContactController {

    private final ContactRepository contactRepository;
    private final String AI_URL = "http://localhost:5002/analyze-contact";
    private final RestTemplate restTemplate = new RestTemplate();

    // 1. 전체 조회 (관리자)
    @GetMapping
    public List<Contact> getAllContacts() {
        return contactRepository.findAllByOrderByCreatedAtDesc();
    }

    // 2. 내 문의 조회 (사용자)
    @GetMapping("/my/{writer}")
    public List<Contact> getMyContacts(@PathVariable String writer) {
        return contactRepository.findAllByWriterOrderByCreatedAtDesc(writer);
    }

    // 3. 문의 저장
    @PostMapping
    public String saveContact(@RequestBody Contact contact) {
        analyzeWithAI(contact);
        contactRepository.save(contact);
        return "접수 완료";
    }

    // 4. 인라인 수정 (사용자)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateContact(@PathVariable Long id, @RequestBody Contact dto) {
        return contactRepository.findById(id).map(contact -> {
            if (contact.getAnswer() != null) return ResponseEntity.badRequest().body("답변 완료된 글은 수정 불가");
            contact.setTitle(dto.getTitle());
            contact.setContent(dto.getContent());
            analyzeWithAI(contact);
            contactRepository.save(contact);
            return ResponseEntity.ok(contact);
        }).orElse(ResponseEntity.notFound().build());
    }

    // 5. 삭제 (공통)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteContact(@PathVariable Long id) {
        contactRepository.deleteById(id);
        return ResponseEntity.ok("삭제 성공");
    }

    // 6. 답변 등록 (관리자)
    @PutMapping("/{id}/answer")
    public String updateAnswer(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Contact contact = contactRepository.findById(id).orElseThrow();
        contact.setAnswer(request.get("answer"));
        contactRepository.save(contact);
        return "답변 등록 완료";
    }

    private void analyzeWithAI(Contact contact) {
        try {
            Map<String, String> req = new HashMap<>();
            req.put("title", contact.getTitle());
            req.put("content", contact.getContent());
            Map<String, Object> res = restTemplate.postForObject(AI_URL, req, Map.class);
            if (res != null && "success".equals(res.get("status"))) {
                contact.setCategory((String) res.get("category"));
                contact.setPriority((String) res.get("priority"));
                contact.setAiMemo((String) res.get("ai_memo"));
            }
        } catch (Exception e) {
            contact.setCategory("미분류");
            contact.setPriority("NORMAL");
        }
    }
}
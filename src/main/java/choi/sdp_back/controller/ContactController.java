package choi.sdp_back.controller;

import choi.sdp_back.entity.Contact;
import choi.sdp_back.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final ContactRepository contactRepository;

    // 1. 문의하기 저장
    @PostMapping
    public String saveContact(@RequestBody Contact contact) {
        contactRepository.save(contact);
        return "문의가 접수되었습니다.";
    }

    // 2. (관리자용) 전체 문의 내역 조회
    @GetMapping
    public List<Contact> getAllContacts() {
        return contactRepository.findAllByOrderByCreatedAtDesc();
    }

    // ✨ [추가] (사용자용) 내 문의 내역만 조회
    @GetMapping("/my/{writer}")
    public List<Contact> getMyContacts(@PathVariable String writer) {
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
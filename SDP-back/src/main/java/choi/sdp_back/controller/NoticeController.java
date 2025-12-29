package choi.sdp_back.controller;

import choi.sdp_back.dto.NoticeDto;
import choi.sdp_back.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notices")
public class NoticeController {

    private final NoticeService noticeService;

    // 모든 공지사항 조회
    @GetMapping
    public List<NoticeDto> getAllNotices() {
        return noticeService.getAllNotices();
    }

    // 새 공지사항 생성
    @PostMapping
    public ResponseEntity<NoticeDto> createNotice(@RequestBody NoticeDto noticeDto) {
        return ResponseEntity.ok(noticeService.createNotice(noticeDto));
    }

    // 공지사항 수정
    @PutMapping("/{id}")
    public ResponseEntity<NoticeDto> updateNotice(@PathVariable Long id, @RequestBody NoticeDto noticeDto) {
        return ResponseEntity.ok(noticeService.updateNotice(id, noticeDto));
    }

    // 공지사항 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotice(@PathVariable Long id) {
        noticeService.deleteNotice(id);
        return ResponseEntity.noContent().build();
    }
}
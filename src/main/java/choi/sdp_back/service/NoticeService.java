package choi.sdp_back.service;

import choi.sdp_back.dto.NoticeDto;
import choi.sdp_back.entity.Notice;
import choi.sdp_back.repository.NoticeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;

    // 모든 공지사항 조회
    @Transactional(readOnly = true)
    public List<NoticeDto> getAllNotices() {
        return noticeRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 새 공지사항 생성
    @Transactional
    public NoticeDto createNotice(NoticeDto noticeDto) {
        Notice notice = new Notice();
        notice.setTitle(noticeDto.getTitle());
        notice.setContent(noticeDto.getContent());
        return convertToDto(noticeRepository.save(notice));
    }

    // 공지사항 수정
    @Transactional
    public NoticeDto updateNotice(Long id, NoticeDto noticeDto) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("공지사항 ID를 찾을 수 없습니다: " + id));
        notice.setTitle(noticeDto.getTitle());
        notice.setContent(noticeDto.getContent());
        return convertToDto(noticeRepository.save(notice));
    }

    // 공지사항 삭제
    @Transactional
    public void deleteNotice(Long id) {
        // 삭제 전 존재 여부 확인 (선택 사항이지만 안전함)
        if (!noticeRepository.existsById(id)) {
            throw new EntityNotFoundException("삭제할 공지사항 ID를 찾을 수 없습니다: " + id);
        }
        noticeRepository.deleteById(id);
    }

    private NoticeDto convertToDto(Notice notice) {
        NoticeDto dto = new NoticeDto();
        dto.setId(notice.getId());
        dto.setTitle(notice.getTitle());
        dto.setContent(notice.getContent());
        return dto;
    }
}
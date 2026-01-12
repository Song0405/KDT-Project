package choi.sdp_back.service;

import choi.sdp_back.dto.NoticeDto;
import choi.sdp_back.entity.Notice;
import choi.sdp_back.repository.NoticeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate; // ✅ [추가] 날짜 기능을 위해 필요
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;

    // 모든 공지사항 조회 (최신순 정렬은 여기서 하는게 좋습니다)
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

        // ⭐ [핵심 수정] 웹에서 만들 때 오늘 날짜를 강제로 넣어줍니다.
        if (notice.getCreatedDate() == null) {
            notice.setCreatedDate(LocalDate.now());
        }

        return convertToDto(noticeRepository.save(notice));
    }

    // 공지사항 수정
    @Transactional
    public NoticeDto updateNotice(Long id, NoticeDto noticeDto) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("공지사항 ID를 찾을 수 없습니다: " + id));
        notice.setTitle(noticeDto.getTitle());
        notice.setContent(noticeDto.getContent());

        // 수정할 때는 날짜를 바꾸지 않습니다 (원한다면 여기서 LocalDate.now() 넣으면 수정일로 변경됨)

        return convertToDto(noticeRepository.save(notice));
    }

    // 공지사항 삭제
    @Transactional
    public void deleteNotice(Long id) {
        if (!noticeRepository.existsById(id)) {
            throw new EntityNotFoundException("삭제할 공지사항 ID를 찾을 수 없습니다: " + id);
        }
        noticeRepository.deleteById(id);
    }

    // Entity -> DTO 변환
    private NoticeDto convertToDto(Notice notice) {
        NoticeDto dto = new NoticeDto();
        dto.setId(notice.getId());
        dto.setTitle(notice.getTitle());
        dto.setContent(notice.getContent());

        // DB에 저장된 날짜를 가져옵니다. (없으면 오늘 날짜로 표시해서 에러 방지)
        dto.setDate(notice.getCreatedDate() != null ? notice.getCreatedDate() : LocalDate.now());

        return dto;
    }
}
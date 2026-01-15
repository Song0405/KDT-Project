package choi.sdp_back.repository;

import choi.sdp_back.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContactRepository extends JpaRepository<Contact, Long> {

    // 1. 관리자용: 모든 문의 최신순 보기
    List<Contact> findAllByOrderByCreatedAtDesc();

    // ✨ [추가] 사용자용: "내 이름(writer)"으로 쓴 글만 최신순으로 가져오기
    List<Contact> findAllByWriterOrderByCreatedAtDesc(String writer);
}
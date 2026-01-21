package choi.sdp_back.repository;

import choi.sdp_back.entity.Layout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LayoutRepository extends JpaRepository<Layout, Long> {
    // 기본 CRUD 메서드 자동 생성
}
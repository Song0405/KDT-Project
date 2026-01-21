package choi.sdp_back.repository;

import choi.sdp_back.domain.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CartRepository extends JpaRepository<CartItem, Long> {
    // 내 장바구니 목록 가져오기 (최신순)
    List<CartItem> findByMemberNameOrderByCreateDateDesc(String memberName);

    // 장바구니 비우기 (결제 완료 후 사용)
    void deleteByMemberName(String memberName);
}
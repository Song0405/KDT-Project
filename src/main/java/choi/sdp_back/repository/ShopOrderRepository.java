package choi.sdp_back.repository; // 패키지명 확인

import choi.sdp_back.domain.ShopOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShopOrderRepository extends JpaRepository<ShopOrder, Long> {
    // 1. (기존) 내 주문 내역 찾기
    List<ShopOrder> findByMemberNameOrderByOrderDateDesc(String memberName);

}

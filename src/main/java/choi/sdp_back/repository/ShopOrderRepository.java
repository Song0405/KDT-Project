package choi.sdp_back.repository;

import choi.sdp_back.domain.ShopOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional; // ⭐ 이거 추가 필요!

public interface ShopOrderRepository extends JpaRepository<ShopOrder, Long> {
    // 1. 내 주문 내역
    List<ShopOrder> findByMemberNameOrderByOrderDateDesc(String memberName);

    // 2. 관리자용 전체 조회
    List<ShopOrder> findAllByOrderByOrderDateDesc();

    // ⭐ 3. [추가] 송장번호(merchantUid)로 주문 1개 찾기
    Optional<ShopOrder> findByMerchantUid(String merchantUid);
}
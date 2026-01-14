package choi.sdp_back.repository;

import choi.sdp_back.domain.ShopOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
// import java.util.Optional; // 👈 이거 지워도 됨

public interface ShopOrderRepository extends JpaRepository<ShopOrder, Long> {
    // 1. 내 주문 내역
    List<ShopOrder> findByMemberNameOrderByOrderDateDesc(String memberName);

    // 2. 관리자용 전체 조회
    List<ShopOrder> findAllByOrderByOrderDateDesc();

    // ⭐ 3. [수정됨] 송장번호로 조회 (Optional -> List로 변경)
    // 똑같은 주문번호가 여러 개(장바구니 결제)일 수 있으므로 List로 받습니다.
    List<ShopOrder> findByMerchantUid(String merchantUid);
}
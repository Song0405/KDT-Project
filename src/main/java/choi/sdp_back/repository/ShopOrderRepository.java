package choi.sdp_back.repository;

import choi.sdp_back.domain.ShopOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShopOrderRepository extends JpaRepository<ShopOrder, Long> {

    // [기존] 이름으로 찾기 (이건 이제 안 쓸 예정이지만 남겨둠)
    List<ShopOrder> findByMemberNameOrderByOrderDateDesc(String memberName);

    // ⭐ [신규 추가] ID로 주문 내역 조회 (최신순 정렬)
    // 탈퇴하면 ID가 바뀌므로, 이 기능으로 찾으면 탈퇴한 주문은 절대 안 뜹니다!
    List<ShopOrder> findByMemberIdOrderByOrderDateDesc(String memberId);

    // 관리자용 전체 조회
    List<ShopOrder> findAllByOrderByOrderDateDesc();

    // 송장번호 조회
    List<ShopOrder> findByMerchantUid(String merchantUid);

    // 탈퇴 처리용 조회
    List<ShopOrder> findAllByMemberId(String memberId);
}
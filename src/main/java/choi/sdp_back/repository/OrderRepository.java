package choi.sdp_back.repository;

import choi.sdp_back.entity.ProductOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<ProductOrder, Long> {
    // 송장 번호로 주문 찾기 기능
    Optional<ProductOrder> findByTrackingCode(String trackingCode);
}
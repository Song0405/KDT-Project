package choi.sdp_back.controller;

import choi.sdp_back.domain.ShopOrder;
import choi.sdp_back.repository.ShopOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shop-orders")
@RequiredArgsConstructor
public class ShopOrderController {

    private final ShopOrderRepository shopOrderRepository;

    // 1. [수정됨] 주문 저장
    @PostMapping
    public String saveOrder(@RequestBody Map<String, Object> data) {
        ShopOrder order = new ShopOrder();

        // ⭐ [추가] 주문할 때 회원 아이디(memberId)를 꼭 저장해야 나중에 찾아올 수 있습니다.
        order.setMemberId((String) data.get("memberId"));

        order.setMemberName((String) data.get("memberName"));
        order.setProductName((String) data.get("productName"));

        if (data.get("price") != null) {
            order.setPrice(Integer.parseInt(data.get("price").toString()));
        }
        String uid = (String) data.get("merchantUid");
        order.setMerchantUid(uid != null ? uid : "MANUAL_" + System.currentTimeMillis());

        shopOrderRepository.save(order);
        return "주문 저장 완료";
    }

    // 2. [핵심 수정] 내 주문 조회 (이름 -> 아이디로 변경)
    @GetMapping
    public List<ShopOrder> getMyOrders(@RequestParam String memberId) {
        // 이제 이름이 같아도, 아이디가 다르면(탈퇴했으면) 조회되지 않습니다.
        return shopOrderRepository.findByMemberIdOrderByOrderDateDesc(memberId);
    }

    // 3. 관리자용 전체 조회
    @GetMapping("/all")
    public List<ShopOrder> getAllOrders() {
        return shopOrderRepository.findAllByOrderByOrderDateDesc();
    }

    // 4. 주문 상태 변경
    @PutMapping("/{id}/status")
    public void updateStatus(@PathVariable Long id, @RequestParam String status) {
        ShopOrder order = shopOrderRepository.findById(id).orElseThrow();
        order.setStatus(status);
        shopOrderRepository.save(order);
    }

    // 5. 주문 삭제
    @DeleteMapping("/{id}")
    public void deleteOrder(@PathVariable Long id) {
        shopOrderRepository.deleteById(id);
    }

    // 6. 송장번호로 조회
    @GetMapping("/track")
    public org.springframework.http.ResponseEntity<List<ShopOrder>> trackOrder(@RequestParam String code) {
        List<ShopOrder> orders = shopOrderRepository.findByMerchantUid(code);

        if (orders.isEmpty()) {
            return org.springframework.http.ResponseEntity.notFound().build();
        }
        return org.springframework.http.ResponseEntity.ok(orders);
    }

    // [수정됨] 일괄 주문 저장 (장바구니)
    @PostMapping("/batch")
    public String saveBatchOrders(@RequestBody List<Map<String, Object>> listData) {
        for (Map<String, Object> data : listData) {
            ShopOrder order = new ShopOrder();

            // ⭐ [추가] 장바구니 결제 시에도 아이디 저장 필수
            order.setMemberId((String) data.get("memberId"));

            order.setMemberName((String) data.get("memberName"));
            order.setProductName((String) data.get("productName"));
            order.setPrice((Integer) data.get("price"));
            order.setMerchantUid((String) data.get("merchantUid"));

            shopOrderRepository.save(order);
        }
        return "일괄 주문 저장 완료";
    }
}
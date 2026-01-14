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

    // 1. 주문 저장
    @PostMapping
    public String saveOrder(@RequestBody Map<String, Object> data) {
        ShopOrder order = new ShopOrder();
        order.setMemberName((String) data.get("memberName"));
        order.setProductName((String) data.get("productName"));
        // 가격이 없으면 0으로 처리 (수동 추가 시 에러 방지)
        if (data.get("price") != null) {
            order.setPrice(Integer.parseInt(data.get("price").toString()));
        }
        // 주문번호가 없으면 임의 생성
        String uid = (String) data.get("merchantUid");
        order.setMerchantUid(uid != null ? uid : "MANUAL_" + System.currentTimeMillis());

        shopOrderRepository.save(order);
        return "주문 저장 완료";
    }

    // 2. 내 주문 조회
    @GetMapping
    public List<ShopOrder> getMyOrders(@RequestParam String name) {
        return shopOrderRepository.findByMemberNameOrderByOrderDateDesc(name);
    }

    // 3. 관리자용 전체 조회
    @GetMapping("/all")
    public List<ShopOrder> getAllOrders() {
        return shopOrderRepository.findAllByOrderByOrderDateDesc();
    }

    // ⭐ 4. [추가] 주문 상태 변경 (예: 배송중, 완료)
    @PutMapping("/{id}/status")
    public void updateStatus(@PathVariable Long id, @RequestParam String status) {
        ShopOrder order = shopOrderRepository.findById(id).orElseThrow();
        order.setStatus(status);
        shopOrderRepository.save(order);
    }

    // ⭐ 5. [추가] 주문 삭제
    @DeleteMapping("/{id}")
    public void deleteOrder(@PathVariable Long id) {
        shopOrderRepository.deleteById(id);
    }

    // ⭐ 6. [추가] 송장번호로 조회 (비회원/회원 공용)
    @GetMapping("/track")
    public org.springframework.http.ResponseEntity<ShopOrder> trackOrder(@RequestParam String code) {
        // DB에서 코드(merchantUid)로 찾아서 있으면 OK, 없으면 404 에러 리턴
        return shopOrderRepository.findByMerchantUid(code)
                .map(order -> org.springframework.http.ResponseEntity.ok(order))
                .orElse(org.springframework.http.ResponseEntity.notFound().build());
    }
}
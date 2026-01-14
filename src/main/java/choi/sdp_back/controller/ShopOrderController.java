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


    // ⭐ 6. [수정됨] 송장번호로 조회 (장바구니 결제 대응)
    // ⭐ [수정됨] 송장번호로 조회 (List로 반환하여 상품별 상태 확인 가능하게 함)
    @GetMapping("/track")
    public org.springframework.http.ResponseEntity<List<ShopOrder>> trackOrder(@RequestParam String code) {
        List<ShopOrder> orders = shopOrderRepository.findByMerchantUid(code);

        if (orders.isEmpty()) {
            return org.springframework.http.ResponseEntity.notFound().build();
        }

        // 리스트 전체를 반환
        return org.springframework.http.ResponseEntity.ok(orders);
    }
    @PostMapping("/batch")
    public String saveBatchOrders(@RequestBody List<Map<String, Object>> listData) {
        for (Map<String, Object> data : listData) {
            ShopOrder order = new ShopOrder();
            order.setMemberName((String) data.get("memberName"));
            order.setProductName((String) data.get("productName"));
            order.setPrice((Integer) data.get("price"));
            order.setMerchantUid((String) data.get("merchantUid"));

            shopOrderRepository.save(order);
        }
        return "일괄 주문 저장 완료";
    }
}
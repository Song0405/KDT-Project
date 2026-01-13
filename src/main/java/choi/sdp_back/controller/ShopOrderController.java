package choi.sdp_back.controller;

import choi.sdp_back.domain.ShopOrder;
import choi.sdp_back.repository.ShopOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shop-orders") // 프론트에서 이 주소로 데이터 보냄
@RequiredArgsConstructor
public class ShopOrderController {

    private final ShopOrderRepository shopOrderRepository;

    // 1. 주문 저장 (결제 성공 직후)
    @PostMapping
    public String saveOrder(@RequestBody Map<String, Object> data) {
        ShopOrder order = new ShopOrder();

        // 프론트에서 보낸 이름, 제품명, 가격, 주문번호를 저장
        order.setMemberName((String) data.get("memberName"));
        order.setProductName((String) data.get("productName"));
        order.setPrice((Integer) data.get("price"));
        order.setMerchantUid((String) data.get("merchantUid"));

        shopOrderRepository.save(order);
        return "주문 저장 완료";
    }

    // 2. 내 주문 내역 조회 (마이페이지용)
    @GetMapping
    public List<ShopOrder> getMyOrders(@RequestParam String name) {
        return shopOrderRepository.findByMemberNameOrderByOrderDateDesc(name);
    }
}
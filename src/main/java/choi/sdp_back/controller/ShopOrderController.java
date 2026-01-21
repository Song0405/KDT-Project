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

    // 🤖 챗봇용: 실제 DB 상태 조회
    @GetMapping("/status/{merchantUid}")
    public Map<String, String> getOrderStatus(@PathVariable String merchantUid) {
        List<ShopOrder> orders = shopOrderRepository.findByMerchantUid(merchantUid);

        if (orders.isEmpty()) {
            return Map.of("status", "NOT_FOUND", "msg", "주문 내역이 없습니다.");
        }

        // 1. 상품이 하나인 경우 -> 심플하게 응답
        if (orders.size() == 1) {
            ShopOrder order = orders.get(0);
            String kStatus = changeToKoreanStatus(order.getStatus());
            String msg = getStatusMessage(kStatus);
            return Map.of("status", kStatus, "msg", msg);
        }

        // 2. 상품이 여러 개인 경우 -> 상세 리스트 작성
        else {
            StringBuilder sb = new StringBuilder();
            sb.append("주문하신 상품들의 개별 상태입니다.\n");

            boolean isAllSame = true;
            String firstStatus = orders.get(0).getStatus();
            String representStatus = changeToKoreanStatus(firstStatus); // 대표 상태

            for (ShopOrder order : orders) {
                String kStatus = changeToKoreanStatus(order.getStatus());

                // 상품명과 상태를 한 줄씩 추가 (예: "- 기계식 키보드: [배송 완료]")
                sb.append(String.format("- %s: [%s]\n", order.getProductName(), kStatus));

                // 상태가 하나라도 다르면 '복합 상태'로 처리
                if (firstStatus != null && !firstStatus.equals(order.getStatus())) {
                    isAllSame = false;
                }
            }

            // 모든 상품 상태가 같다면 대표 상태 표시, 다르면 '부분 처리 중' 표시
            String finalStatus = isAllSame ? representStatus : "부분 처리 중";

            return Map.of("status", finalStatus, "msg", sb.toString());
        }
    }

    // 🛠️ [Helper] 영어 상태 -> 한글 변환기
    private String changeToKoreanStatus(String dbStatus) {
        if (dbStatus == null || dbStatus.isEmpty()) return "접수 완료";

        switch (dbStatus) {
            case "ORDERED":      return "접수 완료";

            // 👇 여기에 'MANUFACTURING'을 추가해야 한글로 나옵니다!
            case "PRODUCING":
            case "MANUFACTURING":
                return "제작 중";

            case "INSPECTING":   return "검수 중";

            case "SHIPPING":
            case "배송중":
                return "배송 중";

            case "COMPLETED":
            case "배송완료":
                return "배송 완료";

            case "CANCELLED":    return "주문 취소";

            default:             return dbStatus; // 등록 안 된 건 영어 그대로 출력
        }
    }

    // 🛠️ [Helper] 상태별 안내 문구
    private String getStatusMessage(String kStatus) {
        switch (kStatus) {
            case "접수 완료": return "주문이 정상적으로 접수되었습니다. 곧 제작이 시작됩니다. 👨‍🔧";
            case "제작 중": return "장인이 한땀한땀 조립하고 있습니다. 🔨";
            case "검수 중": return "꼼꼼하게 불량 여부를 확인하고 있습니다. 🧐";
            case "배송 중": return "현재 허브 터미널 간 이동 중입니다. 🚚";
            case "배송 완료": return "고객님께 안전하게 도착했습니다. 소중한 리뷰를 남겨주세요! 🎁";
            case "주문 취소": return "해당 주문은 취소되었습니다.";
            default: return "현재 주문 상태를 확인 중입니다.";
        }
    }

    // 1. 주문 저장
    @PostMapping
    public String saveOrder(@RequestBody Map<String, Object> data) {
        ShopOrder order = new ShopOrder();
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

    // 2. 내 주문 조회
    @GetMapping
    public List<ShopOrder> getMyOrders(@RequestParam String memberId) {
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

    // 7. 일괄 주문 저장
    @PostMapping("/batch")
    public String saveBatchOrders(@RequestBody List<Map<String, Object>> listData) {
        for (Map<String, Object> data : listData) {
            ShopOrder order = new ShopOrder();
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
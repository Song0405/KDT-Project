package choi.sdp_back.controller;

import choi.sdp_back.entity.ProductOrder;
import choi.sdp_back.entity.OrderStatus;
import choi.sdp_back.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    // 1. 주문 생성 (송장번호 자동 생성)
    @PostMapping
    public ProductOrder createOrder(@RequestBody ProductOrder order) {
        // 송장번호 생성 로직: SDP-날짜-랜덤4자리
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomStr = generateRandomString(4);
        order.setTrackingCode("SDP-" + dateStr + "-" + randomStr);

        return orderRepository.save(order);
    }

    // 2. 전체 주문 목록 조회
    @GetMapping
    public List<ProductOrder> getAllOrders() {
        return orderRepository.findAll();
    }

    // 3. 주문 상태 변경
    @PutMapping("/{id}/status")
    public ProductOrder updateStatus(@PathVariable Long id, @RequestParam OrderStatus status) {
        ProductOrder order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("주문 없음"));
        order.setStatus(status);
        return orderRepository.save(order);
    }

    // 4. 주문 삭제
    @DeleteMapping("/{id}")
    public void deleteOrder(@PathVariable Long id) {
        orderRepository.deleteById(id);
    }

    // 5. 송장 번호 조회 (사용자용)
    @GetMapping("/track")
    public ProductOrder trackOrder(@RequestParam String code) {
        return orderRepository.findByTrackingCode(code)
                .orElseThrow(() -> new RuntimeException("해당 송장 번호를 찾을 수 없습니다."));
    }

    // 랜덤 문자열 생성 함수
    private String generateRandomString(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
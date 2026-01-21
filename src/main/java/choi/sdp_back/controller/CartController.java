package choi.sdp_back.controller;

import choi.sdp_back.domain.CartItem;
import choi.sdp_back.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartRepository cartRepository;

    // 1. 장바구니 담기
    @PostMapping
    public String addToCart(@RequestBody Map<String, Object> data) {
        String memberName = (String) data.get("memberName");
        Long productId = Long.valueOf(data.get("productId").toString());

        // [중복 체크] 이미 담겨있는지 확인
        if (cartRepository.existsByMemberNameAndProductId(memberName, productId)) {
            return "DUPLICATE"; // "이미 있어!" 라는 신호를 보냄
        }

        // 없다면 저장 진행
        CartItem item = new CartItem();
        item.setMemberName(memberName);
        item.setProductId(productId);
        item.setProductName((String) data.get("productName"));
        item.setPrice(Integer.parseInt(data.get("price").toString()));
        item.setImageUrl((String) data.get("imageUrl"));

        cartRepository.save(item);
        return "SUCCESS"; // "성공했어!"
    }

    // 2. 내 장바구니 목록 조회
    @GetMapping
    public List<CartItem> getMyCart(@RequestParam String memberName) {
        return cartRepository.findByMemberNameOrderByCreateDateDesc(memberName);
    }

    // 3. 장바구니 아이템 삭제 (X 버튼)
    @DeleteMapping("/{id}")
    public void deleteCartItem(@PathVariable Long id) {
        cartRepository.deleteById(id);
    }
}
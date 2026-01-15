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
        CartItem item = new CartItem();
        item.setMemberName((String) data.get("memberName"));
        item.setProductId(Long.valueOf(data.get("productId").toString()));
        item.setProductName((String) data.get("productName"));
        item.setPrice(Integer.parseInt(data.get("price").toString()));
        item.setImageUrl((String) data.get("imageUrl"));

        cartRepository.save(item);
        return "장바구니 담기 성공";
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
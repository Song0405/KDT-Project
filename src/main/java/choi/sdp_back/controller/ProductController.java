package choi.sdp_back.controller;

import choi.sdp_back.entity.Product;
import choi.sdp_back.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // ✨ 405 에러 및 CORS 해결 필수 설정
public class ProductController {

    private final ProductRepository productRepository;

    // 제품 목록 조회 (페이지네이션 적용)
    @GetMapping
    public ResponseEntity<Page<Product>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "latest") String sort
    ) {
        Sort sortObj = sort.equals("low") ? Sort.by("price").ascending() :
                sort.equals("high") ? Sort.by("price").descending() :
                        sort.equals("name") ? Sort.by("name").ascending() :
                                Sort.by("id").descending();

        Pageable pageable = PageRequest.of(page, size, sortObj);
        return ResponseEntity.ok(productRepository.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
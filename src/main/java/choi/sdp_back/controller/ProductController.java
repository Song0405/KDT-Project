package choi.sdp_back.controller;

import choi.sdp_back.dto.ProductDto;
import choi.sdp_back.dto.ProductResponseDto;
import choi.sdp_back.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // ⭐ 1. 이게 있어야 리액트가 접속 가능!
public class ProductController {

    private final ProductService productService;

    // 1. 전체 상품 조회
    @GetMapping // ⭐ 2. 이게 빠져 있어서 작동을 안 했던 겁니다! (기본 주소로 매핑)
    public ResponseEntity<List<ProductDto>> getAllProducts(
            @RequestParam(value = "sort", required = false) String sort) {

        // 서비스한테 "이 정렬 순서대로 가져와줘" 라고 시킴
        return ResponseEntity.ok(productService.getAllProducts(sort));
    }

    // ⭐ [추가됨] 검색 API (/api/products/search?keyword=...)
    @GetMapping("/search")
    public ResponseEntity<List<ProductDto>> searchProducts(@RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(productService.searchProducts(keyword));
    }

    // 2. 상품 상세 조회 (ID는 숫자만 받음)
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDto> getProductDetail(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductDetail(id));
    }

    // 3. 상품 등록
    @PostMapping
    public ResponseEntity<ProductDto> createProduct(
            @RequestPart("product") ProductDto productDto,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) throws IOException {
        return ResponseEntity.ok(productService.createProduct(productDto, imageFile));
    }

    // 4. 상품 수정
    @PutMapping("/{id}")
    public ResponseEntity<ProductDto> updateProduct(
            @PathVariable Long id,
            @RequestPart("product") ProductDto productDto,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) throws IOException {
        return ResponseEntity.ok(productService.updateProduct(id, productDto, imageFile));
    }

    // 5. 상품 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok().build();
    }
}
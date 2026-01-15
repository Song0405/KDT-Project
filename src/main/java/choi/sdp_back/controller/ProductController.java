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
public class ProductController {

    private final ProductService productService;

    // 1. 전체 상품 조회
    // (기존의 getProductsByUsage, searchProducts 로직을 모두 이걸로 통합했습니다)
    // 프론트엔드에서 필터링(게이밍/오피스 등)을 수행하므로, 백엔드는 그냥 다 줍니다.
    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    // 2. 상품 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDto> getProductDetail(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductDetail(id));
    }

    // 3. 상품 등록 (이미지 포함)
    @PostMapping
    public ResponseEntity<ProductDto> createProduct(
            @RequestPart("product") ProductDto productDto,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) throws IOException {
        return ResponseEntity.ok(productService.createProduct(productDto, imageFile));
    }

    // 4. 상품 수정 (이미지 포함)
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
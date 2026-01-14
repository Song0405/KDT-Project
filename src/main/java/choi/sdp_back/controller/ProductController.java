package choi.sdp_back.controller;

import choi.sdp_back.dto.ProductDto;
import choi.sdp_back.service.ProductService;
import choi.sdp_back.dto.ProductResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductDto>> getProducts(@RequestParam(value = "usage", required = false) String usage) {
        System.out.println("요청된 카테고리: " + usage); // 로그 확인용
        return ResponseEntity.ok(productService.getProductsByUsage(usage));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDto> getProductDetail(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductDetail(id));
    }

    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<ProductDto> createProduct(
            @RequestPart("product") ProductDto productDto,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {

        // 🔍 [범인 검거용 로그 1] 컨트롤러에 도착한 데이터 확인
        System.out.println("=== [POST] 제품 등록 요청 도착 ===");
        System.out.println("제품명: " + productDto.getName());
        System.out.println("카테고리: " + productDto.getCategory()); // ⭐ 여기서 null이 찍히면 React 문제입니다.

        return ResponseEntity.ok(productService.createProduct(productDto, image));
    }

    @PutMapping(value = "/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<ProductDto> updateProduct(
            @PathVariable Long id,
            @RequestPart("product") ProductDto productDto,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {

        // 🔍 [범인 검거용 로그 2] 수정 요청 데이터 확인
        System.out.println("=== [PUT] 제품 수정 요청 도착 (ID: " + id + ") ===");
        System.out.println("수정될 카테고리: " + productDto.getCategory()); // ⭐ 여기서 null이면 React 수정 로직 문제.

        return ResponseEntity.ok(productService.updateProduct(id, productDto, image));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/search")
    public ResponseEntity<List<ProductDto>> searchProducts(@RequestParam("keyword") String keyword) {
        System.out.println("🔍 검색 요청 들어옴: " + keyword);
        return ResponseEntity.ok(productService.searchProducts(keyword));
    }
}
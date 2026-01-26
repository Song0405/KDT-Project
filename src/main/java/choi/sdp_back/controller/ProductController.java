package choi.sdp_back.controller;

import choi.sdp_back.entity.Product;
import choi.sdp_back.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ProductController {

    private final ProductRepository productRepository;

    // 1. 제품 목록 조회
    @GetMapping
    public ResponseEntity<Object> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(defaultValue = "latest") String sort
    ) {
        Sort sortObj = sort.equals("low") ? Sort.by("price").ascending() :
                sort.equals("high") ? Sort.by("price").descending() :
                        sort.equals("name") ? Sort.by("name").ascending() :
                                Sort.by("id").descending();

        Pageable pageable = PageRequest.of(page, size, sortObj);
        Page<Product> productPage = productRepository.findAll(pageable);
        return ResponseEntity.ok(productPage);
    }

    // 제품 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // =====================================================================
    // 2. [수정됨] 제품 등록 (C:/uploads 에 저장)
    // =====================================================================
    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<Product> createProduct(
            @RequestPart("product") Product product,
            @RequestPart(value = "image", required = false) MultipartFile file
    ) throws IOException { // IOException 처리 추가

        // C드라이브에 저장하는 로직
        if (file != null && !file.isEmpty()) {
            String fileName = saveFileToLocal(file); // 아래 함수 호출
            product.setImageFileName(fileName); // 파일명만 DB에 저장 (예: abc.jpg)
        }

        Product savedProduct = productRepository.save(product);
        return ResponseEntity.ok(savedProduct);
    }

    // =====================================================================
    // 3. [수정됨] 제품 수정 (C:/uploads 에 저장)
    // =====================================================================
    @PutMapping(value = "/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<Product> updateProduct(
            @PathVariable Long id,
            @RequestPart("product") Product productDetails,
            @RequestPart(value = "image", required = false) MultipartFile file
    ) {
        return productRepository.findById(id)
                .map(product -> {
                    product.setName(productDetails.getName());
                    product.setDescription(productDetails.getDescription());
                    product.setPrice(productDetails.getPrice());
                    product.setCategory(productDetails.getCategory());
                    product.setUsage(productDetails.getUsage());

                    // 새 이미지가 오면 저장하고 덮어쓰기
                    if (file != null && !file.isEmpty()) {
                        try {
                            String fileName = saveFileToLocal(file);
                            product.setImageFileName(fileName);
                        } catch (IOException e) {
                            throw new RuntimeException("파일 저장 실패", e);
                        }
                    }
                    return ResponseEntity.ok(productRepository.save(product));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. 제품 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        if (productRepository.existsById(id)) {
            productRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // =====================================================================
    // 📂 [핵심] 실제 파일을 C:/uploads 에 저장하는 함수
    // =====================================================================
    private String saveFileToLocal(MultipartFile file) throws IOException {
        // 1. 저장할 경로 설정
        String uploadDir = "C:/uploads/";
        File dir = new File(uploadDir);

        // 폴더 없으면 만들기
        if (!dir.exists()) {
            dir.mkdirs();
        }

        // 2. 파일명 중복 방지를 위해 UUID 붙이기
        String originalFilename = file.getOriginalFilename();
        String savedFilename = UUID.randomUUID() + "_" + originalFilename;

        // 3. 실제 파일 저장 (C:/uploads/랜덤문자_파일명.jpg)
        File saveFile = new File(uploadDir + savedFilename);
        file.transferTo(saveFile);

        return savedFilename; // DB에는 파일 이름만 리턴
    }
}
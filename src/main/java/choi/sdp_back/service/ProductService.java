package choi.sdp_back.service;

import choi.sdp_back.dto.ProductDto;
import choi.sdp_back.dto.ProductResponseDto;
import choi.sdp_back.entity.Product;
import choi.sdp_back.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    // ⚠️ 에러 방지를 위해 AI 관련 의존성은 주석 처리합니다.
    // private final ProductRecommendationRepository productRecommendationRepository;
    // private final AiService aiService;

    private final String uploadPath = "C:/sdp_uploads/";

    @Transactional(readOnly = true)
    public List<ProductDto> getProductsByUsage(String usage) {
        List<Product> products;

        // "ALL"이거나 비어있으면 -> 전체 조회
        if (usage == null || usage.equals("ALL")) {
            products = productRepository.findAll();
        } else {
            // ⚠️ 원래 findByUsageType 이었지만, 엔티티에서 필드를 지웠으므로
            // 에러를 막기 위해 임시로 '전체 조회'로 바꿉니다. (나중에 기능 추가 시 복구)
            products = productRepository.findAll();
        }

        return products.stream().map(ProductDto::from).toList();
    }

    public List<ProductDto> searchProducts(String keyword) {
        List<Product> products = productRepository.findByNameContainingIgnoreCase(keyword);

        return products.stream()
                .map(product -> ProductDto.builder()
                        .id(product.getId())
                        .name(product.getName())
                        .price(product.getPrice())
                        .description(product.getDescription())
                        .category(product.getCategory())
                        .imageFileName(product.getImageFileName())
                        .build())
                .toList();
    }

    // 1. 제품 생성 메서드
    @Transactional
    public ProductDto createProduct(ProductDto productDto, MultipartFile imageFile) throws IOException {
        String savedFileName = "";
        if (imageFile != null && !imageFile.isEmpty()) {
            savedFileName = saveImage(imageFile);
        }

        Product product = new Product();
        product.setName(productDto.getName());
        product.setDescription(productDto.getDescription());
        product.setPrice(productDto.getPrice());
        product.setImageFileName(savedFileName);
        product.setCategory(productDto.getCategory());

        Product savedProduct = productRepository.save(product);

        // ⚠️ AI 추천 로직 (에러 방지 주석 처리)
        /*
        try {
             // ... AI 코드 ...
        } catch (Exception e) {
            System.out.println("⚠️ AI 추천 실패: " + e.getMessage());
        }
        */

        return convertToDto(savedProduct);
    }

    // 2. 제품 수정 메서드 (이미지 수정 기능 포함!)
    @Transactional
    public ProductDto updateProduct(Long id, ProductDto productDto, MultipartFile imageFile) throws IOException {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ID를 찾을 수 없음: " + id));

        product.setName(productDto.getName());
        product.setDescription(productDto.getDescription());
        product.setPrice(productDto.getPrice());
        product.setCategory(productDto.getCategory());

        // ✨ [이미지 수정 로직] 여기가 살아있어야 사진이 바뀝니다!
        if (imageFile != null && !imageFile.isEmpty()) {
            product.setImageFileName(saveImage(imageFile));
        }

        Product savedProduct = productRepository.save(product);

        // ⚠️ AI 추천 갱신 로직 (에러 방지 주석 처리)
        /*
        try {
            // ... AI 갱신 코드 ...
        } catch (Exception e) {
            System.out.println("⚠️ AI 추천 갱신 실패: " + e.getMessage());
        }
        */

        return convertToDto(savedProduct);
    }

    private String saveImage(MultipartFile imageFile) throws IOException {
        File uploadDir = new File(uploadPath);
        if (!uploadDir.exists()) uploadDir.mkdirs();
        String uuid = UUID.randomUUID().toString();
        String originalName = imageFile.getOriginalFilename();
        String extension = originalName != null && originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf("."))
                : ".jpg";
        String savedName = uuid + extension;
        imageFile.transferTo(new File(uploadPath, savedName));
        return savedName;
    }

    @Transactional
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    // 3. DTO 변환 메서드
    private ProductDto convertToDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setImageFileName(product.getImageFileName());
        dto.setPrice(product.getPrice());
        dto.setCategory(product.getCategory());
        return dto;
    }

    // 4. 상세 조회
    @Transactional(readOnly = true)
    public ProductResponseDto getProductDetail(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 상품이 없습니다. id=" + id));

        // ⚠️ AI 추천 목록 가져오기는 에러가 나므로 잠시 제외하고 제품 정보만 리턴
        return ProductResponseDto.builder()
                .id(product.getId())
                .name(product.getName())
                .price(product.getPrice())
                .description(product.getDescription())
                .imageUrl(product.getImageFileName())
                .category(product.getCategory())
                .build();
    }
}
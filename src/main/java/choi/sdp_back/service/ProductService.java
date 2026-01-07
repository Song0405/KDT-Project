package choi.sdp_back.service;

import choi.sdp_back.dto.ProductDto;
import choi.sdp_back.dto.ProductResponseDto; // 추가됨
import choi.sdp_back.entity.Product;
import choi.sdp_back.entity.ProductRecommendation; // 추가됨
import choi.sdp_back.repository.ProductRecommendationRepository; // 추가됨
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
    // ▼▼▼ AI 관련 의존성 주입
    private final ProductRecommendationRepository productRecommendationRepository;
    private final AiService aiService;

    private final String uploadPath = "C:/sdp_uploads/";

    @Transactional(readOnly = true)
    public List<ProductDto> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 제품 생성 + AI 분석 로직 복구
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

        // 1. 상품 저장
        Product savedProduct = productRepository.save(product);

        // ▼▼▼ AI 호출 로직
        try {
            String aiResult = aiService.getRecommendation(savedProduct.getName(), savedProduct.getDescription());

            // 결과 파싱 (형식: "추천템 : 이유")
            String[] parts = aiResult.split(":");
            String targetName = parts.length > 0 ? parts[0].trim() : "추천 아이템";
            String reason = parts.length > 1 ? parts[1].trim() : aiResult;

            ProductRecommendation recommendation = new ProductRecommendation(savedProduct, targetName, reason);
            productRecommendationRepository.save(recommendation);
            System.out.println("✅ AI 추천 생성 완료: " + targetName);

        } catch (Exception e) {
            System.out.println("⚠️ AI 추천 생성 실패 (상품만 등록됨): " + e.getMessage());
        }

        return convertToDto(savedProduct);
    }

    @Transactional
    public ProductDto updateProduct(Long id, ProductDto productDto, MultipartFile imageFile) throws IOException {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ID를 찾을 수 없음: " + id));

        product.setName(productDto.getName());
        product.setDescription(productDto.getDescription());
        product.setPrice(productDto.getPrice());

        if (imageFile != null && !imageFile.isEmpty()) {
            product.setImageFileName(saveImage(imageFile));
        }

        return convertToDto(productRepository.save(product));
    }

    private String saveImage(MultipartFile imageFile) throws IOException {
        File uploadDir = new File(uploadPath);
        if (!uploadDir.exists()) uploadDir.mkdirs();

        String uuid = UUID.randomUUID().toString();
        String originalName = imageFile.getOriginalFilename();
        String extension = originalName.substring(originalName.lastIndexOf("."));
        String savedName = uuid + extension;

        imageFile.transferTo(new File(uploadPath, savedName));
        return savedName;
    }

    @Transactional
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    private ProductDto convertToDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setImageFileName(product.getImageFileName());
        dto.setPrice(product.getPrice());
        return dto;
    }

    // ▼▼▼  상세 조회 메서드
    @Transactional(readOnly = true)
    public ProductResponseDto getProductDetail(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 상품이 없습니다. id=" + id));

        List<ProductRecommendation> recommendations = productRecommendationRepository.findByProductId(id);

        List<ProductResponseDto.AiRecommendation> recDtos = recommendations.stream()
                .map(rec -> ProductResponseDto.AiRecommendation.builder()
                        .targetProductName(rec.getTargetProductName())
                        .reason(rec.getReason())
                        .build())
                .collect(Collectors.toList());

        return ProductResponseDto.builder()
                .id(product.getId())
                .name(product.getName())
                .price(product.getPrice())
                .description(product.getDescription())
                .imageUrl(product.getImageFileName())
                .recommendations(recDtos)
                .build();
    }
}
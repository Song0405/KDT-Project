package choi.sdp_back.service;

import choi.sdp_back.dto.ProductDto;
import choi.sdp_back.dto.ProductResponseDto;
import choi.sdp_back.entity.Product;
import choi.sdp_back.entity.ProductRecommendation;
import choi.sdp_back.repository.ProductRecommendationRepository;
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
    private final ProductRecommendationRepository productRecommendationRepository;
    private final AiService aiService;

    private final String uploadPath = "C:/sdp_uploads/";

    @Transactional(readOnly = true)
    public List<ProductDto> getProductsByUsage(String usage) {
        List<Product> products;

        // "ALL"이거나 비어있으면 -> 전체 조회
        if (usage == null || usage.equals("ALL")) {
            products = productRepository.findAll();
        } else {
            // 아니면 -> 해당 용도만 조회 (GAMING, OFFICE 등)
            products = productRepository.findByUsageType(usage);
        }

        return products.stream().map(ProductDto::from).toList();
    }
    public List<ProductDto> searchProducts(String keyword) {
        // 1. 아까 만든 리포지토리 메서드로 검색 결과를 가져옴
        List<Product> products = productRepository.findByNameContainingIgnoreCase(keyword);

        // 2. Entity(원본)를 DTO(포장지)로 변환해서 반환
        // (기존 getAllProducts 메서드에 있는 변환 로직과 똑같이 맞추면 됩니다!)
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

    // 1. 제품 생성 메서드 (Category 추가됨)
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
        // ⭐ 추가: DTO에서 받은 카테고리를 엔티티에 저장
        product.setCategory(productDto.getCategory());

        Product savedProduct = productRepository.save(product);

        // AI 추천 로직 (기존과 동일)
        try {
            List<String> allProductNames = productRepository.findAll().stream()
                    .map(Product::getName)
                    .filter(name -> !name.equals(savedProduct.getName()))
                    .collect(Collectors.toList());

            if (!allProductNames.isEmpty()) {
                String aiResult = aiService.getRecommendation(
                        savedProduct.getName(),
                        savedProduct.getDescription(),
                        allProductNames
                );
                String[] parts = aiResult.split(":");
                String targetName = parts.length > 0 ? parts[0].trim() : "추천 아이템";
                String reason = parts.length > 1 ? parts[1].trim() : "이유 없음";

                ProductRecommendation recommendation = new ProductRecommendation(savedProduct, targetName, reason);
                productRecommendationRepository.save(recommendation);
            }
        } catch (Exception e) {
            System.out.println("⚠️ AI 추천 실패: " + e.getMessage());
        }

        return convertToDto(savedProduct);
    }

    // 2. 제품 수정 메서드 (Category 추가됨)
    @Transactional
    public ProductDto updateProduct(Long id, ProductDto productDto, MultipartFile imageFile) throws IOException {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ID를 찾을 수 없음: " + id));

        product.setName(productDto.getName());
        product.setDescription(productDto.getDescription());
        product.setPrice(productDto.getPrice());
        // ⭐ 추가: 수정한 카테고리 정보 반영
        product.setCategory(productDto.getCategory());

        if (imageFile != null && !imageFile.isEmpty()) {
            product.setImageFileName(saveImage(imageFile));
        }

        Product savedProduct = productRepository.save(product);

        // AI 추천 갱신 로직 (기존과 동일)
        try {
            productRecommendationRepository.deleteByProductId(savedProduct.getId());
            List<String> allProductNames = productRepository.findAll().stream()
                    .map(Product::getName)
                    .filter(name -> !name.equals(savedProduct.getName()))
                    .collect(Collectors.toList());

            if (!allProductNames.isEmpty()) {
                String aiResult = aiService.getRecommendation(
                        savedProduct.getName(),
                        savedProduct.getDescription(),
                        allProductNames
                );
                String[] parts = aiResult.split(":");
                String targetName = parts.length > 0 ? parts[0].trim() : "추천 아이템";
                String reason = parts.length > 1 ? parts[1].trim() : aiResult;

                ProductRecommendation recommendation = new ProductRecommendation(savedProduct, targetName, reason);
                productRecommendationRepository.save(recommendation);
            }
        } catch (Exception e) {
            System.out.println("⚠️ AI 추천 갱신 실패: " + e.getMessage());
        }

        return convertToDto(savedProduct);
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

    // 3. DTO 변환 메서드 (Category 추가됨)
    private ProductDto convertToDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setImageFileName(product.getImageFileName());
        dto.setPrice(product.getPrice());
        // ⭐ 추가: DB에서 가져온 카테고리를 DTO에 담아서 프론트로 전달
        dto.setCategory(product.getCategory());
        return dto;
    }

    // 4. 상세 조회 (ProductResponseDto에도 category가 있다면 추가 권장)
    @Transactional(readOnly = true)
    public ProductResponseDto getProductDetail(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 상품이 없습니다. id=" + id));

        List<ProductRecommendation> recommendations = productRecommendationRepository.findByProductId(id);

        List<ProductResponseDto.AiRecommendation> recDtos = recommendations.stream()
                .map(rec -> {
                    Long targetId = productRepository.findByName(rec.getTargetProductName())
                            .map(Product::getId)
                            .orElse(null);

                    return ProductResponseDto.AiRecommendation.builder()
                            .targetProductName(rec.getTargetProductName())
                            .reason(rec.getReason())
                            .targetProductId(targetId)
                            .build();
                })
                .collect(Collectors.toList());

        return ProductResponseDto.builder()
                .id(product.getId())
                .name(product.getName())
                .price(product.getPrice())
                .description(product.getDescription())
                .imageUrl(product.getImageFileName())
                // .category(product.getCategory()) // ⭐ ProductResponseDto에 필드가 있다면 주석 해제
                .recommendations(recDtos)
                .build();
    }
}
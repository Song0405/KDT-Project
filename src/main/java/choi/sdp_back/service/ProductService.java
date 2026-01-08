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
    //  AI 추천 저장소와 AI 서비스 주입
    private final ProductRecommendationRepository productRecommendationRepository;
    private final AiService aiService;

    private final String uploadPath = "C:/sdp_uploads/";

    @Transactional(readOnly = true)
    public List<ProductDto> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    //  제품 생성 메서드
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

        // 1. 내 상품 저장
        Product savedProduct = productRepository.save(product);

        // 2. AI 추천 로직 실행
        try {
            // DB에서 다른 상품들 이름만 다 가져오기
            List<String> allProductNames = productRepository.findAll().stream()
                    .map(Product::getName)
                    .filter(name -> !name.equals(savedProduct.getName())) // 내 이름은 뺌
                    .collect(Collectors.toList());

            if (!allProductNames.isEmpty()) {
                // AI에게 "이 목록에서 골라줘" 요청
                String aiResult = aiService.getRecommendation(
                        savedProduct.getName(),
                        savedProduct.getDescription(),
                        allProductNames
                );

                // 로그 찍어서 확인 (중요!)
                System.out.println("🤖 AI 응답: " + aiResult);

                // 결과 파싱 ("제품명 : 이유" 형태)
                String[] parts = aiResult.split(":");
                String targetName = parts.length > 0 ? parts[0].trim() : "추천 아이템";
                String reason = parts.length > 1 ? parts[1].trim() : "이유 없음";

                ProductRecommendation recommendation = new ProductRecommendation(savedProduct, targetName, reason);
                productRecommendationRepository.save(recommendation);
            } else {
                System.out.println("⚠️ DB에 추천할 다른 상품이 하나도 없습니다.");
            }

        } catch (Exception e) {
            System.out.println("⚠️ AI 추천 실패: " + e.getMessage());
        }

        return convertToDto(savedProduct);
    }

    @Transactional
    public ProductDto updateProduct(Long id, ProductDto productDto, MultipartFile imageFile) throws IOException {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ID를 찾을 수 없음: " + id));

        // 1. 정보 수정 (이름, 설명, 가격 등)
        product.setName(productDto.getName());
        product.setDescription(productDto.getDescription());
        product.setPrice(productDto.getPrice());

        if (imageFile != null && !imageFile.isEmpty()) {
            product.setImageFileName(saveImage(imageFile));
        }

        // 2. 저장 (먼저 저장해야 바뀐 정보가 확정됨)
        Product savedProduct = productRepository.save(product);

        // 수정된 정보로 AI 추천 다시 받기
        try {
            // (1) 기존 추천 삭제
            productRecommendationRepository.deleteByProductId(savedProduct.getId());

            // (2) 다른 상품 목록 가져오기 (비교군)
            List<String> allProductNames = productRepository.findAll().stream()
                    .map(Product::getName)
                    .filter(name -> !name.equals(savedProduct.getName()))
                    .collect(Collectors.toList());

            if (!allProductNames.isEmpty()) {
                // (3) AI 재호출
                String aiResult = aiService.getRecommendation(
                        savedProduct.getName(),
                        savedProduct.getDescription(),
                        allProductNames
                );

                // (4) 결과 파싱 및 저장
                String[] parts = aiResult.split(":");
                String targetName = parts.length > 0 ? parts[0].trim() : "추천 아이템";
                String reason = parts.length > 1 ? parts[1].trim() : aiResult;

                ProductRecommendation recommendation = new ProductRecommendation(savedProduct, targetName, reason);
                productRecommendationRepository.save(recommendation);

                System.out.println("✅ (수정됨) AI 추천 갱신 완료: " + targetName);
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

    private ProductDto convertToDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setImageFileName(product.getImageFileName());
        dto.setPrice(product.getPrice());
        return dto;
    }

    // 상세 조회 (AI 추천 포함)
    @Transactional(readOnly = true)
    public ProductResponseDto getProductDetail(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 상품이 없습니다. id=" + id));

        List<ProductRecommendation> recommendations = productRecommendationRepository.findByProductId(id);

        List<ProductResponseDto.AiRecommendation> recDtos = recommendations.stream()
                .map(rec -> {
                    //  이름으로 실제 제품 ID 찾기
                    Long targetId = productRepository.findByName(rec.getTargetProductName())
                            .map(Product::getId)
                            .orElse(null); // 만약 제품이 삭제됐다면 null

                    return ProductResponseDto.AiRecommendation.builder()
                            .targetProductName(rec.getTargetProductName())
                            .reason(rec.getReason())
                            .targetProductId(targetId) //  ID 넣어주기
                            .build();
                })
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
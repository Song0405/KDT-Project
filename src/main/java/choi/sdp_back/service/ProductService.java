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
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductRecommendationRepository recommendationRepository;
    private final AiService aiService;

    private final String uploadPath = "C:/uploads/";

    // 1. 전체 조회
    @Transactional(readOnly = true)
    public List<ProductDto> getAllProducts() {
        return productRepository.findAll().stream().map(ProductDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductDto> searchProducts(String keyword) {
        // Repository에 findByNameContainingIgnoreCase 메서드가 있어야 함 (이미 있음)
        return productRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(ProductDto::from)
                .toList();
    }

    // 2. 제품 생성
    @Transactional
    public ProductDto createProduct(ProductDto productDto, MultipartFile imageFile) throws IOException {
        String savedFileName = "";
        if (imageFile != null && !imageFile.isEmpty()) savedFileName = saveImage(imageFile);

        Product product = new Product();
        product.setName(productDto.getName());
        product.setDescription(productDto.getDescription());
        product.setPrice(productDto.getPrice());
        product.setImageFileName(savedFileName);
        product.setCategory(productDto.getCategory());
        product.setUsage(productDto.getUsage());

        Product savedProduct = productRepository.save(product);
        generateAndSaveRecommendations(savedProduct);
        return convertToDto(savedProduct);
    }

    // 3. 제품 수정
    @Transactional
    public ProductDto updateProduct(Long id, ProductDto productDto, MultipartFile imageFile) throws IOException {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ID를 찾을 수 없음: " + id));

        product.setName(productDto.getName());
        product.setDescription(productDto.getDescription());
        product.setPrice(productDto.getPrice());
        product.setCategory(productDto.getCategory());
        product.setUsage(productDto.getUsage());

        if (imageFile != null && !imageFile.isEmpty()) product.setImageFileName(saveImage(imageFile));

        Product savedProduct = productRepository.save(product);

        recommendationRepository.deleteByProductId(savedProduct.getId());
        recommendationRepository.flush();
        generateAndSaveRecommendations(savedProduct);

        return convertToDto(savedProduct);
    }

    private void generateAndSaveRecommendations(Product currentProduct) {
        List<Product> candidates = productRepository.findAll().stream()
                .filter(p -> p.getUsage() != null && p.getUsage().equals(currentProduct.getUsage()))
                .filter(p -> !p.getId().equals(currentProduct.getId()))
                .toList();

        if (candidates.isEmpty()) return;

        List<Map<String, Object>> aiResults = aiService.getRecommendationsFromPython(currentProduct, candidates);

        for (Map<String, Object> res : aiResults) {
            String reason = (String) res.get("reason");
            String targetName = (String) res.get("targetProductName");
            Long targetId = ((Number) res.get("targetProductId")).longValue();

            ProductRecommendation rec = new ProductRecommendation(currentProduct, targetName, targetId, reason);
            recommendationRepository.save(rec);
        }
    }

    private String saveImage(MultipartFile imageFile) throws IOException {
        File uploadDir = new File(uploadPath);
        if (!uploadDir.exists()) uploadDir.mkdirs();
        String uuid = UUID.randomUUID().toString();
        String ext = imageFile.getOriginalFilename().substring(imageFile.getOriginalFilename().lastIndexOf("."));
        String savedName = uuid + ext;
        imageFile.transferTo(new File(uploadPath, savedName));
        return savedName;
    }

    @Transactional
    public void deleteProduct(Long id) {
        recommendationRepository.deleteByProductId(id);
        productRepository.deleteById(id);
    }

    private ProductDto convertToDto(Product product) { return ProductDto.from(product); }

    @Transactional(readOnly = true)
    public ProductResponseDto getProductDetail(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 상품이 없습니다. id=" + id));

        ProductResponseDto dto = ProductResponseDto.from(product);
        List<ProductRecommendation> recs = recommendationRepository.findByProductId(id);
        List<ProductResponseDto.AiRecommendation> recDtos = recs.stream()
                .map(r -> new ProductResponseDto.AiRecommendation(r.getReason(), r.getTargetProductName(), r.getTargetProductId()))
                .collect(Collectors.toList());
        dto.setRecommendations(recDtos);
        return dto;
    }
}
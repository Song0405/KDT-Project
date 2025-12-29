package choi.sdp_back.service;

import choi.sdp_back.dto.ProductDto;
import choi.sdp_back.entity.Product;
import choi.sdp_back.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    /**
     * 모든 제품 정보를 조회합니다.
     * 데이터베이스에 제품이 하나도 없으면, 초기 샘플 데이터를 생성하여 저장합니다.
     */
    @Transactional
    public List<ProductDto> getAllProducts() {
        // 데이터베이스에 제품 데이터가 하나도 없을 때만 아래 코드가 실행됩니다.
        if (productRepository.count() == 0) {
            Product p1 = new Product();
            p1.setName("초고성능 서버 솔루션");
            p1.setDescription("데이터센터를 위한 최적화된 서버 솔루션입니다. 뛰어난 안정성과 확장성을 자랑하며, 대규모 트래픽도 문제없이 처리합니다.");
            p1.setPrice(15000000);
            // 👇 여기에 실제 파일 이름을 적어주세요 (예: "server_product.png")
            p1.setImageFileName("1.png");
            productRepository.save(p1);

            Product p2 = new Product();
            p2.setName("AI 기반 보안 시스템");
            p2.setDescription("인공지능으로 위협을 예측하고 차단하는 강력한 보안 솔루션. 24시간 실시간으로 시스템을 보호합니다.");
            p2.setPrice(7000000);
            // 👇 여기에 실제 파일 이름을 적어주세요 (예: "security_system.jpg")
            p2.setImageFileName("product2.jpg");
            productRepository.save(p2);

            Product p3 = new Product();
            p3.setName("클라우드 통합 관리 플랫폼");
            p3.setDescription("분산된 클라우드 자원을 한 번에 관리하는 효율적인 플랫폼. 비용 절감과 운영 효율성 증대를 동시에 달성할 수 있습니다.");
            p3.setPrice(10000000);
            // 👇 여기에 실제 파일 이름을 적어주세요 (예: "cloud_mgmt.webp")
            p3.setImageFileName("product3.jpg");
            productRepository.save(p3);
        }

        return productRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 새로운 제품을 생성합니다.
     */
    @Transactional
    public ProductDto createProduct(ProductDto productDto) {
        Product product = new Product();
        product.setName(productDto.getName());
        product.setDescription(productDto.getDescription());
        product.setImageFileName(productDto.getImageFileName());
        product.setPrice(productDto.getPrice());
        Product savedProduct = productRepository.save(product);
        return convertToDto(savedProduct);
    }

    /**
     * 기존 제품 정보를 수정합니다.
     */
    @Transactional
    public ProductDto updateProduct(Long id, ProductDto productDto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("제품 ID를 찾을 수 없습니다: " + id));
        product.setName(productDto.getName());
        product.setDescription(productDto.getDescription());
        product.setImageFileName(productDto.getImageFileName());
        product.setPrice(productDto.getPrice());
        Product updatedProduct = productRepository.save(product);
        return convertToDto(updatedProduct);
    }

    /**
     * 제품을 삭제합니다.
     */
    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new EntityNotFoundException("삭제할 제품 ID를 찾을 수 없습니다: " + id);
        }
        productRepository.deleteById(id);
    }

    /**
     * Product Entity를 ProductDto로 변환합니다.
     */
    private ProductDto convertToDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setImageFileName(product.getImageFileName());
        dto.setPrice(product.getPrice());
        return dto;
    }
}
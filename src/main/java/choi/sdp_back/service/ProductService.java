package choi.sdp_back.service;

import choi.sdp_back.dto.ProductDto;
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
    private final String uploadPath = "C:/sdp_uploads/"; // 파일 저장 경로

    @Transactional
    public List<ProductDto> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 제품 생성 및 이미지 저장
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

        return convertToDto(productRepository.save(product));
    }

    // 제품 수정 및 이미지 업데이트
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

    // 이미지 물리적 저장 보조 메서드
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
}
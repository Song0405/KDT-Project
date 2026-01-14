package choi.sdp_back.repository;

import choi.sdp_back.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByName(String name);

    List<Product> findByNameContainingIgnoreCase(String keyword);
    // 👇 용도별 조회 기능 추가 (SELECT * FROM PRODUCT WHERE USAGE_TYPE = ?)
    List<Product> findByUsageType(String usageType);
}
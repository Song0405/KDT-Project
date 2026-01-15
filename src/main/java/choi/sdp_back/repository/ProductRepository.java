package choi.sdp_back.repository;

import choi.sdp_back.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // 1. 이름으로 찾기
    Optional<Product> findByName(String name);

    // 2. 검색 기능 (키워드 포함)
    List<Product> findByNameContainingIgnoreCase(String keyword);

}
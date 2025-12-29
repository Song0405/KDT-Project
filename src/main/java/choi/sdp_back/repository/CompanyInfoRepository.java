package choi.sdp_back.repository;

import choi.sdp_back.entity.CompanyInfo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyInfoRepository extends JpaRepository<CompanyInfo, Long> {
    CompanyInfo findFirstByOrderByIdAsc();
}
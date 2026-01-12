package choi.sdp_back.repository;

import choi.sdp_back.entity.CompanyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CompanyMemberRepository extends JpaRepository<CompanyMember, String> {
    Optional<CompanyMember> findByMemberId(String memberId);
    boolean existsByMemberId(String memberId);
}
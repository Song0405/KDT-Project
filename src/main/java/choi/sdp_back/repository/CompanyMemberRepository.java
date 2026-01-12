package choi.sdp_back.repository;

import choi.sdp_back.entity.CompanyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CompanyMemberRepository extends JpaRepository<CompanyMember, String> {
    Optional<CompanyMember> findByMemberId(String memberId);
    // 기존 코드 안에 아래 2줄 추가
    Optional<CompanyMember> findByNameAndPhoneNumber(String name, String phoneNumber);
    Optional<CompanyMember> findByMemberIdAndNameAndPhoneNumber(String memberId, String name, String phoneNumber);
    boolean existsByMemberId(String memberId);
}
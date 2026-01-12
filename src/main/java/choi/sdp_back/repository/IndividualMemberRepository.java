package choi.sdp_back.repository;

import choi.sdp_back.entity.IndividualMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface IndividualMemberRepository extends JpaRepository<IndividualMember, String> {
    Optional<IndividualMember> findByMemberId(String memberId);
    // 기존 코드 안에 아래 2줄 추가
    Optional<IndividualMember> findByNameAndPhoneNumber(String name, String phoneNumber);
    Optional<IndividualMember> findByMemberIdAndNameAndPhoneNumber(String memberId, String name, String phoneNumber);
    boolean existsByMemberId(String memberId);
}
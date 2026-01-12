package choi.sdp_back.repository;

import choi.sdp_back.entity.IndividualMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface IndividualMemberRepository extends JpaRepository<IndividualMember, String> {
    Optional<IndividualMember> findByMemberId(String memberId);
    boolean existsByMemberId(String memberId);
}
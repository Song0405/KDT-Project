package choi.sdp_back.service;

import choi.sdp_back.dto.MemberJoinDto;
import choi.sdp_back.dto.MemberUpdateDto;
import choi.sdp_back.entity.CompanyMember;
import choi.sdp_back.entity.IndividualMember;
import choi.sdp_back.domain.ShopOrder; // ⭐ [추가] 주문 엔티티 (패키지 경로 확인 필요)
import choi.sdp_back.repository.CompanyMemberRepository;
import choi.sdp_back.repository.IndividualMemberRepository;
import choi.sdp_back.repository.ShopOrderRepository; // ⭐ [추가] 주문 리포지토리
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional // 데이터 변경 시 필수
public class MemberService {

    private final IndividualMemberRepository individualRepository;
    private final CompanyMemberRepository companyRepository;
    // ⭐ [추가] 주문 내역을 수정하기 위해 필요합니다.
    private final ShopOrderRepository shopOrderRepository;
    private final PasswordEncoder passwordEncoder;

    // 1. 회원가입
    public void join(MemberJoinDto dto) {
        if (individualRepository.existsByMemberId(dto.getMemberId()) ||
                companyRepository.existsByMemberId(dto.getMemberId())) {
            throw new RuntimeException("이미 사용 중인 아이디입니다.");
        }

        String encodedPwd = passwordEncoder.encode(dto.getPassword());

        if ("company".equalsIgnoreCase(dto.getType())) {
            CompanyMember company = new CompanyMember();
            company.setMemberId(dto.getMemberId());
            company.setPassword(encodedPwd);
            company.setName(dto.getName());
            company.setPhoneNumber(dto.getPhoneNumber());
            company.setEmail(dto.getEmail());
            company.setBusinessNumber(dto.getBusinessNumber());

            companyRepository.save(company);
        } else {
            IndividualMember individual = new IndividualMember();
            individual.setMemberId(dto.getMemberId());
            individual.setPassword(encodedPwd);
            individual.setName(dto.getName());
            individual.setPhoneNumber(dto.getPhoneNumber());
            individual.setEmail(dto.getEmail());
            individual.setSsn(dto.getSsn());

            individualRepository.save(individual);
        }
    }

    // 2. 로그인
    public Map<String, Object> login(String memberId, String password) {
        Optional<IndividualMember> indMember = individualRepository.findByMemberId(memberId);
        if (indMember.isPresent()) {
            IndividualMember member = indMember.get();
            if (passwordEncoder.matches(password, member.getPassword())) {
                Map<String, Object> result = new HashMap<>();
                result.put("memberId", member.getMemberId());
                result.put("name", member.getName());
                result.put("type", "individual");
                return result;
            }
        }

        Optional<CompanyMember> comMember = companyRepository.findByMemberId(memberId);
        if (comMember.isPresent()) {
            CompanyMember member = comMember.get();
            if (passwordEncoder.matches(password, member.getPassword())) {
                Map<String, Object> result = new HashMap<>();
                result.put("memberId", member.getMemberId());
                result.put("name", member.getName());
                result.put("type", "company");
                return result;
            }
        }

        throw new RuntimeException("아이디 또는 비밀번호가 일치하지 않습니다.");
    }

    // 3. 회원 정보 수정
    public void updateMember(MemberUpdateDto dto) {
        if ("individual".equalsIgnoreCase(dto.getType())) {
            IndividualMember member = individualRepository.findByMemberId(dto.getMemberId())
                    .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));

            if (!passwordEncoder.matches(dto.getCurrentPassword(), member.getPassword())) {
                throw new RuntimeException("현재 비밀번호가 일치하지 않습니다.");
            }

            member.setName(dto.getName());
            member.setPhoneNumber(dto.getPhoneNumber());
            member.setEmail(dto.getEmail());

            if (dto.getNewPassword() != null && !dto.getNewPassword().isBlank()) {
                member.setPassword(passwordEncoder.encode(dto.getNewPassword()));
            }
            individualRepository.save(member);

        } else if ("company".equalsIgnoreCase(dto.getType())) {
            CompanyMember member = companyRepository.findByMemberId(dto.getMemberId())
                    .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));

            if (!passwordEncoder.matches(dto.getCurrentPassword(), member.getPassword())) {
                throw new RuntimeException("현재 비밀번호가 일치하지 않습니다.");
            }

            member.setName(dto.getName());
            member.setPhoneNumber(dto.getPhoneNumber());
            member.setEmail(dto.getEmail());

            if (dto.getNewPassword() != null && !dto.getNewPassword().isBlank()) {
                member.setPassword(passwordEncoder.encode(dto.getNewPassword()));
            }
            companyRepository.save(member);
        }
    }

    // ⭐ [핵심 수정] 4. 회원 탈퇴 (주문 내역 보존 로직 추가)
    public void withdrawMember(String memberId, String currentPassword, String type) {

        // 유니크한 변경 ID 생성 (예: tmdxo0527(탈퇴)_20260114_1430)
        String timeStamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmm"));
        String withdrawnId = memberId + "(탈퇴)_" + timeStamp;

        if ("individual".equalsIgnoreCase(type)) {
            IndividualMember member = individualRepository.findByMemberId(memberId)
                    .orElseThrow(() -> new RuntimeException("회원 정보 없음"));

            if (!passwordEncoder.matches(currentPassword, member.getPassword())) {
                throw new RuntimeException("비밀번호가 틀려 탈퇴할 수 없습니다.");
            }

            // (1) 이 회원의 모든 주문을 찾아서 ID 변경
            // ※ ShopOrderRepository에 List<ShopOrder> findAllByMemberId(String memberId); 메소드가 있어야 합니다.
            List<ShopOrder> orders = shopOrderRepository.findAllByMemberId(memberId);
            for (ShopOrder order : orders) {
                order.setMemberId(withdrawnId);
                // JPA Dirty Checking에 의해 자동 업데이트 되지만, 명시적으로 보여드립니다.
            }

            // (2) 회원 삭제
            individualRepository.delete(member);

        } else if ("company".equalsIgnoreCase(type)) {
            CompanyMember member = companyRepository.findByMemberId(memberId)
                    .orElseThrow(() -> new RuntimeException("회원 정보 없음"));

            if (!passwordEncoder.matches(currentPassword, member.getPassword())) {
                throw new RuntimeException("비밀번호가 틀려 탈퇴할 수 없습니다.");
            }

            // (1) 기업 회원 주문 내역도 마찬가지로 처리
            List<ShopOrder> orders = shopOrderRepository.findAllByMemberId(memberId);
            for (ShopOrder order : orders) {
                order.setMemberId(withdrawnId);
            }

            // (2) 회원 삭제
            companyRepository.delete(member);
        }
    }

    // 5. 내 정보 조회
    public Map<String, Object> getMemberInfo(String memberId, String type) {
        Map<String, Object> result = new HashMap<>();

        if ("individual".equalsIgnoreCase(type)) {
            IndividualMember member = individualRepository.findByMemberId(memberId)
                    .orElseThrow(() -> new RuntimeException("회원 정보 없음"));

            result.put("memberId", member.getMemberId());
            result.put("name", member.getName());
            result.put("phoneNumber", member.getPhoneNumber());
            result.put("email", member.getEmail());
            result.put("type", "individual");

        } else {
            CompanyMember member = companyRepository.findByMemberId(memberId)
                    .orElseThrow(() -> new RuntimeException("회원 정보 없음"));

            result.put("memberId", member.getMemberId());
            result.put("name", member.getName());
            result.put("phoneNumber", member.getPhoneNumber());
            result.put("email", member.getEmail());
            result.put("businessNumber", member.getBusinessNumber());
            result.put("type", "company");
        }
        return result;
    }

    // 6. 아이디 찾기
    public String findMemberId(String name, String phoneNumber) {
        Optional<IndividualMember> indMember = individualRepository.findByNameAndPhoneNumber(name, phoneNumber);
        if (indMember.isPresent()) {
            return indMember.get().getMemberId();
        }

        Optional<CompanyMember> comMember = companyRepository.findByNameAndPhoneNumber(name, phoneNumber);
        if (comMember.isPresent()) {
            return comMember.get().getMemberId();
        }

        throw new RuntimeException("일치하는 회원 정보가 없습니다.");
    }

    // 7. 비밀번호 재설정
    public void resetPassword(String memberId, String name, String phoneNumber, String newPassword) {
        String encodedPwd = passwordEncoder.encode(newPassword);

        Optional<IndividualMember> indMember = individualRepository.findByMemberIdAndNameAndPhoneNumber(memberId, name, phoneNumber);
        if (indMember.isPresent()) {
            IndividualMember member = indMember.get();
            member.setPassword(encodedPwd);
            individualRepository.save(member);
            return;
        }

        Optional<CompanyMember> comMember = companyRepository.findByMemberIdAndNameAndPhoneNumber(memberId, name, phoneNumber);
        if (comMember.isPresent()) {
            CompanyMember member = comMember.get();
            member.setPassword(encodedPwd);
            companyRepository.save(member);
            return;
        }

        throw new RuntimeException("입력하신 정보와 일치하는 회원이 없습니다.");
    }
}
package choi.sdp_back.service;

import choi.sdp_back.dto.MemberJoinDto;
import choi.sdp_back.dto.MemberUpdateDto;
import choi.sdp_back.entity.CompanyMember;
import choi.sdp_back.entity.IndividualMember;
import choi.sdp_back.repository.CompanyMemberRepository;
import choi.sdp_back.repository.IndividualMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional // 중요: 데이터 변경 시 필수
public class MemberService {

    private final IndividualMemberRepository individualRepository;
    private final CompanyMemberRepository companyRepository;
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
                result.put("memberId", member.getMemberId()); // 프론트에서 쓰기 위해 ID 추가
                result.put("name", member.getName());
                result.put("type", "individual"); // 소문자로 통일 권장
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

    // 3. 회원 정보 수정 (비밀번호 포함)
    public void updateMember(MemberUpdateDto dto) {
        // [개인 회원 수정]
        if ("individual".equalsIgnoreCase(dto.getType())) {
            IndividualMember member = individualRepository.findByMemberId(dto.getMemberId())
                    .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));

            // 현재 비밀번호 확인
            if (!passwordEncoder.matches(dto.getCurrentPassword(), member.getPassword())) {
                throw new RuntimeException("현재 비밀번호가 일치하지 않습니다.");
            }

            // 정보 수정 (이름, 전화번호, 이메일)
            member.setName(dto.getName());
            member.setPhoneNumber(dto.getPhoneNumber());
            member.setEmail(dto.getEmail());

            // 새 비밀번호가 입력되었다면 변경
            if (dto.getNewPassword() != null && !dto.getNewPassword().isBlank()) {
                member.setPassword(passwordEncoder.encode(dto.getNewPassword()));
            }
            individualRepository.save(member); // 명시적 저장

        }
        // [기업 회원 수정]
        else if ("company".equalsIgnoreCase(dto.getType())) {
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

    // 4. 회원 탈퇴
    public void withdrawMember(String memberId, String currentPassword, String type) {
        if ("individual".equalsIgnoreCase(type)) {
            IndividualMember member = individualRepository.findByMemberId(memberId)
                    .orElseThrow(() -> new RuntimeException("회원 정보 없음"));

            if (!passwordEncoder.matches(currentPassword, member.getPassword())) {
                throw new RuntimeException("비밀번호가 틀려 탈퇴할 수 없습니다.");
            }
            individualRepository.delete(member); // 삭제

        } else if ("company".equalsIgnoreCase(type)) {
            CompanyMember member = companyRepository.findByMemberId(memberId)
                    .orElseThrow(() -> new RuntimeException("회원 정보 없음"));

            if (!passwordEncoder.matches(currentPassword, member.getPassword())) {
                throw new RuntimeException("비밀번호가 틀려 탈퇴할 수 없습니다.");
            }
            companyRepository.delete(member); // 삭제
        }
    }

    // ⭐ [추가됨] 5. 내 정보 조회 (마이페이지용)
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
        // 개인회원 찾기
        Optional<IndividualMember> indMember = individualRepository.findByNameAndPhoneNumber(name, phoneNumber);
        if (indMember.isPresent()) {
            return indMember.get().getMemberId();
        }

        // 기업회원 찾기
        Optional<CompanyMember> comMember = companyRepository.findByNameAndPhoneNumber(name, phoneNumber);
        if (comMember.isPresent()) {
            return comMember.get().getMemberId();
        }

        throw new RuntimeException("일치하는 회원 정보가 없습니다.");
    }

    // 7. 비밀번호 재설정
    public void resetPassword(String memberId, String name, String phoneNumber, String newPassword) {
        String encodedPwd = passwordEncoder.encode(newPassword);

        // 개인회원 확인
        Optional<IndividualMember> indMember = individualRepository.findByMemberIdAndNameAndPhoneNumber(memberId, name, phoneNumber);
        if (indMember.isPresent()) {
            IndividualMember member = indMember.get();
            member.setPassword(encodedPwd);
            individualRepository.save(member);
            return;
        }

        // 기업회원 확인
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
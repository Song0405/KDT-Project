package choi.sdp_back.service;

import choi.sdp_back.dto.MemberJoinDto;
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
public class MemberService {

    private final IndividualMemberRepository individualRepository;
    private final CompanyMemberRepository companyRepository;
    private final PasswordEncoder passwordEncoder;

    // 1. 회원가입
    @Transactional
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
                result.put("name", member.getName());
                result.put("type", "INDIVIDUAL");
                return result;
            }
        }

        Optional<CompanyMember> comMember = companyRepository.findByMemberId(memberId);
        if (comMember.isPresent()) {
            CompanyMember member = comMember.get();
            if (passwordEncoder.matches(password, member.getPassword())) {
                Map<String, Object> result = new HashMap<>();
                result.put("name", member.getName());
                result.put("type", "COMPANY");
                return result;
            }
        }

        throw new RuntimeException("아이디 또는 비밀번호가 일치하지 않습니다.");
    }
}
package choi.sdp_back.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class MailService {

    @Value("${spring.mail.username}")
    private String fromAddress;
    private final JavaMailSender javaMailSender;

    // 인증번호 저장소 (임시로 메모리에 저장)
    private final ConcurrentHashMap<String, String> verificationCodes = new ConcurrentHashMap<>();

    // 1. 인증번호 메일 발송
    public void sendVerificationCode(String email) {
        String code = createRandomCode();
        verificationCodes.put(email, code); // 저장

        // MimeMessage 생성 (이름 변경을 위해 필요)
        MimeMessage message = javaMailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // ▼▼▼ 여기서 이름 설정 ("SDP 관리자" 부분을 원하시는 대로 수정) ▼▼▼
            helper.setFrom(fromAddress, "SDP 관리자");

            helper.setTo(email);
            helper.setSubject("[SDP] 비밀번호 찾기 인증번호");
            helper.setText("인증번호는 [" + code + "] 입니다.", false); // false는 html 아님(일반 텍스트) 의미

            javaMailSender.send(message);
            System.out.println("메일 전송 성공! 코드: " + code);

        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("메일 전송 실패");
        }
    }
    // 2. 인증번호 확인
    public boolean verifyCode(String email, String inputCode) {
        String savedCode = verificationCodes.get(email);
        if (savedCode != null && savedCode.equals(inputCode)) {
            verificationCodes.remove(email); // 인증 성공하면 삭제
            return true;
        }
        return false;
    }

    // 랜덤 숫자 생성기
    private String createRandomCode() {
        Random random = new Random();
        StringBuilder key = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            key.append(random.nextInt(10));
        }
        return key.toString();
    }
}
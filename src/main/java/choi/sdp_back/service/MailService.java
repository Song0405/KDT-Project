package choi.sdp_back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender javaMailSender;

    // 인증번호 저장소 (임시로 메모리에 저장)
    private final ConcurrentHashMap<String, String> verificationCodes = new ConcurrentHashMap<>();

    // 1. 인증번호 메일 발송
    public void sendVerificationCode(String email) {
        String code = createRandomCode();
        verificationCodes.put(email, code); // 저장

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[SDP] 비밀번호 찾기 인증번호");
        message.setFrom("SDP 관리자 <본인구글이메일@gmail.com>");
        message.setText("인증번호는 [" + code + "] 입니다.");

        javaMailSender.send(message);
        System.out.println("메일 전송 성공! 코드: " + code);
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
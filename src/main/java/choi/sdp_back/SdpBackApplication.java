package choi.sdp_back;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SdpBackApplication {
    public static void main(String[] args) {
        System.setProperty("oracle.net.tns_admin", "C:/Wallet_kdt");
        SpringApplication.run(SdpBackApplication.class, args);
    }
}
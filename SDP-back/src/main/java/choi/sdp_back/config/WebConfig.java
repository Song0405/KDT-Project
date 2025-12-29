package choi.sdp_back.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.HandlerInterceptor; // ⭐ HandlerInterceptor 임포트

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull; // ⭐ @NonNull 임포트 (메서드 시그니처에 필요)

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000") // 개발 환경
                // 배포 환경에서는 실제 프론트엔드 도메인으로 변경해야 합니다.
                // .allowedOrigins("http://your-domain.com", "https://your-domain.com")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    // ⭐ Interceptor 등록
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 중요한 주의사항: 이 Interceptor는 관리자만 접근해야 하는 API에만 적용해야 합니다.
        // 예를 들어, /api/products (GET)는 일반 사용자도 접근해야 하므로 여기에 포함시키면 안 됩니다.
        // 따라서, 관리자 전용 API (예: /api/admin/products/**)가 있다면 그 경로에만 적용하는 것이 좋습니다.
        // 현재 프로젝트는 /api/products, /api/notices API를 일반 사용자도 조회 가능해야 하므로,
        // 아래 경로는 제품/공지사항의 '추가, 수정, 삭제' API에만 해당되어야 합니다.
        // 여기서는 예시로 모든 제품/공지사항 관련 API에 적용했으니, 실제 적용 시 주의해주세요.
        registry.addInterceptor(new AdminIpInterceptor())
                .addPathPatterns("/api/products", "/api/products/**", "/api/notices", "/api/notices/**", "/api/company-info", "/api/company-info/**");
        // 예를 들어, POST/PUT/DELETE만 막고 싶다면 특정 메서드 조건도 추가해야 합니다.
        // 이 예시는 모든 HTTP 메서드에 적용됩니다.
    }

    // ⭐ AdminIpInterceptor 클래스 정의 (HandlerInterceptor 인터페이스 구현)
    private static class AdminIpInterceptor implements HandlerInterceptor { // ⭐ HandlerInterceptor 인터페이스 구현

        // ⭐ 허용할 관리자 IP 주소 목록 (배포 시 실제 관리자 IP로 변경)
        private static final String[] ALLOWED_IPS = {"127.0.0.1", "0:0:0:0:0:0:0:1"}; // 로컬호스트, IPv6 로컬호스트
        // 예시: "203.0.113.45" // 실제 회사/관리자 IP 주소 추가

        @Override // ⭐ @NonNull 추가 (Spring 6부터 권장)
        public boolean preHandle(
                @NonNull HttpServletRequest request,
                @NonNull HttpServletResponse response,
                @NonNull Object handler) throws Exception {

            String clientIp = request.getRemoteAddr();
            boolean isAllowed = false;
            for (String allowedIp : ALLOWED_IPS) {
                if (clientIp.equals(allowedIp)) {
                    isAllowed = true;
                    break;
                }
            }

            if (!isAllowed) {
                System.out.println("접근 거부: 비인가 IP " + clientIp + " - 경로: " + request.getRequestURI()); // 콘솔에 로그
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access Denied: You do not have permission to access this resource.");
                return false; // 요청 처리 중단
            }
            return true; // 요청 처리 계속
        }
        // postHandle과 afterCompletion 메서드는 필수 구현이 아니므로 생략 가능합니다.
        // 필요하다면 @Override 하여 추가 구현할 수 있습니다.
    }
}
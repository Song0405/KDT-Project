package choi.sdp_back.entity;

public enum OrderStatus {
    ORDERED("주문 접수"),
    MANUFACTURING("제작/가공 중"),
    QUALITY_CHECK("품질 검사"),
    SHIPPING("배송 중"),
    COMPLETED("납품 완료");

    private final String description;

    OrderStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
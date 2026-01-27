import requests
import random
import os
import json

# ⭐ 스프링 부트 API 주소 & 이미지 폴더
API_URL = "http://localhost:8080/api/products"
IMAGE_DIR = "./sample_images"

# ⭐ 등록 제한 (최소 5장 ~ 최대 100장)
MIN_LIMIT = 5
MAX_LIMIT = 100

# 랜덤 데이터 재료
BRANDS = ["Logitech", "Razer", "Corsair", "Samsung", "LG", "Dell", "ASUS", "HP"]
ADJECTIVES = ["게이밍", "초경량", "무소음", "전문가용", "4K UHD", "인체공학", "RGB", "하이엔드"]

# 파일명 -> 카테고리 매핑
CATEGORY_MAPPING = {
    "keyboard": "KEYBOARD",
    "pc":       "PC",
    "monitor":  "MONITOR",
    "mouse":    "ACC",
    "speaker":  "ACC",
    "headset":  "ACC",
    "acc":      "ACC"
}

# 용도 풀
USAGE_POOL = ["GAMING", "OFFICE", "WORKSTATION"]

def inject_real_data():
    if not os.path.exists(IMAGE_DIR):
        print(f"❌ 오류: '{IMAGE_DIR}' 폴더가 없습니다.")
        return

    # 1. 파일 스캔
    upload_queue = []
    print("📂 파일 스캔 및 분류 중...")

    all_files = os.listdir(IMAGE_DIR)

    for filename in all_files:
        lower_name = filename.lower()
        if not lower_name.endswith(('.jpg', '.jpeg', '.png', '.bmp')):
            continue

        matched_category = None
        for prefix, db_cat in CATEGORY_MAPPING.items():
            if lower_name.startswith(prefix):
                matched_category = db_cat
                break

        if matched_category:
            upload_queue.append({
                "filename": filename,
                "category": matched_category
            })

    total_files = len(upload_queue)
    print(f"🧐 등록 가능한 파일: {total_files}개")

    # 2. 개수 제한 체크
    if total_files < MIN_LIMIT:
        print(f"⚠️ [중단] 사진이 최소 {MIN_LIMIT}장 필요합니다. (현재 {total_files}장)")
        return

    if total_files > MAX_LIMIT:
        upload_queue = upload_queue[:MAX_LIMIT]

    # 3. 업로드 시작
    print(f"\n🚀 데이터 주입 시작...")
    success_count = 0

    for item in upload_queue:
        filename = item['filename']
        category = item['category']

        brand = random.choice(BRANDS)
        adj = random.choice(ADJECTIVES)
        usage = random.choice(USAGE_POOL)

        name = f"[{brand}] {adj} {category} {random.randint(100, 900)}X"
        price = random.randint(50, 300) * 1000
        if category == "PC": price *= 10
        if category == "MONITOR": price *= 2

        # ⭐ [수정 1] 데이터를 딕셔너리로 만듦
        product_data = {
            "name": name,
            "description": f"이 제품은 {usage} 환경에 최적화된 {brand} {category}입니다.\n(원본파일: {filename})",
            "price": str(price),
            "category": category,
            "usage": usage
        }

        image_path = os.path.join(IMAGE_DIR, filename)

        try:
            with open(image_path, 'rb') as img:
                # ⭐ [수정 2] 'product'라는 이름으로 JSON 데이터를 묶어서 보냄 (핵심!)
                # 스프링의 @RequestPart("product")가 이걸 원함
                multipart_form_data = {
                    'image': (filename, img, 'image/jpeg'),
                    'product': (None, json.dumps(product_data), 'application/json')
                }

                # data=payload 대신 files에 모든 걸 담아서 보냄
                res = requests.post(API_URL, files=multipart_form_data)

            if res.status_code in [200, 201]:
                print(f"✅ [{category}/{usage}] 등록성공: {name}")
                success_count += 1
            else:
                print(f"❌ 실패 ({res.status_code}): {filename}")
                # 에러 로그 간소화
                try:
                    print(f"   👉 이유: {res.json().get('message', res.text[:200])}")
                except:
                    print(f"   👉 이유: {res.text[:200]}")

        except Exception as e:
            print(f"❌ 에러: {e}")

    print(f"\n🎉 총 {success_count}개 상품 등록 완료!")

if __name__ == "__main__":
    inject_real_data()
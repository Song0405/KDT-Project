const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }, // 아이디
    password: { type: String, required: true, select: false }, // 비밀번호 (기본 non-select)
    email: { type: String, required: true, unique: true }, // 이메일
    phoneNumber: { type: String, required: true }, // 전화번호
    userType: { type: String, enum: ['individual', 'corporate'], required: true }, // 회원 유형

    // 개인회원 정보: 결정론적 해시값을 저장 (원문 저장 금지)
    name: { type: String, required: function() { return this.userType === 'individual'; } }, // 이름
    residentNumber: { type: String, required: function() { return this.userType === 'individual'; }, select: false }, // 주민번호(HMAC)

    // 기업회원 정보: 결정론적 해시값을 저장
    companyName: { type: String, required: function() { return this.userType === 'corporate'; } }, // 기업명
    businessRegistrationNumber: { type: String, required: function() { return this.userType === 'corporate'; }, unique: true, sparse: true, select: false }, // 사업자등록번호(HMAC)
}, { timestamps: true });

// 비밀번호 암호화
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// 비밀번호 비교 메서드
UserSchema.methods.matchPassword = function(plain) {
    return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', UserSchema);

import React from 'react';
import './Layout.css';

function Footer() {
    return (
        <footer className="site-footer">
            <div className="footer-content">
                <div className="footer-left">
                    <p className="copyright">
                        &copy; 2026 <strong>ROOT STATION</strong>. All Rights Reserved.
                    </p>
                </div>

                <div className="footer-right">
                    <div className="footer-links">
                        <span>이용약관</span>
                        <span className="separator">|</span>
                        <span>개인정보처리방침</span>
                        <span className="separator">|</span>
                        <span>고객센터</span>
                    </div>
                </div>
            </div>

            {/* 우측 하단 고정 플로팅 채팅 버튼 */}
            <button className="chat-button" title="상담하기">
                💬
            </button>
        </footer>
    );
}

export default Footer;
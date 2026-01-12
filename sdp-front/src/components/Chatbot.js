import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Chatbot.css';

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);

    // ⭐ [수정 1] 인사말 변경 (철강 -> 컴퓨터 전문가)
    const [messages, setMessages] = useState([
        {
            text: "SYSTEM ONLINE... ⚡\n안녕하세요! ROOT STATION AI 매니저입니다.\nPC 견적, 호환성, 배송 등 무엇이든 물어보세요. 🖥️",
            sender: 'bot',
            isWelcome: true
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // ⭐ [수정 2] 자주 묻는 질문 버튼 변경 (공장 용어 -> 쇼핑몰 용어)
    const quickButtons = [
        "배송 얼마나 걸려? 🚚",
        "윈도우 설치해줘? 💿",
        "AS 보증 기간은? 🛡️",
        "호환성 체크 방법 ⚙️",
        "매장 위치 안내 🗺️"
    ];

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    const sendMessage = async (text = null) => {
        const userMessage = text || inputValue;
        if (!userMessage.trim()) return;

        // 사용자 메시지 추가
        const newMessages = [...messages, { text: userMessage, sender: 'user' }];
        setMessages(newMessages);
        setInputValue('');
        setIsLoading(true);

        try {
            // 파이썬 서버로 요청 (포트 5002 확인)
            const response = await axios.post('http://localhost:5002/chat', {
                message: userMessage
            });

            // AI 응답 추가
            setMessages(prev => [
                ...prev,
                { text: response.data.response, sender: 'bot' }
            ]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [
                ...prev,
                { text: "⚠️ 통신 오류: 파이썬 서버(app.py)가 켜져 있는지 확인해주세요.", sender: 'bot' }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* 챗봇 토글 버튼 */}
            <button className="chatbot-btn" onClick={toggleChat}>
                {isOpen ? '❌' : '💬'}
            </button>

            {/* 챗봇 윈도우 */}
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header" style={{
                        background: '#000',
                        color: '#00d4ff',
                        padding: '15px',
                        borderBottom: '1px solid #333',
                        fontWeight: 'bold',
                        borderTopLeftRadius: '20px',
                        borderTopRightRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        {/* 헤더 부분도 사이버틱하게 디자인 */}
                        <span style={{ fontSize: '1.2rem' }}>🤖</span>
                        <span>ROOT AI SUPPORT</span>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message-container ${msg.sender}`}>
                                <div className={`message ${msg.sender}`}>
                                    {msg.text}
                                </div>
                                {/* 웰컴 메시지일 때만 버튼 보여주기 */}
                                {msg.isWelcome && (
                                    <div className="quick-reply-container">
                                        {quickButtons.map((btnText, idx) => (
                                            <button
                                                key={idx}
                                                className="quick-reply-btn"
                                                onClick={() => sendMessage(btnText)}
                                                disabled={isLoading}
                                            >
                                                {btnText}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && <div className="message bot">분석 중... ⏳</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="질문을 입력하세요..."
                            disabled={isLoading}
                        />
                        <button onClick={() => sendMessage()} disabled={isLoading}>전송</button>
                    </div>
                </div>
            )}
        </>
    );
}

export default Chatbot;
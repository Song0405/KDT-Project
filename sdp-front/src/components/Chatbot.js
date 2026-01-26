import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Chatbot.css';

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);

    // ⭐ 컴퓨터 매장 컨셉 인사말
    const [messages, setMessages] = useState([
        {
            text: "SYSTEM ONLINE... ⚡\n안녕하세요! ROOT STATION AI 매니저입니다.\nPC 견적, 호환성, 배송 등 무엇이든 물어보세요. 🖥️",
            sender: 'bot',
            isWelcome: true
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // ⭐ 컴퓨터 관련 질문 버튼
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

    // ⭐ [핵심 수정] 메시지 전송 시 '내가 누군지(memberId)' 같이 보냄
    const sendMessage = async (text = null) => {
        const userMessage = text || inputValue;
        if (!userMessage.trim()) return;

        // 1. 사용자 메시지 화면에 표시
        const newMessages = [...messages, { text: userMessage, sender: 'user' }];
        setMessages(newMessages);
        setInputValue('');
        setIsLoading(true);

        // 2. 현재 로그인한 사용자 ID 가져오기 (없으면 guest)
        const memberId = localStorage.getItem('memberId') || 'guest';

        try {
            // 3. 파이썬 서버로 전송 (메시지 + 사용자ID)
            const response = await axios.post('http://localhost:5002/chat', {
                message: userMessage,
                user_id: memberId // 👈 여기가 핵심입니다!
            });

            // 4. AI 응답 화면에 표시
            setMessages(prev => [
                ...prev,
                { text: response.data.response, sender: 'bot' }
            ]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [
                ...prev,
                { text: "⚠️ AI 서버(Port:5002)와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.", sender: 'bot' }
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
                    <div className="chat-header">
                        <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>🤖</span>
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

                        {isLoading && (
                            <div className="message-container bot">
                                <div className="message bot">분석 중... ⏳</div>
                            </div>
                        )}
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
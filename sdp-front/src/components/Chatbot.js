// frontend/src/components/Chatbot.js

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Chatbot.css';

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);

    // ⭐ 초기 메시지 설정
    const [messages, setMessages] = useState([
        {
            text: "안녕하세요! SDP Solutions입니다.\n철강/금속 제조 전문가가 답변해 드립니다. 🏭",
            sender: 'bot',
            isWelcome: true // ⭐ 이 메시지에만 버튼을 달아주기 위한 표시
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // ⭐ 자주 묻는 질문 리스트
    const quickButtons = [
        "견적 요청 방법 📄",
        "제작 소요 시간 ⏰",
        "도면이 없는데 가능해? 📐",
        "표면 처리 종류 ✨",
        "회사 위치 안내 🗺️"
    ];

    const messagesEndRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => { scrollToBottom(); }, [messages, isOpen]); // isOpen이 바뀔 때도 스크롤

    const toggleChat = () => setIsOpen(!isOpen);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };

    const sendMessage = async (text = null) => {
        const userMessage = text || inputValue;
        if (!userMessage.trim()) return;

        // 1. 사용자 메시지 추가
        setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
        setInputValue('');
        setIsLoading(true);

        try {
            // 2. 서버 전송
            const response = await axios.post('http://localhost:5002/chat', {
                message: userMessage
            });

            // 3. 봇 응답 추가
            setMessages(prev => [...prev, { text: response.data.response, sender: 'bot' }]);

        } catch (error) {
            console.error("Chatbot Error:", error);
            setMessages(prev => [...prev, { text: "죄송합니다. 서버 연결에 실패했습니다.", sender: 'bot' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* 챗봇 토글 버튼 */}
            <button className="chatbot-btn" onClick={toggleChat}>
                {isOpen ? '✖' : '💬'}
            </button>

            {/* 채팅창 본체 */}
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <span>SDP AI 상담원</span>
                        <button className="close-btn" onClick={toggleChat}>✖</button>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender}`}>
                                {/* 줄바꿈 처리 (\n -> <br>) */}
                                {msg.text.replaceAll('**', '').split('\n').map((line, i) => (
                                    <span key={i}>{line}<br/></span>
                                ))}

                                {/* ⭐ 첫 번째 환영 메시지(bot) 안에만 버튼 표시 ⭐ */}
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

                        {isLoading && <div className="message bot">입력 중... 💬</div>}
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
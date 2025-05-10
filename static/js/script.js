// HTML转义函数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// HTML实体解码函数
function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

// 处理消息文本（添加换行等）
function processMessageText(text) {
    if (!text) return '';

    // 首先转义HTML
    let processed = escapeHtml(text);
    
    // 恢复数学公式标记
    processed = processed.replace(/\_\_MATH\_INLINE\_\_(.*?)\_\_MATH\_INLINE\_END\_\_/g, function(match, formula) {
        // 解码HTML实体来正确处理LaTeX符号
        const decodedFormula = decodeHtmlEntities(formula);
        return '\\(' + decodedFormula + '\\)';
    });
    
    processed = processed.replace(/\_\_MATH\_DISPLAY\_\_(.*?)\_\_MATH\_DISPLAY\_END\_\_/g, function(match, formula) {
        const decodedFormula = decodeHtmlEntities(formula);
        return '\\[' + decodedFormula + '\\]';
    });
    
    // 处理换行符
    processed = processed.replace(/\n/g, '<br>');

    return processed;
}

// 滚动到底部函数（用于全局调用）
function scrollToBottom() {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// 自动调整文本区域高度的函数
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

// 添加用户消息
function addUserMessage(message) {
    const chatContainer = document.getElementById('chat-container');
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';
    messageElement.innerHTML = `
        <div class="message-header">
            <div class="message-avatar">用</div>
            <div class="message-from">你</div>
        </div>
        <div class="message-content">${escapeHtml(message)}</div>
    `;

    // 添加到聊天容器
    chatContainer.appendChild(messageElement);

    // 滚动到底部
    scrollToBottom();
}

// 添加助手消息
function addAssistantMessage(message, reasoning, responseTime) {
    const chatContainer = document.getElementById('chat-container');
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = 'message assistant-message';

    // 构建消息内容HTML
    let contentHTML = `
        <div class="message-header">
            <div class="message-avatar">AI</div>
            <div class="message-from">智能助手</div>
        </div>
        <div class="message-content">
            ${processMessageText(message)}
        </div>
    `;

    // 如果有推理过程，添加详细信息按钮和推理内容
    if (reasoning) {
        const timeDisplay = responseTime ? `<span class="response-time">(耗时: ${responseTime}秒)</span>` : '';
        contentHTML += `
            <div class="message-details">
                <button class="details-toggle">查看推理过程 ${timeDisplay} <span class="arrow">▼</span></button>
                <div class="details-content" style="display: none;">
                    ${processMessageText(reasoning)}
                </div>
            </div>
        `;
    }

    messageElement.innerHTML = contentHTML;

    // 添加到聊天容器
    chatContainer.appendChild(messageElement);

    // 为详细信息按钮添加事件监听器
    if (reasoning) {
        const toggleButton = messageElement.querySelector('.details-toggle');
        const detailsContent = messageElement.querySelector('.details-content');

        toggleButton.addEventListener('click', () => {
            const isVisible = detailsContent.style.display !== 'none';
            detailsContent.style.display = isVisible ? 'none' : 'block';
            toggleButton.querySelector('.arrow').textContent = isVisible ? '▼' : '▲';

            // 渲染新显示的数学公式
            if (!isVisible && window.renderMath) {
                window.renderMath();
            }

            // 滚动到底部
            scrollToBottom();
        });
    }

    // 渲染数学公式
    if (window.renderMath) {
        window.renderMath();
    }
}

// 添加错误消息
function addErrorMessage(error) {
    const chatContainer = document.getElementById('chat-container');
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = 'message assistant-message';
    messageElement.innerHTML = `
        <div class="message-header">
            <div class="message-avatar" style="background-color: #ff5252;">!</div>
            <div class="message-from">错误</div>
        </div>
        <div class="message-content" style="color: #d32f2f;">
            ${escapeHtml(error)}
        </div>
    `;

    // 添加到聊天容器
    chatContainer.appendChild(messageElement);
}

// 添加加载消息
function addLoadingMessage() {
    const chatContainer = document.getElementById('chat-container');
    // 创建加载元素
    const loadingElement = document.createElement('div');
    loadingElement.className = 'message loading';
    loadingElement.innerHTML = `
        <div class="message-header">
            <div class="message-avatar">AI</div>
            <div class="message-from">智能助手</div>
        </div>
        <div class="loading-dots">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
        </div>
    `;

    // 添加到聊天容器
    chatContainer.appendChild(loadingElement);

    // 滚动到底部
    scrollToBottom();

    return loadingElement;
}

// 更新用户名
function updateUserName(name) {
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(elem => {
        elem.textContent = name;
    });
}

// 加载MathJax库
function loadMathJax() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.async = true;
    script.id = 'MathJax-script';
    document.head.appendChild(script);

    // 配置MathJax
    window.MathJax = {
        tex: {
            inlineMath: [['$', '$'], ['\\(', '\\)']],
            displayMath: [['$$', '$$'], ['\\[', '\\]']],
            packages: ['base', 'ams', 'noerrors', 'noundefined'],
            macros: {
                binom: ["\\binom{#1}{#2}", 2],
                frac: ["\\frac{#1}{#2}", 2]
            }
        },
        svg: {
            fontCache: 'global'
        },
        startup: {
            typeset: false
        }
    };
}

// 渲染页面中的数学公式
function renderMath() {
    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch(err => console.error('MathJax error:', err));
    } else {
        setTimeout(renderMath, 500); // 如果MathJax还没加载完成，等待后重试
    }
}

// 设置为全局函数，以便在多问题模式中调用
window.renderMath = renderMath;

// 全局发送消息函数
function sendMessage() {
    const userInput = document.getElementById('user-input');
    
    const message = userInput.value.trim();
    if (!message) return;

    // 添加用户消息到聊天窗口
    addUserMessage(message);

    // 清空输入框并重置高度
    userInput.value = '';
    userInput.style.height = 'auto';

    // 显示加载状态
    const loadingElement = addLoadingMessage();
    
    // 记录开始时间
    const requestStartTime = performance.now();

    // 发送请求到后端
    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
    })
        .then(response => response.json())
        .then(data => {
            // 计算响应时间
            const responseTime = ((performance.now() - requestStartTime) / 1000).toFixed(2);
            
            // 移除加载状态
            loadingElement.remove();

            // 添加助手回复
            if (data.error) {
                addErrorMessage(data.error);
            } else {
                addAssistantMessage(data.answer, data.reasoning, responseTime);
            }

            // 滚动到底部
            scrollToBottom();
        })
        .catch(error => {
            // 移除加载状态
            loadingElement.remove();

            // 添加错误消息
            addErrorMessage('发生错误，请稍后再试：' + error.message);

            // 滚动到底部
            scrollToBottom();
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-btn');
    const modelSelector = document.querySelector('.model-selector');
    const fuzzyQuestionBtn = document.getElementById('fuzzy-question-btn');
    
    console.log('DOMContentLoaded 事件触发');
    console.log('发送按钮元素:', sendButton);
    console.dir(sendButton);

    // 加载MathJax
    loadMathJax();

    // 设置用户名称
    updateUserName("用户");

    // 添加初始的欢迎消息
    addAssistantMessage("你好！有什么我可以帮助你的吗？", null);

    // 添加新对话按钮
    createNewChatButton();

    // 自动调整文本区域高度
    userInput.addEventListener('input', () => {
        autoResizeTextarea(userInput);
    });

    // 为多输入框添加自动调整高度
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('multi-input')) {
            autoResizeTextarea(e.target);
        }
    });

    // 模糊问题按钮点击事件
    fuzzyQuestionBtn.addEventListener('click', () => {
        userInput.value = "下面的问题没有标准答案，请回答你认为比较合适的答案，同时避免过度思考。";
        autoResizeTextarea(userInput);
        userInput.focus();
    });

    // 添加聊天相关事件监听器
    if (sendButton) {
        console.log("找到发送按钮，添加点击事件");
        sendButton.addEventListener('click', function() {
            console.log("发送按钮被点击");
            sendMessage();
        });
    } else {
        console.error("找不到发送按钮");
    }
    
    userInput.addEventListener('keydown', (e) => {
        console.log("键盘按下事件:", e.key);
        if (e.key === 'Enter' && !e.shiftKey) {
            console.log("检测到Enter键按下，准备发送消息");
            e.preventDefault();
            sendMessage();
        }
    });

    // 为模型选择器添加点击事件
    modelSelector.addEventListener('click', () => {
        alert('模型选择功能尚未实现');
    });
});

// 创建新对话按钮
function createNewChatButton() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    const newChatBtn = document.createElement('button');
    newChatBtn.id = 'new-chat-btn';
    newChatBtn.className = 'new-chat-btn';
    newChatBtn.innerHTML = '新对话 <i class="fas fa-plus"></i>';
    
    newChatBtn.addEventListener('click', startNewConversation);
    
    // 在greeting之前插入
    const greeting = header.querySelector('.greeting');
    if (greeting) {
        header.insertBefore(newChatBtn, greeting);
    } else {
        header.appendChild(newChatBtn);
    }
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .new-chat-btn {
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            margin: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            font-weight: 500;
        }
        .new-chat-btn i {
            margin-left: 8px;
        }
        .new-chat-btn:hover {
            background-color: #45a049;
        }
    `;
    document.head.appendChild(style);
}

// 开始新对话
function startNewConversation() {
    // 清空聊天容器
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = '';
    
    // 添加欢迎消息
    addAssistantMessage("你好！有什么我可以帮助你的吗？", null);
    
    // 调用后端API创建新对话
    fetch('/api/new-conversation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log('新对话已创建:', data.conversation_id);
    })
    .catch(error => {
        console.error('创建新对话出错:', error);
    });
}

// 以下是多问题模式的功能函数

// 切换单问题/多问题模式
function toggleInputMode() {
    const checkbox = document.getElementById('multi-mode-checkbox');
    const singleInputContainer = document.getElementById('single-input-container');
    const multiInputContainer = document.getElementById('multi-input-container');

    if (checkbox.checked) {
        singleInputContainer.style.display = 'none';
        multiInputContainer.style.display = 'block';
        
        // 为已存在的多输入文本框添加事件监听
        const existingTextareas = document.querySelectorAll('#input-fields-container .multi-input');
        existingTextareas.forEach(textarea => {
            // 避免重复添加事件监听
            textarea.removeEventListener('keydown', handleMultiInputKeydown);
            textarea.addEventListener('keydown', handleMultiInputKeydown);
        });
    } else {
        singleInputContainer.style.display = 'block';
        multiInputContainer.style.display = 'none';
    }
}

// 处理多输入模式的文本框键盘事件
function handleMultiInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        // 如果是最后一个文本框，则提交所有问题
        const textareas = document.querySelectorAll('#input-fields-container .multi-input');
        const lastTextarea = textareas[textareas.length - 1];
        if (e.target === lastTextarea) {
            submitMultipleQuestions();
        } else {
            // 否则，自动跳转到下一个文本框
            const textareaArray = Array.from(textareas);
            const currentIndex = textareaArray.indexOf(e.target);
            if (currentIndex !== -1 && currentIndex < textareaArray.length - 1) {
                textareaArray[currentIndex + 1].focus();
            }
        }
    }
}

// 添加新的输入字段
function addInputField() {
    const container = document.getElementById('input-fields-container');
    const div = document.createElement('div');
    div.className = 'input-group';
    div.innerHTML = `
        <textarea class="multi-input" placeholder="输入您的问题..." rows="1"></textarea>
        <button class="remove-input-btn" onclick="removeInputField(this)">
            <i class="fas fa-minus"></i>
        </button>
    `;
    container.appendChild(div);

    // 触发一次 autoResize
    const newTextarea = div.querySelector('textarea');
    newTextarea.style.height = 'auto';
    newTextarea.style.height = (newTextarea.scrollHeight) + 'px';
    
    // 为新的文本框添加键盘事件处理
    newTextarea.addEventListener('keydown', handleMultiInputKeydown);
}

// 移除输入字段
function removeInputField(button) {
    const inputGroups = document.querySelectorAll('#input-fields-container .input-group');
    if (inputGroups.length > 1) {
        button.parentElement.remove();
    } else {
        alert('至少需要保留一个输入框！');
    }
}

// 提交多个问题
function submitMultipleQuestions() {
    const chatContainer = document.getElementById('chat-container');
    const textareas = document.querySelectorAll('#input-fields-container .multi-input');
    const questions = Array.from(textareas).map(textarea => textarea.value.trim());

    // 验证所有问题都不为空
    if (questions.some(q => !q)) {
        alert('所有问题都不能为空！');
        return;
    }

    // 创建包含所有问题的消息元素
    const questionsElement = document.createElement('div');
    questionsElement.className = 'message user-message multi-questions';

    let questionsHtml = `
        <div class="message-header">
            <div class="message-avatar">用</div>
            <div class="message-from">你的多个问题</div>
        </div>
        <div class="message-content multi-questions-content">
    `;

    questions.forEach((question, index) => {
        questionsHtml += `<div class="question-item">问题 ${index + 1}: ${escapeHtml(question)}</div>`;
    });

    questionsHtml += `</div>`;
    questionsElement.innerHTML = questionsHtml;
    chatContainer.appendChild(questionsElement);

    // 创建加载消息
    const loadingElement = document.createElement('div');
    loadingElement.className = 'message loading';
    loadingElement.innerHTML = `
        <div class="message-header">
            <div class="message-avatar">AI</div>
            <div class="message-from">智能助手</div>
        </div>
        <div class="loading-dots">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
        </div>
    `;
    chatContainer.appendChild(loadingElement);

    // 滚动到底部
    scrollToBottom();

    // 记录开始时间
    const requestStartTime = performance.now();

    // 发送请求
    fetch('/api/multi-ask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questions: questions })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('服务器响应错误');
            }
            return response.json();
        })
        .then(data => {
            // 计算响应时间
            const responseTime = ((performance.now() - requestStartTime) / 1000).toFixed(2);
            
            // 移除加载消息
            loadingElement.remove();

            // 展示所有回答
            data.forEach((response, index) => {
                const answerElement = document.createElement('div');
                answerElement.className = 'message assistant-message';

                let answerHtml = `
                <div class="message-header">
                    <div class="message-avatar">AI</div>
                    <div class="message-from">回答 ${index + 1}</div>
                </div>
                <div class="message-content">${processMessageText(response.answer)}</div>
            `;

                if (response.reasoning) {
                    const timeDisplay = responseTime ? `<span class="response-time">(耗时: ${responseTime}秒)</span>` : '';
                    answerHtml += `
                    <div class="message-details">
                        <button class="details-toggle">查看推理过程 ${timeDisplay} <span class="arrow">▼</span></button>
                        <div class="details-content" style="display: none;">
                            ${processMessageText(response.reasoning)}
                        </div>
                    </div>
                `;
                }

                answerElement.innerHTML = answerHtml;
                chatContainer.appendChild(answerElement);

                // 为详细信息按钮添加事件监听器
                if (response.reasoning) {
                    const toggleButton = answerElement.querySelector('.details-toggle');
                    const detailsContent = answerElement.querySelector('.details-content');

                    toggleButton.addEventListener('click', () => {
                        const isVisible = detailsContent.style.display !== 'none';
                        detailsContent.style.display = isVisible ? 'none' : 'block';
                        toggleButton.querySelector('.arrow').textContent = isVisible ? '▼' : '▲';
                        
                        // 渲染新显示的数学公式
                        if (!isVisible && window.renderMath) {
                            window.renderMath();
                        }
                        
                        scrollToBottom();
                    });
                }
            });

            // 渲染数学公式
            if (window.renderMath) {
                window.renderMath();
            }

            // 滚动到底部
            scrollToBottom();
        })
        .catch(error => {
            // 移除加载消息
            loadingElement.remove();

            // 添加错误消息
            const errorElement = document.createElement('div');
            errorElement.className = 'message assistant-message';
            errorElement.innerHTML = `
            <div class="message-header">
                <div class="message-avatar" style="background-color: #ff5252;">!</div>
                <div class="message-from">错误</div>
            </div>
            <div class="message-content" style="color: #d32f2f;">
                发生错误: ${escapeHtml(error.message)}
            </div>
        `;
            chatContainer.appendChild(errorElement);

            // 滚动到底部
            scrollToBottom();
        });
} 
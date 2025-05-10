import os
import sys
import re
import uuid
import time
from flask import Flask, render_template, request, jsonify, session
from openai import OpenAI
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", os.urandom(24))

# 用于存储会话的对话历史
conversations = {}

# 初始化OpenAI客户端
def get_client():
    return OpenAI(
        api_key=os.getenv("DASHSCOPE_API_KEY", ""), 
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
    )

# 处理数学公式，添加特殊标记以便前端识别
def process_math_formulas(text):
    if not text:
        return text
        
    # 使用特殊标记替换LaTeX分隔符
    # 标准的行内公式 $...$
    text = re.sub(r'(\$)(.*?)(\$)', r'__MATH_INLINE__\2__MATH_INLINE_END__', text)
    
    # 行间公式 $$...$$
    text = re.sub(r'(\$\$)(.*?)(\$\$)', r'__MATH_DISPLAY__\2__MATH_DISPLAY_END__', text)
    
    # 行间公式 \[...\] 和行内公式 \(...\)
    text = re.sub(r'(\\\[)(.*?)(\\\])', r'__MATH_DISPLAY__\2__MATH_DISPLAY_END__', text)
    text = re.sub(r'(\\\()(.*?)(\\\))', r'__MATH_INLINE__\2__MATH_INLINE_END__', text)
    
    # 替换直接显示的"__MATH_INLINE__ n __MATH_INLINE_END__"文本
    text = re.sub(r'(\_\_MATH\_INLINE\_\_\s+)([^\s]+)(\s+\_\_MATH\_INLINE\_END\_\_)', 
                 r'__MATH_INLINE__\2__MATH_INLINE_END__', text)
    
    return text

# 获取或创建对话ID
def get_conversation_id():
    if 'conversation_id' not in session:
        session['conversation_id'] = str(uuid.uuid4())
    return session['conversation_id']

# 获取对话历史
def get_conversation_history(conversation_id):
    if conversation_id not in conversations:
        conversations[conversation_id] = []
    return conversations[conversation_id]

# 清理过期的对话（可选，用于控制内存）
def clean_old_conversations():
    current_time = time.time()
    expired_ids = []
    
    # 查找超过24小时的对话
    for conv_id, history in conversations.items():
        if history and 'timestamp' in history[0]:
            if current_time - history[0]['timestamp'] > 86400:  # 24小时
                expired_ids.append(conv_id)
    
    # 删除过期对话
    for conv_id in expired_ids:
        del conversations[conv_id]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/test-math')
def test_math():
    return app.send_static_file('test_math.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        user_message = request.json.get('message', '')
        new_conversation = request.json.get('new_conversation', False)
        
        if not user_message.strip():
            return jsonify({"error": "消息不能为空"}), 400
        
        # 获取对话ID
        conversation_id = get_conversation_id()
        
        # 如果请求了新对话，则清除历史
        if new_conversation:
            conversations[conversation_id] = []
        
        # 获取对话历史
        conversation_history = get_conversation_history(conversation_id)
        
        # 添加用户消息到历史
        conversation_history.append({
            'role': 'user',
            'content': user_message,
            'timestamp': time.time()
        })
        
        # 构建完整的消息历史列表
        messages = [{'role': msg['role'], 'content': msg['content']} 
                   for msg in conversation_history]
        
        client = get_client()
        completion = client.chat.completions.create(
            model="deepseek-r1",  # 此处以 deepseek-r1 为例，可按需更换模型名称
            messages=messages
        )
        
        # 提取回复内容和推理过程
        reasoning = getattr(completion.choices[0].message, 'reasoning_content', None)
        answer = completion.choices[0].message.content
        
        # 添加助手回复到历史
        conversation_history.append({
            'role': 'assistant',
            'content': answer,
            'timestamp': time.time()
        })
        
        # 处理答案和推理过程中的数学公式
        processed_answer = process_math_formulas(answer)
        processed_reasoning = process_math_formulas(reasoning) if reasoning else None
        
        # 定期清理旧对话
        if len(conversations) > 1000:  # 当对话数量超过1000时
            clean_old_conversations()
        
        return jsonify({
            "reasoning": processed_reasoning,
            "answer": processed_answer,
            "conversation_id": conversation_id
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/multi-ask', methods=['POST'])
def multi_ask():
    try:
        questions = request.json.get('questions', [])
        new_conversation = request.json.get('new_conversation', False)
        use_context = request.json.get('use_context', True)  # 新增参数，是否使用上下文
        
        if not questions:
            return jsonify({"error": "没有提供问题"}), 400
        
        responses = []
        client = get_client()
        
        # 获取对话ID
        conversation_id = get_conversation_id()
        
        # 如果请求了新对话，则清除历史
        if new_conversation:
            conversations[conversation_id] = []
        
        # 获取对话历史
        conversation_history = get_conversation_history(conversation_id)
        
        # 将多个问题作为单个上下文处理
        if use_context:
            # 构建完整的消息历史和当前问题
            all_questions = "\n\n".join([f"问题 {i+1}: {q}" for i, q in enumerate(questions)])
            
            # 添加用户消息到历史
            conversation_history.append({
                'role': 'user',
                'content': all_questions,
                'timestamp': time.time()
            })
            
            # 构建消息列表
            messages = [{'role': msg['role'], 'content': msg['content']} 
                       for msg in conversation_history]
            
            # 发送请求
            completion = client.chat.completions.create(
                model="deepseek-r1",
                messages=messages
            )
            
            # 提取回复内容和推理过程
            reasoning = getattr(completion.choices[0].message, 'reasoning_content', None)
            answer = completion.choices[0].message.content
            
            # 添加助手回复到历史
            conversation_history.append({
                'role': 'assistant',
                'content': answer,
                'timestamp': time.time()
            })
            
            # 处理答案和推理过程中的数学公式
            processed_answer = process_math_formulas(answer)
            processed_reasoning = process_math_formulas(reasoning) if reasoning else None
            
            # 因为是一次回复所有问题，只返回一个响应
            responses.append({
                "question": all_questions,
                "reasoning": processed_reasoning,
                "answer": processed_answer
            })
        else:
            # 原有的处理方式：为每个问题创建独立上下文
            for question in questions:
                if not question.strip():
                    continue  # 跳过空问题
                
                # 为每个问题创建独立上下文的请求
                completion = client.chat.completions.create(
                    model="deepseek-r1",
                    messages=[
                        {'role': 'user', 'content': question}
                    ]
                )
                
                # 提取回复内容和推理过程
                reasoning = getattr(completion.choices[0].message, 'reasoning_content', None)
                answer = completion.choices[0].message.content
                
                # 处理答案和推理过程中的数学公式
                processed_answer = process_math_formulas(answer)
                processed_reasoning = process_math_formulas(reasoning) if reasoning else None
                
                responses.append({
                    "question": question,
                    "reasoning": processed_reasoning,
                    "answer": processed_answer
                })
        
        # 定期清理旧对话
        if len(conversations) > 1000:  # 当对话数量超过1000时
            clean_old_conversations()
            
        return jsonify({
            "responses": responses,
            "conversation_id": conversation_id,
            "use_context": use_context
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/new-conversation', methods=['POST'])
def new_conversation():
    # 创建新的对话
    session['conversation_id'] = str(uuid.uuid4())
    return jsonify({"success": True, "conversation_id": session['conversation_id']})

@app.route('/api/models', methods=['GET'])
def get_available_models():
    # 这里可以实现获取可用模型的逻辑
    # 以下是示例数据
    models = [
        {"id": "deepseek-r1", "name": "深度思考 R1", "default": True},
        {"id": "qwen-turbo", "name": "通义千问 Turbo", "default": False},
        {"id": "qwen-plus", "name": "通义千问 Plus", "default": False}
    ]
    return jsonify(models)

if __name__ == '__main__':
    # 检查依赖项
    missing_deps = []
    try:
        import dotenv
    except ImportError:
        missing_deps.append("python-dotenv")
    
    if missing_deps:
        print("错误: 缺少必要的依赖项。请安装以下包:")
        for dep in missing_deps:
            print(f"- {dep}")
        print("\n运行: pip install " + " ".join(missing_deps))
        sys.exit(1)
    
    # 检查API密钥
    if not os.getenv("DASHSCOPE_API_KEY"):
        print("警告: 未设置DASHSCOPE_API_KEY环境变量。请在.env文件中设置。")
    
    app.run(debug=True, host='0.0.0.0', port=5004) 
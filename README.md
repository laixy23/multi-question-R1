# Multi-Question R1

这是一个使用 Flask 和 DeepSeek R1 创建的智能问答应用。该应用允许用户进行单问题对话或一次提交多个问题。

## 功能特点

- 支持单问题交互式对话，保持上下文连续性
- 支持一次提交多个问题进行批量处理
- 自动处理和渲染数学公式
- 可选择不同的大语言模型
- 显示模型的推理过程

## 安装与运行

1. 克隆此仓库
```bash
git clone https://github.com/yourusername/multi-question-R1.git
cd multi-question-R1
```

2. 安装依赖项
```bash
pip install -r requirements.txt
```

3. 创建环境变量文件
```bash
cp .env.example .env
```

4. 编辑 `.env` 文件，添加您的 API 密钥
```bash
DASHSCOPE_API_KEY=your_api_key_here
SECRET_KEY=your_secret_key_here
```

5. 启动应用
```bash
python app.py
```

应用将在 http://localhost:5003 运行

## API 接口

### 单问题对话
- 端点: `/api/chat`
- 方法: POST
- 请求体:
  ```json
  {
    "message": "你的问题",
    "new_conversation": false
  }
  ```

### 多问题批量处理
- 端点: `/api/multi-ask`
- 方法: POST
- 请求体:
  ```json
  {
    "questions": ["问题1", "问题2", "问题3"]
  }
  ```

### 创建新对话
- 端点: `/api/new-conversation`
- 方法: POST

### 获取可用模型
- 端点: `/api/models`
- 方法: GET

## 技术栈

- 后端: Flask
- AI: DeepSeek R1, 通义千问等
- API: 达摩院 DashScope API

## 许可

[添加您的许可信息] 
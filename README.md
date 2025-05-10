# Multi-Question R1

这是一个基于Flask和大语言模型的智能问答应用，专注于提供高质量的问答服务，并支持单问题对话和多问题批量处理两种模式。应用集成了DeepSeek R1、通义千问等模型，通过达摩院DashScope API提供服务。

## 功能特点

- **单问题对话模式**：保持上下文连续性的对话体验
- **多问题批量处理**：一次提交多个问题并获取答案
  - 支持上下文记忆功能：多问题之间保持上下文连贯
  - 支持无上下文独立回答模式：每个问题独立处理
- **数学公式渲染**：自动处理和优化显示LaTeX数学公式
- **思考过程展示**：可查看AI的推理过程，了解答案来源
- **模型选择**：支持DeepSeek R1、通义千问等多种大语言模型
- **会话管理**：创建新对话、保持对话历史

## 技术架构

- **后端**：Flask框架
- **前端**：原生JavaScript + CSS
- **AI接口**：达摩院DashScope API（兼容OpenAI接口）
- **数学渲染**：MathJax

## 快速开始

### 环境要求

- Python 3.7+
- Flask 2.3.3+
- OpenAI 1.77.0+

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/yourusername/multi-question-R1.git
cd multi-question-R1
```

2. 安装依赖
```bash
pip install -r requirements.txt
```

3. 创建环境变量文件
```bash
touch .env
```

4. 编辑.env文件，添加API密钥
```
DASHSCOPE_API_KEY=your_dashscope_api_key_here
SECRET_KEY=your_secret_key_here
```

5. 启动应用
```bash
python app.py
```

应用将在 http://localhost:5004 运行

## 使用指南

### 单问题模式
- 直接在输入框中输入问题并发送
- 系统会保持对话上下文，可以进行连续的交流

### 多问题模式
1. 切换到"多输入模式"
2. 在每个输入框中输入不同的问题或前提条件
3. 使用"添加前置知识"按钮添加更多输入框
4. 选择是否使用上下文记忆功能
   - 勾选"使用上下文记忆"：所有问题在同一上下文中处理
   - 取消勾选：每个问题单独处理
5. 点击"提交所有"按钮获取回答

### 其他功能
- 点击"新对话"按钮开始全新的对话
- 点击"模糊问题"快速插入模糊问题模板
- 点击"查看推理过程"了解AI的思考过程

## API接口

### 单问题对话
- **端点**: `/api/chat`
- **方法**: POST
- **请求体**:
  ```json
  {
    "message": "你的问题",
    "new_conversation": false
  }
  ```

### 多问题批量处理
- **端点**: `/api/multi-ask`
- **方法**: POST
- **请求体**:
  ```json
  {
    "questions": ["问题1", "问题2", "问题3"],
    "use_context": true
  }
  ```

### 创建新对话
- **端点**: `/api/new-conversation`
- **方法**: POST

### 获取可用模型
- **端点**: `/api/models`
- **方法**: GET

## 自定义与扩展

### 添加新模型
编辑`app.py`中的`get_available_models`函数添加新的模型选项。

### 调整服务端口
修改`app.py`文件末尾的端口配置:
```python
app.run(debug=True, host='0.0.0.0', port=5004)
```

## 技术支持与贡献

如有问题或建议，请通过Issues提交反馈。欢迎提交Pull Request贡献代码。

## 许可

[添加您的许可信息] 
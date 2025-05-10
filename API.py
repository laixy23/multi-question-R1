import os
import re
from openai import OpenAI
import matplotlib.pyplot as plt
from matplotlib import rcParams
from IPython.display import display, Markdown, Math


# 设置matplotlib参数，优化数学公式渲染
rcParams['mathtext.fontset'] = 'cm'
rcParams['mathtext.rm'] = 'serif'
rcParams['figure.facecolor'] = 'white'

client = OpenAI(
    # 若没有配置环境变量，请用百炼API Key将下行替换为：api_key="sk-xxx",
    api_key=os.getenv("DASHSCOPE_API_KEY"),  # 如何获取API Key：https://help.aliyun.com/zh/model-studio/developer-reference/get-api-key
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

def render_math_formula(text):
    """渲染LaTeX数学公式"""
    try:
        # 检查文本中是否包含LaTeX公式
        latex_pattern = r'\$(.*?)\$|\\\[(.*?)\\\]|\\\((.*?)\\\)'
        if re.search(latex_pattern, text):
            # 在IPython环境中使用Markdown渲染
            try:
                display(Markdown(text))
                return True
            except:
                pass
            
            # 如果不在IPython环境中，使用matplotlib渲染
            # 提取所有公式
            formulas = re.findall(latex_pattern, text)
            for formula_match in formulas:
                formula = next(f for f in formula_match if f)
                plt.figure(figsize=(8, 1))
                plt.axis('off')
                plt.text(0.5, 0.5, f"${formula}$", size=14, ha='center', va='center')
                plt.tight_layout()
                plt.show()
            return True
    except Exception as e:
        print(f"渲染公式时出错: {e}")
    return False

# 设置查询内容
query = "9.9和9.11谁大"

# 启用流式输出
stream = client.chat.completions.create(
    model="deepseek-r1",  # 此处以 deepseek-r1 为例，可按需更换模型名称。
    messages=[
        {'role': 'user', 'content': query}
    ],
    stream=True  # 启用流式输出
)

# 打印思考过程和最终答案
reasoning_content = ""
content = ""

for chunk in stream:
    # 获取思考过程
    if hasattr(chunk.choices[0].delta, 'reasoning_content') and chunk.choices[0].delta.reasoning_content is not None:
        reasoning_chunk = chunk.choices[0].delta.reasoning_content
        reasoning_content += reasoning_chunk
        print(reasoning_chunk, end="", flush=True)
    
    # 获取最终答案
    if hasattr(chunk.choices[0].delta, 'content') and chunk.choices[0].delta.content is not None:
        content_chunk = chunk.choices[0].delta.content
        content += content_chunk
        print(content_chunk, end="", flush=True)

print("\n\n完整思考过程：")
# 尝试渲染思考过程中的数学公式
if not render_math_formula(reasoning_content):
    print(reasoning_content)

print("\n最终答案：")
# 尝试渲染最终答案中的数学公式
if not render_math_formula(content):
    print(content)

# 示例：如何使用美化后的公式演示
print("\n数学公式美化示例：")
example_formula = "当我们比较 $9.9$ 和 $9.11$ 时，我们可以看到 $9.11 > 9.9$，因为 $9.11 - 9.9 = 0.21 > 0$"
render_math_formula(example_formula)
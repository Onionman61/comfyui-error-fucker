
import { GoogleGenAI, Type } from "@google/genai";
import type { Analysis } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        rootCause: {
            type: Type.OBJECT,
            properties: {
                title: {
                    type: Type.STRING,
                    description: "一个简洁的、一句话的标题，指出核心问题。",
                },
                explanation: {
                    type: Type.STRING,
                    description: "一段详细但易于理解的解释，说明根据错误堆栈，问题出在哪里以及为什么会发生。",
                },
            },
            required: ["title", "explanation"],
        },
        solutions: {
            type: Type.ARRAY,
            description: "一个具体的、步骤化的解决方案列表，用于修复问题。如果可能，请提供至少两种不同的解决方案。",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: "解决方案的简短描述性标题 (例如, '更新自定义节点')。",
                    },
                    steps: {
                        type: Type.ARRAY,
                        description: "一个字符串数组，每个字符串是用户需要遵循的一个清晰步骤。请使用 Markdown 的 `code` 格式（反引号）来包裹文件路径、命令或包名。",
                        items: {
                            type: Type.STRING,
                        },
                    },
                },
                required: ["title", "steps"],
            },
        },
    },
    required: ["rootCause", "solutions"],
};


export async function analyzeComfyUIError(logContent: string): Promise<Analysis> {
    const prompt = `
请使用简体中文进行分析和回答。
你是一个 ComfyUI 专家，任务是分析下面的错误日志。

1.  **根本原因分析:** 从错误堆栈中精准定位导致错误的根本原因。
2.  **提供解决方案:** 为非专业用户提供清晰、可操作的步骤化解决方案。
3.  **格式化要求:** 严格遵守提供的 JSON 结构。在解决方案的步骤中，对于文件路径、命令或技术术语，请使用反引号(\`)包裹以实现代码格式化。

**待分析的错误日志:**
---
${logContent}
---
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: analysisSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);

        if (
            !parsedJson.rootCause ||
            !parsedJson.rootCause.title ||
            !parsedJson.rootCause.explanation ||
            !Array.isArray(parsedJson.solutions)
        ) {
            throw new Error("从 API 收到了格式错误的 JSON 响应。");
        }
        
        return parsedJson as Analysis;

    } catch (error) {
        console.error("调用 Gemini API 时出错:", error);
        if (error instanceof Error && error.message.includes('JSON')) {
             throw new Error("AI 返回了无效的分析格式。请重试。");
        }
        throw new Error("无法从 Gemini API 获取分析结果。");
    }
}

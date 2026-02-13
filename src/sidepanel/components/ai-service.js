export const DEFAULT_SYSTEM_PROMPT = `You are an expert Social Media Strategist and Ghostwriter.

**GOAL:** 
Analyze these bookmarks to generate new, high-potential tweet ideas for me.
Do not explain *what* the bookmarks are. Explain *how* to use their patterns to create new content.`;

export class AIService {
    constructor(provider, apiKey) {
        this.provider = provider;
        this.apiKey = apiKey;
    }



    async callOpenAI(prompt) {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
        });
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content).bookmarks || JSON.parse(data.choices[0].message.content);
    }

    async callGemini(prompt) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text;
        // Clean markdown code blocks if present
        text = text.replace(/```json/g, '').replace(/```/g, '');
        return JSON.parse(text);
    }

    async callGroq(prompt) {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: "llama3-70b-8192",
                messages: [{ role: "user", content: prompt }]
            })
        });
        const data = await response.json();
        // Basic parsing attempt (LLama might add conversational filler)
        let text = data.choices[0].message.content;
        const jsonMatch = text.match(/\[.*\]/s);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }

    async callDeepSeek(prompt) {
        // Assuming OpenAI compatible endpoint for DeepSeek if available, 
        // otherwise standard DeepSeek API structure
        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: "user", content: prompt }]
            })
        });
        const data = await response.json();
        let text = data.choices[0].message.content;
        const jsonMatch = text.match(/\[.*\]/s);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
    async analyzeGlobal(tweets, language = 'English', customInstructions = null, model = null, styleConfig = null) {
        const baseInstructions = customInstructions || DEFAULT_SYSTEM_PROMPT;

        const prompt = `
        ${baseInstructions}
        
        **LANGUAGE:**
        Generate ALL output (Titles, Concepts, Hooks) in **${language}**.

        **REQUIRED OUTPUT STYLES:**
        For each idea, vary the tone/structure based on these selected styles:
        ${this.formatStyleInstructions(styleConfig)}

        **OUTPUT FORMAT (Clean JSON Only):**
        Return a single valid JSON object with this structure:
        {
            "patterns": [
                "Brief bullet point on a recurring hook pattern found",
                "Brief bullet point on a recurring structure found"
            ],
            "ideas": [
                {
                    "title": "Short catchy title for this content angle",
                    "concept": "Explanation of the core idea/angle derived from the bookmarks",
                    "hook": "Write a specific, compelling opening line/hook for this tweet"
                }
            ]
        }
            ]
        }
        (Generate exactly ${this.calculateIdeaCount(styleConfig)} distinct ideas, covering the selected styles)

        **Bookmarks to Analyze:**
        ${JSON.stringify(tweets.map(t => ({ author: t.author, text: t.text })))}
        `;

        let jsonStr = "";
        switch (this.provider) {
            case 'gemini': jsonStr = await this.callGeminiText(prompt, model); break;
            case 'openai': jsonStr = await this.callOpenAIText(prompt, model); break;
            case 'deepseek': jsonStr = await this.callDeepSeekText(prompt, model); break;
            case 'groq': jsonStr = await this.callGroqText(prompt, model); break;
            default: throw new Error("Unknown Provider");
        }

        // Clean and Parse JSON
        try {
            // Remove markdown syntax if present (```json ... ```)
            jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse AI JSON:", jsonStr);
            throw new Error("AI returned invalid JSON. Please try again.");
        }
    }

    async callGeminiText(prompt, model) {
        const modelName = model || "gemini-2.0-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;

        console.log("[AI] Sending request to Gemini...");
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[AI] API Error Response:", data);
            throw new Error(`Gemini API Error: ${data.error?.message || response.statusText}`);
        }

        if (!data.candidates || data.candidates.length === 0) {
            console.warn("[AI] No candidates returned. Safety filter?", data);
            if (data.promptFeedback?.blockReason) {
                throw new Error(`AI Blocked Content: ${data.promptFeedback.blockReason}`);
            }
            throw new Error("AI returned no response. Make sure your API key is valid and has quota.");
        }

        return data.candidates[0].content.parts[0].text;
    }

    async callOpenAIText(prompt, model) {
        console.log("[AI] Sending request to OpenAI...");
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: model || "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[AI] API Error Response:", data);
            throw new Error(`OpenAI API Error: ${data.error?.message || response.statusText}`);
        }

        return data.choices[0].message.content;
    }

    async callDeepSeekText(prompt, model) {
        console.log("[AI] Sending request to DeepSeek...");
        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: model || "deepseek-chat",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[AI] DeepSeek API Error:", data);
            throw new Error(`DeepSeek API Error: ${data.error?.message || response.statusText}`);
        }

        return data.choices[0].message.content;
    }

    async callGroqText(prompt, model) {
        // Assuming Groq works similarly to OpenAI, but with a different endpoint
        console.log("[AI] Sending request to Groq...");
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: model || "llama3-70b-8192", // default model
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[AI] Groq API Error:", data);
            throw new Error(`Groq API Error: ${data.error?.message || response.statusText}`);
        }

        return data.choices[0].message.content;
    }

    formatStyleInstructions(config) {
        if (!config || !config.styles || config.styles.length === 0) return "- General engaging social media content";

        const map = {
            'polemic': '- Short & Polemic (Controversial, bold statements)',
            'educational': '- Educational List (Value-packed, clear steps/points)',
            'reflection': '- Personal Reflection (Vulnerable, storytelling, insight)',
            'practical': '- Practical / How-To (Actionable advice)'
        };

        let instructions = config.styles
            .filter(s => s !== 'custom')
            .map(s => map[s] || `- ${s}`)
            .join('\n        ');

        if (config.styles.includes('custom') && config.customStyle) {
            instructions += `\n        - Custom Style: ${config.customStyle}`;
        }

        return instructions;
    }

    calculateIdeaCount(config) {
        if (!config || !config.styles) return 5;
        // Generate at least one per style, or default to 5 if few styles selected.
        // If user selects 4 styles, maybe generate 4 or 8. Let's aim for 5 minimum or number of styles + 2.
        const styleCount = config.styles.length;
        return Math.max(5, styleCount);
    }
}

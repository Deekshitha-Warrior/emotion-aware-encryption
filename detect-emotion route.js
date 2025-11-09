export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    console.log("Analyzing emotions for text:", text);

    // Use ChatGPT to analyze emotions in the text
    const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are an emotion detection AI. Analyze the given text and identify the emotions present. Return a JSON object with emotions and their confidence scores (0-1). Focus on these emotions: joy, sadness, anger, fear, surprise, disgust, love, anxiety, excitement, disappointment.",
          },
          {
            role: "user",
            content: `Analyze the emotions in this text: "${text}"`,
          },
        ],
        json_schema: {
          name: "emotion_analysis",
          schema: {
            type: "object",
            properties: {
              emotions: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              confidence_scores: {
                type: "array",
                items: {
                  type: "number",
                },
              },
            },
            required: ["emotions", "confidence_scores"],
            additionalProperties: false,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ChatGPT API error:", response.status, errorText);
      throw new Error(
        `ChatGPT API failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log("ChatGPT response:", data);

    if (
      !data.choices ||
      !data.choices[0] ||
      !data.choices[0].message ||
      !data.choices[0].message.content
    ) {
      console.error("Invalid ChatGPT response structure:", data);
      throw new Error("Invalid response structure from ChatGPT");
    }

    let result;
    try {
      result = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error(
        "JSON parse error:",
        parseError,
        "Content:",
        data.choices[0].message.content,
      );
      throw new Error("Failed to parse emotion analysis result");
    }

    if (!result.emotions || !result.confidence_scores) {
      console.error("Missing emotions or confidence_scores in result:", result);
      throw new Error("Invalid emotion analysis result format");
    }

    console.log("Emotion analysis successful:", result);

    return Response.json({
      emotions: result.emotions,
      confidence_scores: result.confidence_scores,
    });
  } catch (error) {
    console.error("Emotion detection error:", error);
    return Response.json(
      {
        error: "Failed to detect emotions",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

import { Response, ResponseMessage } from "./dts";

export async function getChatGPTMessage(
  apiKey: string,
  prompt: string,
  onMessage: (messageResponse: ResponseMessage) => void
) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      // "HTTP-Referer": `${YOUR_SITE_URL}`, // Optional, for including your app on openrouter.ai rankings.
      // "X-Title": `${YOUR_SITE_NAME}`, // Optional. Shows in rankings on openrouter.ai.
      "Content-Type": "application/json",
    },
    // [请求参数](https://openrouter.ai/docs/requests)
    body: JSON.stringify({
      structured_outputs: true,
      max_tokens: 4000,
      presence_penalty: 0.6,
      temperature: 0.5,
      model: "openai/gpt-3.5-turbo-1106",
      // provider: {
      //   order: ["OpenAI", "Mistral 7B Instruct"],
      // },
      stream: true,

      prompt,
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP Error! status ${res.status}`);
  }
  if (!res.body) {
    throw new Error(`No answer!`);
  }

  const reader = res.body.getReader();

  const textDecoder = new TextDecoder();

  let result = true;
  while (result) {
    const { done, value } = await reader.read();

    if (done) {
      result = false;
      break;
    }

    const decodedStrs = textDecoder
      .decode(value)
      .split("\n\n")
      .filter(Boolean) as string[];

    decodedStrs.forEach((str) => {
      const text = str.replace("data:", "");
      try {
        const msg = JSON.parse(text) as Response;
        onMessage({ id: msg.id, text: msg.choices[0]?.text || "" });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        /* empty */
      }
    });
  }

  return true;
}

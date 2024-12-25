import {
  KeyboardEventHandler,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Avatar,
  Container,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  OutlinedInput,
  Snackbar,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PersonIcon from "@mui/icons-material/Person";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import KeyIcon from "@mui/icons-material/Key";
import DoneIcon from "@mui/icons-material/Done";
import { MessageVO, ResponseMessage } from "@/dts";
import { getChatGPTMessage } from "./util";

const App = memo(function App() {
  const listRef = useRef<HTMLUListElement>(null);

  const [messages, setMessages] = useState<MessageVO[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [keyMode, setKeyMode] = useState<boolean>(true);
  const [tipMessage, setTipMessage] = useState<string>("");

  const onMessage = useCallback((res: ResponseMessage) => {
    const { id, text } = res;

    // 增加回复消息或者根据responseId更新回复消息
    setMessages((prev) =>
      prev.some((o) => id === o.responseId)
        ? prev
            .filter((o) => "loading" !== o.responseId)
            .map((o) =>
              id !== o.responseId ? o : { ...o, content: o.content + text }
            )
        : [
            ...prev.filter((o) => "loading" !== o.responseId),
            {
              role: "assistant",
              responseId: id,
              content: text,
            } satisfies MessageVO,
          ]
    );
  }, []);

  const onSend = useCallback(async () => {
    if (!prompt || loading) {
      return;
    }
    // 用户消息
    const userMsg = { role: "user", content: prompt } satisfies MessageVO;
    // 用户消息
    const loadingMsg = {
      role: "assistant",
      responseId: "loading",
      content: "loading...",
    } satisfies MessageVO;
    // 构建新对话上下文
    const newMessages = [...messages, userMsg];
    // 增加聊天消息
    setMessages([...newMessages, loadingMsg]);
    // 清空输入框
    setPrompt("");

    // 获取机器人消息并更新
    setLoading(true);
    await getChatGPTMessage(apiKey, newMessages, onMessage).catch(
      (error: Error) => {
        console.error(error);
        setMessages((prev) => prev.filter((o) => "loading" !== o.responseId));
        setTipMessage(error.message || "出错了!");
      }
    );
    setLoading(false);
  }, [apiKey, prompt, messages, onMessage, loading]);

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight });
    }
  }, []);

  const onSetApiKey = useCallback(() => {
    setApiKey(prompt);
    setPrompt("");
    setKeyMode(false);
    setTipMessage("API key 设置完成");
  }, [prompt]);

  const onKeyDown = useCallback<KeyboardEventHandler>(
    ({ key, keyCode }) => {
      if ("enter" === key.toLowerCase() || 13 === keyCode) {
        if (!keyMode) {
          onSend();
        } else {
          onSetApiKey();
        }
      }
    },
    [keyMode, onSend, onSetApiKey]
  );

  // 有新消息更新触发滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom, messages]);

  return (
    <Container
      maxWidth="sm"
      className="h-full flex flex-col justify-between py-4"
    >
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={!!tipMessage}
        onClose={() => setTipMessage("")}
        autoHideDuration={3000}
        message={tipMessage}
      />

      <List
        className="flex-grow-0 overflow-x-hidden overflow-y-auto"
        ref={listRef}
      >
        {messages.map(({ role, content }, i) => {
          const isUser = "user" === role;
          const primaryMap: Record<MessageVO["role"], string> = {
            user: "You",
            assistant: "ChatGPT",
          };
          return (
            <ListItem key={i} alignItems="flex-start">
              <ListItemAvatar>
                <Avatar className={isUser ? "!bg-[orange]" : "!bg-green-300"}>
                  {isUser ? <PersonIcon /> : <SmartToyIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={primaryMap[role]} secondary={content} />
            </ListItem>
          );
        })}
      </List>

      <OutlinedInput
        className="w-full shrink-0"
        type="text"
        placeholder={
          !keyMode ? "给“ChatGPT”发送消息" : "输入“OpenRouter API key”"
        }
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        startAdornment={
          !keyMode && (
            <InputAdornment position="start" title="修改“OpenRouter API key”">
              <IconButton onClick={() => setKeyMode((b) => !b)} edge="start">
                <KeyIcon />
              </IconButton>
            </InputAdornment>
          )
        }
        endAdornment={
          <InputAdornment position="end">
            {!keyMode ? (
              <IconButton
                aria-label="send message"
                onClick={onSend}
                edge="end"
                disabled={!prompt || loading || !apiKey}
              >
                <SendIcon />
              </IconButton>
            ) : (
              <IconButton
                aria-label="set api key"
                onClick={onSetApiKey}
                edge="end"
                disabled={!prompt || loading}
              >
                <DoneIcon />
              </IconButton>
            )}
          </InputAdornment>
        }
        onKeyDown={onKeyDown}
      />
    </Container>
  );
});

export default App;

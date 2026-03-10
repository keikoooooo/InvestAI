import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, AlertCircle } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { api } from "../lib/api";
import { LOCALE_TAG, useI18n } from "../i18n";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

const suggestedQuestionKeys = [
  "ai.suggest.q1",
  "ai.suggest.q2",
  "ai.suggest.q3",
  "ai.suggest.q4",
];

export function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useI18n();
  const localeTag = LOCALE_TAG[locale];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    api.get<{ messages: Message[] }>("/ai/messages").then((res) => setMessages(res.messages || [])).catch(() => setMessages([]));
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    setInput("");
    setIsTyping(true);

    const tempUser: Message = { id: `tmp-${Date.now()}`, role: "user", content: messageText, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, tempUser]);

    try {
      const response = await api.post<Message>("/ai/chat", { message: messageText });
      setMessages((prev) => [...prev.filter((m) => m.id !== tempUser.id), tempUser, response]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center"><Sparkles className="w-6 h-6 text-white" /></div>
            <div><h1 className="text-2xl font-bold">{t("ai.title")}</h1><p className="text-sm text-muted-foreground">{t("ai.subtitle")}</p></div>
          </div>
        <div className="flex flex-wrap gap-2 mt-4">{suggestedQuestionKeys.map((key) => <Button key={key} variant="outline" size="sm" onClick={() => handleSend(t(key))} className="text-xs">{t(key)}</Button>)}</div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${message.role === "assistant" ? "bg-gradient-to-br from-primary to-blue-600" : "bg-muted"}`}>
                {message.role === "assistant" ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5" />}
              </div>
              <div className={`flex-1 max-w-[80%] ${message.role === "user" ? "items-end" : ""}`}>
                <div className={`rounded-2xl p-4 ${message.role === "assistant" ? "bg-accent" : "bg-primary text-primary-foreground"}`}><div className="whitespace-pre-wrap">{message.content}</div></div>
                <div className="text-xs text-muted-foreground mt-1 px-2">{new Date(message.timestamp).toLocaleTimeString(localeTag, { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          ))}

          {isTyping && <div className="flex gap-3"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div><div className="bg-accent rounded-2xl p-4">...</div></div>}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input placeholder={t("ai.inputPlaceholder")} value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
            <Button onClick={() => handleSend()} disabled={!input.trim()}><Send className="w-4 h-4" /></Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{t("ai.disclaimer")}</p>
        </div>
      </Card>
    </div>
  );
}

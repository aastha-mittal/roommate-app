import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { io } from "socket.io-client";
import { chat as chatApi, match as matchApi, getToken, type Message, type MatchListItem } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [matchInfo, setMatchInfo] = useState<MatchListItem | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchId) return;
    Promise.all([
      chatApi.messages(matchId),
      matchApi.list(),
    ]).then(([msgRes, matchRes]) => {
      setMessages(msgRes.messages);
      const m = matchRes.matches.find((x) => x.matchId === matchId);
      setMatchInfo(m ?? null);
    }).finally(() => setLoading(false));
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const socket = io({ path: "/ws", auth: { token }, transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
    socket.on("message:new", (message: Message) => {
      if (message.matchId === matchId) setMessages((prev) => [...prev, message]);
    });
    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [matchId]);

  const sendMessage = async () => {
    const body = input.trim();
    if (!body || !matchId || sending) return;
    setSending(true);
    setInput("");
    try {
      const msg = await chatApi.send(matchId, body);
      setMessages((prev) => [...prev, msg]);
    } finally {
      setSending(false);
    }
  };

  if (loading || !matchId) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const otherEmail = matchInfo?.otherEmail ?? "Match";

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 pb-4 border-b border-stone-200">
        <Link to="/matches" className="text-stone-500 hover:text-stone-700">←</Link>
        <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center font-display font-semibold text-amber-900">
          {otherEmail[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-stone-800 truncate">{otherEmail}</p>
          {socketConnected && <p className="text-xs text-green-600">Connected</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  isMe ? "bg-amber-500 text-white rounded-br-md" : "bg-stone-200 text-stone-800 rounded-bl-md"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        className="flex gap-2 pt-4"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-400 outline-none"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="py-3 px-5 rounded-xl bg-amber-500 text-white font-medium disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

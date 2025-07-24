"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { initiateChatSession, getCase, Case } from "@/lib/api";
import { Mic } from "lucide-react";

// PRIME REACT EDITOR
import { Editor } from "primereact/editor";

// shadcn Breadcrumb
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function InterviewPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: "user" | "ai"; text: string; id?: string }>
  >([]);
  const [isLoadingInitialMessage, setIsLoadingInitialMessage] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAiResponseId, setLastAiResponseId] = useState<string>();

  // WebSocket / follow‑up
  const [wsClient, setWsClient] = useState<WebSocket | null>(null);
  const [isFollowUpMode, setIsFollowUpMode] = useState(false);
  const [showFollowUpButton, setShowFollowUpButton] = useState(true);

  // Timer (follow‑up: 5‑minute countdown)
  const [timeLeft, setTimeLeft] = useState(300);
  const [timerActive, setTimerActive] = useState(false);

  // Interview timer (5‑minute countdown)
  const [interviewTimeLeft, setInterviewTimeLeft] = useState(300);
  const [interviewTimerActive, setInterviewTimerActive] = useState(false);

  const [showProceedDialog, setShowProceedDialog] = useState(false);

  // → Proceed‑to‑Interview / Editor mode
  const [proceedToInterviewMode, setProceedToInterviewMode] = useState(false);
  const [editorContent, setEditorContent] = useState<string>("");

  // → Track which question we’re on
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // ── Build the accordion sections ──
  const accordionSections = React.useMemo(() => {
    if (!currentCase) return [];
    const d = currentCase.description;
    const hints = d.global_hints || [];

    return [
      {
        value: "client-goal",
        title: "Client Goal",
        content: (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {d.client_goal}
          </ReactMarkdown>
        ),
      },
      {
        value: "client-description",
        title: "Client Description",
        content: (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {d.client_description}
          </ReactMarkdown>
        ),
      },
      {
        value: "situation-description",
        title: "Situation Description",
        content: (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {d.situation_description}
          </ReactMarkdown>
        ),
      },
      d.company_study
        ? {
            value: "company-study",
            title: "Company Study",
            content: (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {d.company_study}
              </ReactMarkdown>
            ),
          }
        : null,
      {
        value: "hints",
        title: "Hints",
        content: (
          <ul className="list-disc pl-5 space-y-1">
            {hints.map((hint, i) => (
              <li key={i}>{hint}</li>
            ))}
          </ul>
        ),
      },
    ].filter(Boolean) as {
      value: string;
      title: string;
      content: React.ReactNode;
    }[];
  }, [currentCase]);

  // ── Load case & start initial chat ──
  useEffect(() => {
    const caseId = localStorage.getItem("selectedCaseId");
    if (!caseId) {
      setError("No case selected. Please go back and select a case.");
      setIsLoadingInitialMessage(false);
      return;
    }
    (async () => {
      try {
        setIsLoadingInitialMessage(true);
        setError(null);

        const c = await getCase(caseId);
        setCurrentCase(c);

        const init = await initiateChatSession(caseId);
        setChatMessages([{ sender: "ai", text: init.ai_message, id: init.response_id }]);
        setLastAiResponseId(init.response_id);
      } catch (e: any) {
        setError(e.message || "Failed to load case or start chat.");
      } finally {
        setIsLoadingInitialMessage(false);
      }
    })();
  }, [router]);

  // ── Follow‑up timer logic ──
  useEffect(() => {
    if (!timerActive) return;
    if (timeLeft <= 0) {
      setTimerActive(false);
      setShowProceedDialog(true);
      setChatMessages((p) => [...p, { sender: "ai", text: "Time is up." }]);
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timerActive, timeLeft]);

  // ── Interview timer start/stop ──
  useEffect(() => {
    if (proceedToInterviewMode) {
      setInterviewTimeLeft(300);
      setInterviewTimerActive(true);
    } else {
      setInterviewTimerActive(false);
    }
  }, [proceedToInterviewMode]);

  // ── Interview timer countdown ──
  useEffect(() => {
    if (!interviewTimerActive) return;
    if (interviewTimeLeft <= 0) {
      setInterviewTimerActive(false);
      setChatMessages((p) => [...p, { sender: "ai", text: "Interview time is up." }]);
      return;
    }
    const id = setInterval(() => setInterviewTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [interviewTimerActive, interviewTimeLeft]);

  // ── Auto‑scroll chat ──
  const chatContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // ── WebSocket follow‑up handlers ──
  useEffect(() => {
    if (!wsClient) return;

    wsClient.onopen = () => {
      setChatMessages((p) => [...p, { sender: "ai", text: "You can now ask follow‑up questions." }]);
      setIsSendingMessage(false);
    };
    wsClient.onmessage = (evt) => {
      setIsSendingMessage(false);
      const data = JSON.parse(evt.data);
      if (data.error) {
        setError(data.error);
        setChatMessages((p) => [...p, { sender: "ai", text: `Error: ${data.error}` }]);
      } else {
        setChatMessages((p) => [...p, { sender: "ai", text: data.ai_message, id: data.response_id }]);
        setLastAiResponseId(data.response_id);
      }
    };
    wsClient.onerror = () => {
      setError("WebSocket error — please restart follow‑up.");
      wsClient.close();
      setWsClient(null);
      setIsFollowUpMode(false);
      setShowFollowUpButton(true);
    };
    wsClient.onclose = (e) => {
      if (isFollowUpMode && e.code === 1000) {
        setChatMessages((p) => [...p, { sender: "ai", text: "Follow‑up session ended." }]);
      }
      setWsClient(null);
      setIsFollowUpMode(false);
      if (![1000, 1005].includes(e.code)) setShowFollowUpButton(true);
    };
    return () => {
      if (wsClient.readyState === WebSocket.OPEN) wsClient.close(1000, "cleanup");
    };
  }, [wsClient, isFollowUpMode]);

  const formatTime = (secs: number) =>
    [Math.floor(secs / 3600), Math.floor((secs % 3600) / 60), secs % 60]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");

  const formatInterviewTime = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s} minutes left`;
  };

  const handleStartFollowUp = () => {
    if (!currentCase?.id || !lastAiResponseId) {
      setError("Missing case ID or context for follow‑up.");
      return;
    }
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_WS_BACKEND_HOST || "localhost:8000";
    const ws = new WebSocket(`${proto}//${host}/ws/chat/${currentCase.id}/${lastAiResponseId}`);
    setWsClient(ws);
    setIsFollowUpMode(true);
    setShowFollowUpButton(false);
    setIsSendingMessage(true);
    setError(null);
    setTimeLeft(300);
    setTimerActive(true);
  };

  const handleProceedToInterview = () => {
    setTimerActive(false);
    setShowProceedDialog(true);
  };

  const onSend = () => {
    if (!inputValue.trim() || isSendingMessage) return;
    const txt = inputValue.trim();
    setChatMessages((p) => [...p, { sender: "user", text: txt }]);
    setInputValue("");

    if (isFollowUpMode && wsClient?.readyState === WebSocket.OPEN) {
      wsClient.send(txt);
      setIsSendingMessage(true);
    } else {
      setError("Start follow‑up first.");
      setChatMessages((p) => p.slice(0, -1));
    }
  };

  const questions = currentCase?.description.questions || [];

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      {/* Top Bar */}
      <header className="w-full bg-black border-b border-gray-500 p-4 flex justify-between items-center">
        <a href="/">
          <h2 className="text-lg font-semibold">Case Interview Chat</h2>
        </a>
        {/* Show follow-up timer when not in editor mode */}
        {!proceedToInterviewMode && timerActive && (
          <div className="text-right">
            <span className="text-sm text-gray-400">Timer</span>
            <div
              className={`text-lg font-semibold ${
                timeLeft <= 120 ? "text-red-500" : "text-green-500"
              }`}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
        )}
        {/* Interview timer: horizontally aligned, mm:ss format */}
        {proceedToInterviewMode && interviewTimerActive && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Interview Timer:</span>
            <span
              className={`text-lg font-semibold ${
                interviewTimeLeft <= 120 ? "text-red-500" : "text-green-500"
              }`}
            >
              {formatInterviewTime(interviewTimeLeft)}
            </span>
          </div>
        )}
      </header>

      {/* Two‑panel layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel */}
        <ResizablePanel
          defaultSize={60}
          minSize={60}
          maxSize={60}
          className="border-r border-gray-500 bg-black flex flex-col min-h-0"
        >
          <div
            className={`p-4 flex-1 min-h-0 ${
              proceedToInterviewMode ? "flex flex-col" : "overflow-auto"
            }`}
          >
            {proceedToInterviewMode ? (
              <Editor
                className="flex-1 h-full"
                value={editorContent}
                onTextChange={(e) =>
                  setEditorContent(e.htmlValue ?? "")
                }
              />
            ) : isLoadingInitialMessage ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-2">
                {accordionSections.map((sec) => (
                  <AccordionItem key={sec.value} value={sec.value}>
                    <AccordionTrigger className="text-lg md:text-xl">
                      {sec.title}
                    </AccordionTrigger>
                    <AccordionContent className="text-base md:text-lg">
                      {sec.content}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Right Panel */}
        <ResizablePanel
          defaultSize={40}
          minSize={40}
          maxSize={40}
          className="flex flex-col bg-black"
        >
          {/* breadcrumbs */}
          {proceedToInterviewMode && questions.length > 0 && (
            <div className="border-b border-gray-600 bg-gray-900 px-4 py-2">
              <Breadcrumb>
                <BreadcrumbList>
                  {questions.map((_, i) => (
                    <React.Fragment key={i}>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <button
                            className={
                              i === currentQuestionIndex
                                ? "text-white font-semibold"
                                : "text-gray-400 hover:underline"
                            }
                            onClick={() => setCurrentQuestionIndex(i)}
                          >
                            Question {i + 1}
                          </button>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {i < questions.length - 1 && (
                        <BreadcrumbSeparator />
                      )}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          )}

          {/* question text */}
          {proceedToInterviewMode &&
            questions[currentQuestionIndex] && (
              <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
                <h3 className="text-white text-lg font-semibold">
                  Question {currentQuestionIndex + 1}
                </h3>
                <p className="mt-1 text-gray-200">
                  {questions[currentQuestionIndex].text}
                </p>
              </div>
            )}

          {/* chat */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-6 overflow-y-auto space-y-4"
          >
            {isLoadingInitialMessage && (
              <div className="text-center text-gray-400">
                Loading initial chat...
              </div>
            )}
            {error && !isFollowUpMode && (
              <div className="text-center text-red-500 p-2 bg-red-900 rounded">
                {error}
              </div>
            )}
            <div className="flex flex-col space-y-2">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.sender === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-lg shadow-sm max-w-xs md:max-w-md ${
                      msg.sender === "user"
                        ? "bg-gray-700"
                        : "bg-gray-800"
                    }`}
                  >
                    <span className="whitespace-pre-wrap">
                      {msg.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* input */}
          <div className="border-t border-gray-500 px-4 py-3 bg-black">
            {showFollowUpButton && !isFollowUpMode && (
              <div className="mb-2 space-y-2">
                <Button
                  onClick={handleStartFollowUp}
                  className="w-full bg-blue-600 hover:bg-blue-500"
                  disabled={
                    isLoadingInitialMessage || !!error || !lastAiResponseId
                  }
                >
                  Ask Follow‑up Questions
                </Button>
                <Button
                  variant="success"
                  onClick={handleProceedToInterview}
                  className="w-full"
                  disabled={isLoadingInitialMessage || !!error}
                >
                  Directly Proceed to Interview
                </Button>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-full hover:bg-gray-800">
                <Mic className="w-5 h-5 text-white" />
              </button>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  isLoadingInitialMessage
                    ? "Loading..."
                    : isFollowUpMode
                    ? wsClient && wsClient.readyState === WebSocket.OPEN
                      ? "Ask follow‑up question..."
                      : "Connecting..."
                    : "Select an option above..."
                }
                disabled={
                  isLoadingInitialMessage ||
                  (!isFollowUpMode && showFollowUpButton) ||
                  (isFollowUpMode &&
                    (!wsClient || wsClient.readyState !== WebSocket.OPEN)) ||
                  isSendingMessage
                }
                className="flex-1 bg-gray-900 placeholder-gray-500 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
              />
              <Button
                variant="default"
                onClick={onSend}
                disabled={
                  !isFollowUpMode ||
                  !wsClient ||
                  wsClient.readyState !== WebSocket.OPEN ||
                  isSendingMessage ||
                  !inputValue.trim()
                }
                className="bg-gray-600 hover:bg-gray-500"
              >
                {isSendingMessage ? "..." : "Send"}
              </Button>
            </div>

            {timerActive && (
              <div className="mt-2">
                <Button
                  variant="success"
                  size="sm"
                  className="w-full"
                  onClick={handleProceedToInterview}
                >
                  Proceed to Interview
                </Button>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <AlertDialog
        open={showProceedDialog}
        onOpenChange={setShowProceedDialog}
      >
        <AlertDialogContent className="bg-black text-white p-6 rounded-lg shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Proceed to Interview?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end space-x-3">
            <AlertDialogAction asChild>
              <Button
                variant="success"
                onClick={() => {
                  setShowProceedDialog(false);
                  setShowFollowUpButton(false);
                  setTimerActive(false);
                  setProceedToInterviewMode(true);
                }}
              >
                Yes
              </Button>
            </AlertDialogAction>
            <AlertDialogCancel asChild>
              <Button variant="outline" className="text-white">
                No
              </Button>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

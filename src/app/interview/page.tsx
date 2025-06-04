// app/interview/page.tsx
"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react"; // Added useRef
import { useRouter } from "next/navigation"; // Added useRouter
import { SlashIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { initiateChatSession, AIResponseMessage } from "@/lib/api"; // followUpChat removed

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// TIPTAP imports:
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";

// ── REQUIRED: import TextStyle before FontFamily/FontSize ──
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import FontSize from "@tiptap/extension-font-size";

// ShadCN AlertDialog imports:
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

// List of available font families:
const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
];

// Wacky & cool font sizes based on popularity:
const FONT_SIZES = [
  { label: "Default", value: "" },
  { label: "Tiny (8px)", value: "8px" },
  { label: "Mini (11px)", value: "11px" },
  { label: "Standard (14px)", value: "14px" },
  { label: "Large (18px)", value: "18px" },
  { label: "Huge (32px)", value: "32px" },
  { label: "Gigantic (48px)", value: "48px" },
  { label: "Monstrous (64px)", value: "64px" },
  { label: "Colossal (96px)", value: "96px" },
];

export default function InterviewPage() {
  const router = useRouter();
  // State for the chat input:
  const [inputValue, setInputValue] = React.useState("");
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; id?: string }>>([]);
  const [isLoadingInitialMessage, setIsLoadingInitialMessage] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false); // To disable input while sending
  const [error, setError] = useState<string | null>(null);
  const [lastAiResponseId, setLastAiResponseId] = useState<string | undefined>(undefined);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // WebSocket related state
  const [wsClient, setWsClient] = useState<WebSocket | null>(null);
  const [isFollowUpMode, setIsFollowUpMode] = useState(false);
  const [showFollowUpButton, setShowFollowUpButton] = useState(false);


  // State to track which font family/size is active:
  const [currentFontFamily, setCurrentFontFamily] = React.useState("");
  const [currentFontSize, setCurrentFontSize] = React.useState("");

  // State for current question (1-based) - This might be driven by AI responses later
  const [currentQuestion, setCurrentQuestion] = useState<number>(1);


  useEffect(() => {
    const caseId = localStorage.getItem("selectedCaseId");
    if (caseId) {
      setCurrentCaseId(caseId);
      const fetchInitialMessage = async () => {
        try {
          setIsLoadingInitialMessage(true);
          setError(null);
          const initialResponse = await initiateChatSession(caseId);
          setChatMessages([{ sender: "ai", text: initialResponse.ai_message, id: initialResponse.response_id }]);
          setLastAiResponseId(initialResponse.response_id);
          setShowFollowUpButton(true); // Show button after initial message
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load initial chat message.");
          setChatMessages([]); // Clear messages on error
        } finally {
          setIsLoadingInitialMessage(false);
        }
      };
      fetchInitialMessage();
    } else {
      // Handle case where no caseId is found, e.g., redirect or show error
      setError("No case selected. Please go back and select a case.");
      setIsLoadingInitialMessage(false);
      // Optionally redirect:
      // router.push('/');
    }
  }, [router]);


  // Scroll to bottom of chat messages when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);


  // Effect for WebSocket event handlers
  useEffect(() => {
    if (!wsClient) {
      return;
    }

    wsClient.onopen = () => {
      console.log("WebSocket connected for follow-up.");
      setChatMessages(prev => [...prev, { sender: "ai", text: "Follow-up Q&A session started. Ask your questions."}]);
      setIsSendingMessage(false); // Enable input
    };

    wsClient.onmessage = (event) => {
      setIsSendingMessage(false); // Re-enable input after receiving a message
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          console.error("WebSocket message error:", data.error);
          setError(data.error);
          setChatMessages(prev => [...prev, { sender: "ai", text: `Error: ${data.error}` }]);
        } else {
          setChatMessages(prev => [...prev, { sender: "ai", text: data.ai_message, id: data.response_id }]);
          setLastAiResponseId(data.response_id); // Update lastAiResponseId with the new one from WebSocket
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message or unexpected format:", event.data, e);
        setError("Received malformed message from server.");
        setChatMessages(prev => [...prev, { sender: "ai", text: "Received an unreadable message from the server." }]);
      }
    };

    wsClient.onerror = (errorEvent) => {
      console.error("WebSocket error:", errorEvent);
      setError("WebSocket connection error. Please try starting the follow-up session again.");
      setChatMessages(prev => [...prev, { sender: "ai", text: "Connection error during follow-up. Session ended."}]);
      setIsFollowUpMode(false);
      setIsSendingMessage(false);
      setWsClient(null);
      setShowFollowUpButton(true);
    };

    wsClient.onclose = (closeEvent) => {
      console.log("WebSocket disconnected:", closeEvent.reason, closeEvent.code);
      // Avoid duplicate "session ended" if it was due to an error handled by onerror
      if (!error && isFollowUpMode) {
         setChatMessages(prev => [...prev, { sender: "ai", text: "Follow-up Q&A session ended."}]);
      }
      setIsFollowUpMode(false);
      setIsSendingMessage(false);
      setWsClient(null);
      // Only show follow up button if closure was unexpected or error
      if (closeEvent.code !== 1000 && closeEvent.code !== 1005) { // 1000 = Normal Closure, 1005 = No Status Recvd
        setShowFollowUpButton(true);
      }
    };

    return () => {
      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.close(1000, "Client navigating away or component unmounting");
      }
      // setWsClient(null); // Already handled in onclose/onerror
    };
  }, [wsClient, error, isFollowUpMode]); // Dependencies for the WebSocket effect


  // Initialize TipTap editor, ensuring TextStyle appears before the font extensions:
  const editor = useEditor({
    extensions: [
      StarterKit, // Basic formatting: bold, italic, strike, headings, lists, blockquote, codeBlock, etc.
      Underline, // Underline support
      LinkExtension.configure({ openOnClick: false }), // Link insertion
      TextStyle, // ── Must register textStyle mark first
      FontFamily.configure({
        types: ["textStyle"], // Target textStyle for font-family
      }),
      FontSize.configure({
        types: ["textStyle"], // Target textStyle for font-size
      }),
    ],
    content: "<p>Type your notes here…</p>",
    editorProps: {
      attributes: {
        class:
          // Dark background + white text for the editable area
          "min-h-[300px] w-full outline-none p-3 bg-black text-white placeholder-gray-500",
      },
    },
    onUpdate: ({ editor }) => {
      // Whenever selection/content changes, read the active textStyle attributes:
      const attrs = editor.getAttributes("textStyle");
      setCurrentFontFamily(attrs.fontFamily || "");
      setCurrentFontSize(attrs.fontSize || "");
    },
  });

  // Handler for "Send" button in chat:
  const handleStartFollowUp = () => {
    if (!currentCaseId || !lastAiResponseId) {
      setError("Cannot start follow-up: Case ID or initial context is missing.");
      return;
    }
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        console.log("WebSocket already open.");
        setIsFollowUpMode(true); // Ensure mode is set
        return;
    }

    // Determine WebSocket protocol based on window.location.protocol
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Use window.location.host for host and port, assuming backend is on same host or proxied.
    // For local dev, direct port might be needed if proxy doesn't handle WS.
    // For now, using localhost:8000 as per original plan for backend.
    // This needs to be configurable for deployment.
    const backendHost = process.env.NEXT_PUBLIC_WS_BACKEND_HOST || "localhost:8000";

    const wsUrl = `${wsProtocol}//${backendHost}/ws/chat/${currentCaseId}/${lastAiResponseId}`; // Reverted to original URL
    
    console.log(`Attempting to connect to WebSocket: ${wsUrl}`); // Reverted log message
    
    const newWs = new WebSocket(wsUrl);
    setWsClient(newWs);
    setIsFollowUpMode(true);
    setShowFollowUpButton(false); // Hide button once follow-up starts
    setIsSendingMessage(true); // Disable input until connection is established
    setError(null);
  };


  const onSend = async () => {
    if (inputValue.trim() === "" || isSendingMessage) return;
    const userMessageText = inputValue.trim();
    setChatMessages((prevMessages) => [...prevMessages, { sender: "user", text: userMessageText }]);
    setInputValue("");

    if (isFollowUpMode && wsClient && wsClient.readyState === WebSocket.OPEN) {
      setError(null); // Clear previous errors on new send attempt
      wsClient.send(userMessageText);
      setIsSendingMessage(true); // Disable input while waiting for AI response via WebSocket
    } else if (isFollowUpMode) {
      setError("Follow-up session not active or WebSocket not connected. Please try starting the follow-up session.");
      // Re-add user message to input if send failed before WS connection
      setInputValue(userMessageText);
      setChatMessages(prev => prev.slice(0, -1)); // Remove optimistic user message
    } else {
      // This case should not be reached if UI is managed correctly,
      // as onSend should only be callable in follow-up mode after this change.
      console.warn("onSend called outside of follow-up mode or without WebSocket.");
    }
  };

  // When the user selects a font family from the dropdown:
  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const font = e.target.value;
    if (!editor) return;

    if (font === "") {
      // Unset fontFamily if "Default" is selected
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(font).run();
    }
    setCurrentFontFamily(font);
  };

  // When the user selects a font size from the dropdown:
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value;
    if (!editor) return;

    if (size === "") {
      // Unset fontSize if "Default" is selected
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(size).run();
    }
    setCurrentFontSize(size);
  };

  // Clear the entire editor content (called after confirmation)
  const clearEditorContent = () => {
    if (!editor) return;
    // Simply reset to an empty paragraph
    editor.commands.setContent("<p></p>");
  };

  // Handlers for Next/Previous question buttons
  const showPreviousQuestion = () => {
    setCurrentQuestion((prev) => Math.max(prev - 1, 1));
  };
  const showNextQuestion = () => {
    setCurrentQuestion((prev) => Math.min(prev + 1, 3));
  };

  // If desired: reset or load content when question changes
  // For now, we keep the same editor content per question

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      {/* ───────── Top Bar ───────── */}
      <header className="w-full bg-black border-b border-gray-500 p-4">
        <h2 className="text-lg font-semibold">Case Interview Chat</h2>
      </header>

      {/* ───────── Two‐Panel Layout (locked at 60% / 40%) ───────── */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* ───────── Left Pane: fixed at 60% ───────── */}
        <ResizablePanel
          defaultSize={60}
          minSize={60}
          maxSize={60}
          className="border-r border-gray-500 bg-black flex flex-col"
        >
          {/* ─── Toolbar ─── */}
          <div className="flex flex-wrap items-center gap-1 bg-gray-900 p-2 border-b border-gray-700">
            {/* ── Font Family Dropdown ── */}
            <select
              value={currentFontFamily}
              onChange={handleFontFamilyChange}
              className="bg-gray-700 text-white px-2 py-1 rounded focus:outline-none"
            >
              {FONT_FAMILIES.map((ff) => (
                <option key={ff.value} value={ff.value}>
                  {ff.label}
                </option>
              ))}
            </select>

            {/* ── Font Size Dropdown ── */}
            <select
              value={currentFontSize}
              onChange={handleFontSizeChange}
              className="bg-gray-700 text-white px-2 py-1 rounded focus:outline-none"
            >
              {FONT_SIZES.map((fs) => (
                <option key={fs.value} value={fs.value}>
                  {fs.label}
                </option>
              ))}
            </select>

            {/* ── Bold ── */}
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`px-2 py-1 rounded ${
                editor?.isActive("bold")
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <strong>B</strong>
            </button>

            {/* ── Italic ── */}
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`px-2 py-1 rounded ${
                editor?.isActive("italic")
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <em>I</em>
            </button>

            {/* ── Underline ── */}
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={`px-2 py-1 rounded ${
                editor?.isActive("underline")
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <u>U</u>
            </button>

            {/* ── Strikethrough ── */}
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              className={`px-2 py-1 rounded ${
                editor?.isActive("strike")
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <s>S</s>
            </button>

            {/* ── Horizontal Rule ── */}
            <button
              type="button"
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
              className="px-2 py-1 rounded text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              ―
            </button>

            {/* ── Clear Formatting (with confirmation) ── */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="ml-auto px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-700">
                  Clear
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-black text-white p-6 rounded-lg shadow-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-semibold">
                    Clear All Notes?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="mt-2 text-gray-300">
                    This will erase everything in your notepad. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 flex justify-end space-x-3">
                  <AlertDialogCancel asChild>
                    <button className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600">
                      Cancel
                    </button>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <button
                      onClick={clearEditorContent}
                      className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                    >
                      Confirm Clear
                    </button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* ─── Breadcrumb (on top of editor) ─── */}
          <div className="bg-gray-800 border-b border-gray-700 p-3">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <button
                      onClick={() => setCurrentQuestion(1)}
                      className={`px-1 ${
                        currentQuestion === 1
                          ? "text-white font-medium"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      Question 1
                    </button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <SlashIcon className="text-gray-500" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <button
                      onClick={() => setCurrentQuestion(2)}
                      className={`px-1 ${
                        currentQuestion === 2
                          ? "text-white font-medium"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      Question 2
                    </button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <SlashIcon className="text-gray-500" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <button
                      onClick={() => setCurrentQuestion(3)}
                      className={`px-1 ${
                        currentQuestion === 3
                          ? "text-white font-medium"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      Question 3
                    </button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* ─── Editor Content Area ─── */}
          <div className="relative flex-1 overflow-auto p-2">
            {editor ? (
              <EditorContent editor={editor} />
            ) : (
              <div className="text-gray-500">Loading editor…</div>
            )}

            {/* ─── Prev/Next Buttons (bottom-right) ─── */}
            <div className="absolute bottom-4 right-4 flex space-x-2">
              <button
                onClick={showPreviousQuestion}
                disabled={currentQuestion === 1}
                className={`flex items-center px-3 py-1 rounded ${
                  currentQuestion === 1
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gray-600 hover:bg-gray-500 text-white"
                }`}
              >
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                Prev
              </button>
              <button
                onClick={showNextQuestion}
                disabled={currentQuestion === 3}
                className={`flex items-center px-3 py-1 rounded ${
                  currentQuestion === 3
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gray-600 hover:bg-gray-500 text-white"
                }`}
              >
                Next
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </ResizablePanel>

        {/* ───────── Divider / Handle (non‐movable) ───────── */}
        <ResizableHandle />

        {/* ───────── Right Pane: fixed at 40% ───────── */}
        <ResizablePanel
          defaultSize={40}
          minSize={40}
          maxSize={40}
          className="flex flex-col bg-black"
        >
          {/* Chat History */}
          <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4">
            {isLoadingInitialMessage && <div className="text-center text-gray-400">Loading initial chat...</div>}
            {error && !isFollowUpMode && <div className="text-center text-red-500 p-2 bg-red-900 rounded">{error}</div>}
            {!isLoadingInitialMessage && !error && chatMessages.length === 0 && !isFollowUpMode && (
              <div className="text-center text-gray-400">Initializing session...</div>
            )}
            <div className="flex flex-col space-y-2">
              {chatMessages.map((msg, index) => (
                <div
                  key={index} // Consider more stable keys if messages can be reordered/deleted
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-4 py-2 rounded-lg shadow-sm max-w-xs md:max-w-md lg:max-w-lg ${
                      msg.sender === "user"
                        ? "bg-gray-700 text-white self-end"
                        : "bg-gray-800 text-white self-start"
                    }`}
                  >
                    <span className="text-white whitespace-pre-wrap">{msg.text}</span>
                  </div>
                </div>
              ))}
            </div>
             {error && isFollowUpMode && <div className="text-center text-red-500 p-2 bg-red-900 rounded mt-2">{error}</div>}
          </div>

          {/* Follow-up Button and Input Area */}
          <div className="border-t border-gray-500 px-4 py-3 bg-black">
            {showFollowUpButton && !isFollowUpMode && (
              <Button
                onClick={handleStartFollowUp}
                className="w-full mb-2 bg-blue-600 hover:bg-blue-500 text-white"
                disabled={isLoadingInitialMessage || !!error || !lastAiResponseId}
              >
                Ask Follow-up Questions
              </Button>
            )}
            {/* TODO: Add "Start Interview" button here later */}

            <div className="flex items-center space-x-2">
              {/* Mic‐icon button */}
            <button
              onClick={() => {
                // TODO: hook up microphone / voice‐to‐text logic here
              }}
              className="p-2 rounded-full hover:bg-gray-800"
            >
              <Mic className="w-5 h-5 text-white" />
            </button>

            {/* ShadCN Text Input (dark background so white text is visible) */}
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                !isFollowUpMode && !showFollowUpButton && !isLoadingInitialMessage ? "Click 'Ask Follow-up Questions' to start." :
                isLoadingInitialMessage ? "Loading initial session..." :
                isFollowUpMode && (!wsClient || wsClient.readyState !== WebSocket.OPEN) && !isSendingMessage ? "Connecting to follow-up..." :
                isSendingMessage ? "AI is thinking..." :
                isFollowUpMode ? "Ask your follow-up question..." :
                "Select an option above..." // Fallback placeholder
              }
              className="flex-1 bg-gray-900 text-white placeholder-gray-500 focus:ring-blue-500"
              disabled={
                isLoadingInitialMessage ||
                (!isFollowUpMode && !showFollowUpButton) || // Disabled before initial message and button appears, or if not in follow up mode
                (isFollowUpMode && (!wsClient || wsClient.readyState !== WebSocket.OPEN)) ||
                isSendingMessage
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (isFollowUpMode && wsClient && wsClient.readyState === WebSocket.OPEN && !isSendingMessage && inputValue.trim() !== "") {
                    onSend();
                  }
                }
              }}
            />

            {/* Send Button */}
            <Button
              variant="default"
              onClick={onSend}
              className="bg-gray-600 hover:bg-gray-500 text-white"
              disabled={
                isLoadingInitialMessage ||
                !isFollowUpMode ||
                !wsClient || wsClient.readyState !== WebSocket.OPEN ||
                isSendingMessage ||
                inputValue.trim() === ""
              }
            >
              {isSendingMessage ? "..." : "Send"}
            </Button>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

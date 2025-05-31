// app/interview/page.tsx
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { SlashIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

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
  // State for the chat input:
  const [inputValue, setInputValue] = React.useState("");

  // State to track which font family/size is active:
  const [currentFontFamily, setCurrentFontFamily] = React.useState("");
  const [currentFontSize, setCurrentFontSize] = React.useState("");

  // State for current question (1-based)
  const [currentQuestion, setCurrentQuestion] = useState<number>(1);

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
  const onSend = () => {
    if (inputValue.trim() === "") return;
    // (Hook up to your backend or state management here)
    setInputValue("");
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
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="flex flex-col space-y-2">
              {/* Interviewer bubble (left) */}
              <div className="self-start bg-gray-800 px-4 py-2 rounded-lg shadow-sm max-w-xs">
                <span className="text-white">
                  Hi there! Before we begin, do you have any clarifying
                  questions about the case?
                </span>
              </div>

              {/* Candidate bubble (right) */}
              <div className="self-end bg-gray-700 px-4 py-2 rounded-lg shadow-sm max-w-xs">
                <span className="text-white">No, I’m ready to dive in.</span>
              </div>

              {/* Interviewer bubble (left) */}
              <div className="self-start bg-gray-800 px-4 py-2 rounded-lg shadow-sm max-w-xs">
                <span className="text-white">
                  Great. Let’s start by estimating the market size. How would
                  you approach that?
                </span>
              </div>

              {/* Add more bubbles or map from state as needed */}
            </div>
          </div>

          {/* Input Area: Mic Button + ShadCN Text Input + Send Button */}
          <div className="border-t border-gray-500 px-4 py-3 flex items-center space-x-2 bg-black">
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
              placeholder="Type your response..."
              className="flex-1 bg-gray-900 text-white placeholder-gray-500 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSend();
                }
              }}
            />

            {/* Send Button */}
            <Button
              variant="default"
              onClick={onSend}
              className="bg-gray-600 hover:bg-gray-500 text-white"
            >
              Send
            </Button>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Editor, EditorState, RichUtils, Modifier, convertToRaw, convertFromRaw } from "draft-js";
import "draft-js/dist/Draft.css";
import "./App.css";

const App = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  // Load content from localStorage on page load
  useEffect(() => {
    const savedContent = localStorage.getItem("editorContent");
    if (savedContent) {
      const contentState = convertFromRaw(JSON.parse(savedContent));
      setEditorState(EditorState.createWithContent(contentState));
    }
  }, []);

  // Save content to localStorage
  const handleSave = () => {
    const contentState = editorState.getCurrentContent();
    localStorage.setItem("editorContent", JSON.stringify(convertToRaw(contentState)));
    alert("Content saved!");
  };

  // Handle the input of specific characters for style and capitalization
  const handleBeforeInput = (char, editorState) => {
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const blockKey = selection.getStartKey();
    const block = contentState.getBlockForKey(blockKey);
    const blockText = block.getText();

    // If the line is empty and the input is a lowercase character, capitalize it
    if (blockText.length === 0 && char.match(/[a-z]/)) {
      const capitalizedChar = char.toUpperCase();
      const newContentState = Modifier.replaceText(
        contentState,
        selection,
        capitalizedChar,
        editorState.getCurrentInlineStyle()
      );
      setEditorState(EditorState.push(editorState, newContentState, "insert-characters"));
      return "handled";
    }

    // Trigger heading (#) with bold
    if (blockText === "#" && char === " ") {
      return applyBlockStyle(editorState, "header-one", 1);
    }
    // Trigger bold (*)
    if (blockText === "*" && char === " ") {
      return applyInlineStyle(editorState, "BOLD", 1);
    }
    // Trigger red line (**)
    if (blockText === "**" && char === " ") {
      return applyInlineStyle(editorState, "RED", 2);
    }
    // Trigger underline (***).
    if (blockText === "***" && char === " ") {
      return applyInlineStyle(editorState, "UNDERLINE", 3);
    }
    return "not-handled";
  };

  // Apply inline style
  const applyInlineStyle = (editorState, style, length) => {
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();

    // Remove trigger characters
    const updatedContent = Modifier.replaceText(
      contentState,
      selection.merge({ anchorOffset: 0, focusOffset: length }),
      "",
      null
    );

    // Push updated content state (without trigger characters)
    let newEditorState = EditorState.push(editorState, updatedContent, "remove-range");

    // Remove all existing inline styles (e.g., BOLD, RED, UNDERLINE)
    const currentStyle = editorState.getCurrentInlineStyle();
    currentStyle.forEach((existingStyle) => {
      newEditorState = RichUtils.toggleInlineStyle(newEditorState, existingStyle);
    });

    // Apply the desired new inline style
    newEditorState = RichUtils.toggleInlineStyle(newEditorState, style);

    setEditorState(newEditorState);
    return "handled";
  };

  // Apply block style (heading)
  const applyBlockStyle = (editorState, style, length) => {
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const updatedContent = Modifier.replaceText(
      contentState,
      selection.merge({ anchorOffset: 0, focusOffset: length }),
      "",
      null
    );
    const newEditorState = EditorState.push(editorState, updatedContent, "remove-range");
    setEditorState(RichUtils.toggleBlockType(newEditorState, style));
    return "handled";
  };

  // Custom style for the red color and underline
  const customStyleMap = {
    RED: { color: "red" },
    UNDERLINE: { textDecoration: "underline" },
  };

  return (
    <div className="app-container">
      <header>
        <h2>Demo editor by Deepak Shinde</h2>
        <button className="save-button" onClick={handleSave}>
          Save
        </button>
      </header>
      <div className="editor-container">
        <Editor
          editorState={editorState}
          onChange={setEditorState}
          handleBeforeInput={handleBeforeInput}
          customStyleMap={customStyleMap}
          placeholder="Type here..."
        />
      </div>
    </div>
  );
};

export default App;

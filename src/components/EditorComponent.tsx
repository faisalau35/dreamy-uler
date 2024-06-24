import React, { useState, useEffect } from "react";
import {
  Editor,
  EditorState,
  RichUtils,
  DraftHandleValue,
  convertToRaw,
  convertFromRaw,
  Modifier,
} from "draft-js";
import "draft-js/dist/Draft.css";

const EditorComponent: React.FC = () => {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty(),
  );

  // Load saved content from local storage
  useEffect(() => {
    const savedData = localStorage.getItem("editorContent");
    if (savedData) {
      const contentState = convertFromRaw(JSON.parse(savedData));
      setEditorState(EditorState.createWithContent(contentState));
    }
  }, []);

  // Handle key commands for formatting
  const handleKeyCommand = (
    command: string,
    editorState: EditorState,
  ): "handled" | "not-handled" => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return "handled";
    }
    return "not-handled";
  };

  // Detect and apply the styles when space is pressed
  const handleBeforeInput = (
    chars: string,
    editorState: EditorState,
  ): "handled" | "not-handled" => {
    if (chars !== " ") return "not-handled";

    const currentContent = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const startKey = selection.getStartKey();
    const block = currentContent.getBlockForKey(startKey);
    const blockText = block.getText();
    const text = blockText + chars;

    let newEditorState = editorState;

    if (text.match(/^#\s/)) {
      newEditorState = applyBlockType(newEditorState, "header-one", 2);
    } else if (text.match(/^\*\s/)) {
      newEditorState = applyInlineStyle(newEditorState, "BOLD", 2);
    } else if (text.match(/^\*\*\s/)) {
      newEditorState = applyInlineStyle(newEditorState, "RED", 3);
    } else if (text.match(/^\*\*\*\s/)) {
      newEditorState = applyInlineStyle(newEditorState, "UNDERLINE", 4);
    } else if (text.match(/^`````\s/)) {
      newEditorState = applyBlockType(newEditorState, "code-block", 6);
    } else {
      return "not-handled";
    }

    setEditorState(newEditorState);
    return "handled";
  };

  // Apply block type and remove the formatting characters
  const applyBlockType = (
    editorState: EditorState,
    blockType: string,
    length: number,
  ): EditorState => {
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    const startKey = selectionState.getStartKey();
    const block = contentState.getBlockForKey(startKey);

    const newBlockText = block.getText().slice(length);
    const newContentState = Modifier.replaceText(
      contentState,
      selectionState.merge({
        anchorOffset: 0,
        focusOffset: block.getLength(),
      }),
      newBlockText,
    );

    const updatedState = EditorState.push(
      editorState,
      newContentState,
      "change-block-type",
    );
    return RichUtils.toggleBlockType(updatedState, blockType);
  };

  // Apply inline style and remove the formatting characters
  const applyInlineStyle = (
    editorState: EditorState,
    style: string,
    length: number,
  ): EditorState => {
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    const startKey = selectionState.getStartKey();
    const block = contentState.getBlockForKey(startKey);

    const newBlockText = block.getText().slice(length);
    const newContentState = Modifier.replaceText(
      contentState,
      selectionState.merge({
        anchorOffset: 0,
        focusOffset: block.getLength(),
      }),
      newBlockText,
    );

    const updatedState = EditorState.push(
      editorState,
      newContentState,
      "change-inline-style",
    );
    return RichUtils.toggleInlineStyle(updatedState, style);
  };

  // Save editor content to local storage
  const handleSave = (): void => {
    const contentState = editorState.getCurrentContent();
    const rawContent = convertToRaw(contentState);
    localStorage.setItem("editorContent", JSON.stringify(rawContent));
    alert("Content saved!");
  };

  const clearInlineStyles = (editorState: EditorState): EditorState => {
    const currentContent = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const newContentState = Modifier.applyInlineStyle(
      currentContent,
      selection,
      "none",
    );
    const newEditorState = EditorState.push(
      editorState,
      newContentState,
      "change-inline-style",
    );

    return EditorState.set(newEditorState, {
      currentContent: newContentState,
      selection: newContentState.getSelectionAfter(),
    });
  };

  const handleReturn = (
    _e: React.KeyboardEvent,
    editorState: EditorState,
  ): DraftHandleValue => {
    const selection = editorState.getSelection();
    const startKey = selection.getStartKey();
    const contentState = editorState.getCurrentContent();
    const block = contentState.getBlockForKey(startKey);
    const blockType = block.getType();

    // Split the block and reset the block type to "unstyled"
    const newContentState = Modifier.splitBlock(contentState, selection);
    let newEditorState = EditorState.push(
      editorState,
      newContentState,
      "split-block",
    );

    if (blockType !== "unstyled") {
      const newSelection = newEditorState.getSelection();
      const updatedContentState = Modifier.setBlockType(
        newContentState,
        newSelection,
        "unstyled",
      );

      newEditorState = EditorState.push(
        newEditorState,
        updatedContentState,
        "change-block-type",
      );
    }

    // Clear any inline styles on the new line using clearInlineStyles function
    newEditorState = clearInlineStyles(newEditorState);

    setEditorState(newEditorState);
    return "handled";
  };

  const styleMap: { [key: string]: React.CSSProperties } = {
    RED: { color: "red" },
  };

  return (
    <div className="editor-container">
      <div className="editor">
        <Editor
          editorState={editorState}
          onChange={setEditorState}
          handleKeyCommand={handleKeyCommand}
          handleReturn={handleReturn}
          handleBeforeInput={handleBeforeInput}
          customStyleMap={styleMap}
          placeholder="Type something..."
        />
      </div>
      <button className="save-button" onClick={handleSave}>
        Save
      </button>
    </div>
  );
};

export default EditorComponent;

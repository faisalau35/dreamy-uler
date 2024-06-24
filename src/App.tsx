import React from "react";
import EditorComponent from "./components/EditorComponent";
import Title from "./components/Title";

const App: React.FC = () => {
  return (
    <div className="app">
      <Title />
      <EditorComponent />
    </div>
  );
};

export default App;

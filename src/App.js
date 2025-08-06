import React from 'react';
import './App.css';
import DocumentHierarchy from './components/DocumentHierarchy';
import { ToastContainer, toast } from 'react-toastify';



function App() {
  return (
    <div className="app">
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <DocumentHierarchy />
    </div>
  );
}

export default App;



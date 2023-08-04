// App.js

import React, { useState, useEffect } from 'react';

/* function App() {
  const [output, setOutput] = useState('');

  useEffect(() => {
    fetch('server/testResp')
      .then(res => res.text())
      .then(data => setOutput(data));
  }, []); */

  function App(props) {
    const [output, setOutput] = useState('');
  
    const runCommand = async () => {
      const response = await fetch('server/testResp');
      const data = await response.text();
      setOutput(data);
    }

    const queryExpress = () => {
      fetch("/server/testResp/", {method: "GET"})
        .then(async function(response){
          const data = await response.json();
          console.log(data);
          document.getElementById("message").innerHTML = data;
      })
      .catch(function(error){
        console.log("Request failed", error)
      })
    }
    const clearMessage = () => {
      document.getElementById("message").innerHTML = "";
    }
  

  //console.log({output});

  return (
    // <div>
    //   <button onClick={runCommand}>Run Command</button>
    //   <pre>{output}</pre> 
    // </div>

    <div className="App">
    <h1>Express GET request example</h1>
    <button onClick={() => {queryExpress();}}>Make GET       request</button>
    <button onClick={() => {clearMessage();}}>Clear message    </button>
    <div id="message"></div>
    </div>
  );
}

export default App;
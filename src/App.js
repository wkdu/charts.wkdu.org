import React, { Component } from 'react';
import WeeklyCharts from './WeeklyCharts'
import YearlyCharts from './YearlyCharts'
import './App.css';

class App extends Component {

  render() {
    return (
      <div className="App">
        <main className="container">
          <div className="row mb-3">
            <div className="col-lg-12">
              <WeeklyCharts></WeeklyCharts>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-lg-12">
              <YearlyCharts></YearlyCharts>
            </div>
          </div>
        </main>
      </div>
    );
  }

}

export default App;

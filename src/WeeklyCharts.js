import React, { Component } from 'react';
import { countArtistAlbums } from './lib/chartCounts';
import sortUtil from './lib/sortUtil';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      weeks: [],
      selectedWeekIdx: 0,
      currentWeek: {},
      playlists: [],
      selectedPlaylists: [],
      tracksType: 'new',
      chartType: 'album',
      chartTracks: [],
      charts: [],
      uppercase: false,
      loading: true
    };

    this.handleSelectWeekChange = this.handleSelectWeekChange.bind(this);
    this.handleSelectPlaylistChange = this.handleSelectPlaylistChange.bind(this);
    this.handleClickSelectAll = this.handleClickSelectAll.bind(this);
    this.handleClickSortPlaylists = this.handleClickSortPlaylists.bind(this);
    this.handleChangeTrackType = this.handleChangeTrackType.bind(this);
    this.handleClickSortPlays = this.handleClickSortPlays.bind(this);
    this.handleClickSortAtoZ = this.handleClickSortAtoZ.bind(this);
    this.handleClickToggleCase = this.handleClickToggleCase.bind(this);
  }

  loadPlaylists(weekObj) {
    if (weekObj) {
      fetch(weekObj.file)
      .then(response => response.json())
      .then(data => {
        this.setState({
          currentWeek: weekObj,
          playlists: data.playlists,
          loading: false
        });
      });
    }
  }

  generateCharts(selectedPlaylists, tracksType) {
    // generate charts (sorted by count descending)

    // combine tracks from selected playlists into a single array
    let tracks = [];
    for (let i = 0; i < selectedPlaylists.length; i++) {
      let pidx = selectedPlaylists[i];
      let playlist = this.state.playlists[pidx];

      tracks.push.apply(tracks, playlist.tracks);
    }

    // filter tracks based on tracksType
    let filteredTracks = []; 
    if (tracksType === 'new') {
      filteredTracks = tracks.filter(trk => trk.new.length > 0);
    } else if (tracksType === 'local') {
      filteredTracks = tracks.filter(trk => trk.local.length > 0);
    } else if (tracksType === 'all') {
      filteredTracks = tracks;
    }

    // charts: [ { artist: '', album: '', plays: '' }, ...]
    const charts = countArtistAlbums(filteredTracks).sort(sortUtil.Counts());
    this.setState({ charts, chartTracks: tracks });
  }

  componentDidMount() {
    // TO-DO: https://stackoverflow.com/questions/46988339/react-fetch-request-for-local-json-file-returns-index-html-and-not-the-json-file
    // fetch('./data/chart_week.json', {
    fetch('https://api.myjson.com/bins/ektfn')
    .then(response => {
      // console.log(response);
      if (response.status >= 400) {

      }
      return response.json(); 
    })
    .then(data => {
      if (data.length > 0) {
        this.setState({ weeks: data });
        this.loadPlaylists(data[0]);
      }
    })
    .catch(err => {
      console.log(err);
    })
  }

  handleSelectWeekChange(event) {
    const idx = event.target.value;
    const newCurrentWeek = this.state.weeks[idx]
    this.loadPlaylists(newCurrentWeek);
    this.setState({
      currentWeek: newCurrentWeek,
      selectedWeekIdx: idx,
      selectedPlaylists: [],
      charts: []
    });
  }

  handleSelectPlaylistChange(event) {
    // calculate charts based on selected playlists
    const selected = [...event.target.options].filter(o => o.selected).map(o => parseInt(o.value, 10));
    this.setState({ selectedPlaylists: selected });
    this.generateCharts(selected, this.state.tracksType);
  }

  handleClickSelectAll(event) {
    // select all playlists (create array from 0..N-1 where N = playlists.length)
    const allIdxs = [...Array(this.state.playlists.length).keys()];
    this.setState({ selectedPlaylists: allIdxs });
    this.generateCharts(allIdxs, this.state.tracksType);
  }

  handleChangeTrackType(event) {
    const tracksType = event.target.value
    this.setState({ tracksType });
    this.generateCharts(this.state.selectedPlaylists, tracksType);
  }

  handleClickSortPlaylists() {
    const sorted = this.state.playlists.reverse();
    this.setState({ playlists: sorted })
  }

  handleClickSortPlays() {
    const sorted = this.state.charts.sort(sortUtil.Counts());
    this.setState({ charts: sorted });
  }

  handleClickSortAtoZ() {
    const sorted = this.state.charts.sort(sortUtil.AtoZ('artist'));
    this.setState({ charts: sorted });
  }

  handleClickToggleCase() {
    const toggled = !this.state.uppercase;
    this.setState({ uppercase: toggled });
  }

  render() {
    const weeksList = (this.state.weeks).map((week, idx) => {
      return <option value={idx} key={'w'+idx}>{week.week_ending}</option>;
    });
    const playlistsList = (this.state.playlists).map((playlist, idx) => {
      return <option value={idx} key={'p'+idx}>{playlist.show.title}</option>;
    });
    const currentWeekEnding = (this.state.currentWeek.week_ending) ? this.state.currentWeek.week_ending : '';

    const noTracksOfTrackType = (this.state.tracksType !== 'all') ? ((this.state.chartTracks).filter(track => track[this.state.tracksType].length > 0).length === 0) : false;
    const noTracksOfChartType = (this.state.chartTracks).filter(track => track[this.state.chartType].length > 0).length === 0;

    return (
      <div className="card">
        <h4 className="card-header">Weekly Charts</h4>
        <div className="card-body">
          <div className="row">
            <div className="col-lg-4">
              <form>

                <div className="mb-2">
                  <h5>Select Week Ending</h5>
                  <div className="form-group">
                    <select className="form-control" id="selectWeek"
                      onChange={this.handleSelectWeekChange}
                      value={this.state.selectedWeekIdx}
                      >
                        {weeksList}
                    </select>
                  </div>
                </div>

                <div className="mb-2">
                  <h6>Playlists</h6>
                  <div className="form-group">
                    <select multiple className="form-control" id="selectPlaylist" size="8"
                      onChange={this.handleSelectPlaylistChange}
                      value={this.state.selectedPlaylists}
                      >
                        {this.state.loading && <option>Loading...</option>}
                        {!this.state.loading && playlistsList}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="col">
                      <button type="button" className="btn btn-light btn-block" onClick={this.handleClickSelectAll}>Select all</button>
                    </div>
                    <div className="col">
                      <button type="button" className="btn btn-light btn-block" onClick={this.handleClickSortPlaylists}>Sort new → old</button>
                    </div>  
                  </div>
                  <div className="form-row mt-1">
                    <div className="mx-auto">
                      <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="trackTypeRadioOpt" id="radioTrackTypeAll"
                          value="all"
                          onChange={this.handleChangeTrackType}
                          checked={this.state.tracksType === 'all'}
                        />
                        <label className="form-check-label" htmlFor="radioTrackTypeAll">All tracks</label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="trackTypeRadioOpt" id="radioTrackTypeNew"
                          value="new"
                          onChange={this.handleChangeTrackType}
                          checked={this.state.tracksType === 'new'}
                        />
                        <label className="form-check-label" htmlFor="radioTrackTypeNew">New only</label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="trackTypeRadioOpt" id="radioTrackTypeLocal"
                          value="local"
                          onChange={this.handleChangeTrackType}
                          checked={this.state.tracksType === 'local'}
                        />
                        <label className="form-check-label" htmlFor="radioTrackTypeLocal">Local only</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <h6>Display Options</h6>
                  <div className="form-row mb-3">
                    <div className="col">
                      <button type="button" className="btn btn-light btn-block" onClick={this.handleClickSortPlays}>Sort by play count</button>
                    </div>
                    <div className="col">
                      <button type="button" className="btn btn-light btn-block" onClick={this.handleClickSortAtoZ}>Sort artist A → Z</button>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="col">
                      <button type="button" className="btn btn-light btn-block" onClick={this.handleClickToggleCase}>Toggle case</button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="col-lg-8">
              <h5>Week ending {currentWeekEnding}</h5>
              <table className={"table table-sm chart-albums " + (this.state.uppercase && 'uppercase')}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Artist</th>
                    <th>Album/Record</th>
                    <th>Plays</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.charts.length > 0 && this.state.charts.map((obj, idx) => {
                      return (
                        <tr className="charts-row" key={'ch'+idx}>
                          <td>{idx+1}</td>
                          <td>{obj.artist}</td>
                          <td>{obj.album}</td>
                          <td>{obj.plays}</td>
                        </tr>
                      );
                    })
                  }
                  {(this.state.charts.length === 0 && this.state.selectedPlaylists.length > 0
                    && noTracksOfTrackType) &&
                    <tr>
                      <td colSpan="4">Could not generate charts from selected playlist(s) with zero {this.state.tracksType} tracks.</td>
                    </tr>
                  }
                  {(this.state.charts.length === 0 && this.state.selectedPlaylists.length > 0
                    && noTracksOfChartType) &&
                    <tr>
                      <td colSpan="4">Could not generate charts from selected playlist(s) without {this.state.chartType} information.</td>
                    </tr>
                  }
                  {(this.state.charts.length === 0 && this.state.selectedPlaylists.length === 0) &&
                    <tr>
                      <td colSpan="4">Please select playlists in order to generate charts.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;

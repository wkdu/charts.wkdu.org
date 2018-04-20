const async = require('async');
const scrapeIt = require('scrape-it');
const moment = require('moment');
const fs = require('fs-extra');

const file_dir = 'build/data';
const now = Date.now();
const mnow = function() { return moment(now); };
const week_of = mnow().day('Tuesday');

// Gather dates for last week's charting period (Tuesday thru next Monday)
const days = [2, 3, 4, 5, 6, 7, 8, 9];
const week_dates = days.map(day => mnow().day(day).format('dddd, M/D/YY'));

// Pull playlists from dates matching "this week" from the site
scrapeIt('http://wkdu.org/station/playlists/all', {
    dates: {
        listItem: '.view-playlists h3',
        selector: 'span.date-display-single',
    },
    playlists: {
        listItem: '.view-playlists ul.item-list',
        data: {
            playlistDay: {
                listItem: 'li',
                data: {
                    url: {
                        selector: 'a',
                        attr: 'href'
                    },
                    show: {
                        selector: 'a',
                        how: 'text'
                    }
                }
            }
        }
    }
})
.then(({ data, response }) => {

    if (response.statusCode === 200) {
        const which_days = [];
        for (let i = 0; i < week_dates.length; i++) {
            let indexOfDay = data.dates.indexOf(week_dates[i]);
            if (indexOfDay > -1) {
                which_days.push(indexOfDay);
            }
        }
    
        const playlistDays = which_days.map(i => {
            let pday = data.playlists[i].playlistDay; // playlists for the specific day *i*
            let date = data.dates[i];
    
            // sort playlists by reversing order (newest to oldest => oldest to newest)
            pday.reverse();
    
            // apply formatting changes to scraped info
            pday.map(plist => {
                plist.date = moment(date, "dddd, M/D/YY").format('ddd M/D/YY');
                plist.url = `http://wkdu.org${plist.url}`;
                return plist;
            });
            return pday;
        });
        const playlists = playlistDays.reduce((a, b) => a.concat(b), []);
    
        // gather playlist URLs to scrape individually
        const playlistURLs = playlists.map(p => p.url);
        scrapePlaylists(playlistURLs);

    } else {
        console.log(response.statusCode);
    }

});

function scrapePlaylists(urls) {
    // scrape playlists with tracks from each playlist node
    const week_of_playlists = [];
    async.eachOfLimit(urls, 3, function(playlistUrl, idx, callback) {
        scrapeIt(playlistUrl, {
            show_raw: '.panel-col-first .blockpanel .pane-title a',
            show: {
                listItem: '.panel-col-last .blockpanel',
                data: {
                    title: '.pane-title a',
                    djs: {
                        listItem: '.field-field-station-program-dj .field-item a'
                    },
                    genre: {
                        listItem: '.group-genres .field-item'
                    },
                    times: {
                        selector: '.station-schedule-times .form-item',
                        eq: 1,
                        convert: x => {
                            if (x.indexOf('not on the schedule') > -1) return x;
                            else return x.split(' \n ')[1];
                        }
                    }
                }
            },
            tracks: {
                listItem: '.views-table tbody tr',
                data: {
                    artist: '.views-field-artist',
                    title: '.views-field-title',
                    album: '.views-field-album',
                    label: '.views-field-label',
                    new: '.views-field-newtrack',
                    local: '.views-field-local-music'
                }
            },
            date: {
                selector: '.panel-col-first .blockpanel .pane-title a',
                convert: x => x.split(' on ')[1]
            },
            date_unix: {
                selector: '.panel-col-first .blockpanel .pane-title a',
                convert: x => moment(x.split(' on ')[1], 'ddd M/D/YY').unix() //TO-DO NOTE: all playlists on same date with have same unix timestmap
            }
        })
        .then(({ data, response }) => {
            const playlist = data;
            playlist.idx = idx;
            if (playlist.tracks.length > 0) {
                week_of_playlists.push(playlist);
                console.log(`INFO: Playlist "${playlist.show_raw}" added with ${playlist.tracks.length} tracks.`);
            } else {
                console.log(`INFO: Playlist "${playlist.show_raw}" skipped because there were no tracks.`);
            }
            callback();
        });
    }, function(err) {
        if (err) { // error: encountered an issue while scraping playlists
        
            console.log(`ERROR: There was an unexpected issue while scraping playlists. Exiting script...`);
            process.exit();
    
        } else { // success: all playlists scraped
        
            console.log(`SUCCESS: ${week_of_playlists.length} playlists have been successfully scraped.`);
    
            // sort playlists in order (oldest => newest i.e. idx ascending)
            week_of_playlists.sort((a, b) => { return a.idx - b.idx; });

            // remove idx keys from playlists
            week_of_playlists.map(p => { 
                delete p.idx;
                return p;
            });

            // save playlists to JSON
            saveChartsToJSON(week_of_playlists);
        
        }
    });
}

function saveChartsToJSON(week_of_playlists) {
    const week_of_start = mnow().day(2).format('MMMM D YYYY');
    const week_of_end = mnow().day(9).format('MMMM D YYYY')
    const playlistsData = { 
        week_of_start,
        week_of_end,
        week_of_playlists,
        last_updated: moment().unix()
    };

    // save to JSON (file name format: "week_of_MM_DD_YYY.json")
    const file_date = mnow().day(2).format('MM_DD_YY');
    const file_name = `${file_dir}/weeks/week_of_${file_date}.json`;

    fs.outputJson(file_name, playlistsData)
    .then(() => {
        console.log(`SUCCESS: Charts for ${week_of_start} saved to JSON. (${file_name})`);
    })
    .catch(err => {
        console.log(`ERROR: There was an issue while saving charts to JSON. Exiting script...`);
        throw err;   
    });
    
    // edit chart_week.json by appending this week's charts
    appendWeekToJSON(week_of_start, file_name);  
}


function appendWeekToJSON(week_of, file) {
     
    /*  chart_week.json format:
        [
            {
                "week_of": "",
                "file": ""
            },
            ...
        ]
    */

    const week = { week_of, file };
    const json_file = `${file_dir}/chart_week.json`;

    fs.readJson(json_file)
    .then(chartsArr => { // file already exists
        fs.outputJson(json_file, chartsArr.push(week))
        .then(() => {
            console.log(`SUCCESS: chart_week.json - file appended. (chart for ${week_of})`)

        })
        .catch(writeErr => {
            console.log(`ERROR: There was an issue while appending charts to JSON. Exiting script...`);
            throw writeErr;
        });
    })
    .catch(readErr => { // file does not exist
        fs.outputJson(json_file, [week])
        .then(() => {
            console.log(`SUCCESS: chart_week.json - file created.`)
        })
        .catch(writeErr => {
            console.log(`ERROR: There was an issue while appending charts to JSON. Exiting script...`);
            throw writeErr;
        });
    });
}

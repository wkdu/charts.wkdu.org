const async = require('async');
const scrapeIt = require('scrape-it');
const moment = require('moment');
const async = require('async');
const fs = require('fs');

const now = moment();
const week_of = now.day('Tuesday');
const week_of_format = week_of.format('MMMM D');

// Gather dates for last week's charting period (Tuesday thru next Monday)
const days = [2, 3, 4, 5, 6, 7, 8, 9];
const week_dates = days.map(day => now.day(day).format('dddd, M/D/YY'));

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
}, (err, { data }) => {
    // console.log(err || data);

    const which_days = [];
    for (let i = 0; i < week_dates.length; i++) {
        let indexOfDay = dates.indexOf(week_dates[i]);
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

    // scrapePlaylists();
    // saveToJSON();
});



// scrape tracks from each playlist node
// save data to public/data/xxxx.json

/* scrapeIt('http://wkdu.org/playlist/46678', {
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
    }
}, (err, { data }) => {
    console.log(err || data);
});
*/

//////////////


const playlistsData = { week_of, week_of_format, playlists, last_updated: moment() };


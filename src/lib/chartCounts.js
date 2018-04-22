import stringUtil from './stringUtil';

const isAlbumSelfTitled = function(album) {
    let albumLC = album.toLowerCase();
    return (albumLC.indexOf('s/t') > -1 || albumLC.indexOf('st') > -1);
};

// counts: { artist1: { artist: Artist1, plays: int }, ... }
// returns: [ { artist: Artist1, plays: int }, ... ]
const countArtists = function(tracks) {
    const counts = tracks.reduce((allArtists, track) => {
        let artist = stringUtil.escapeRaw(track.artist);
        let artistNameLC = artist.toLowerCase();
        
        if (artistNameLC in allArtists) {
            allArtists[artistNameLC].count++;
        } else {
            allArtists[artistNameLC] = { artist, plays: 1 };
        }
        return allArtists;
    }, {});
    return Object.values(counts);
};

// counts: { artistalbum1: { artist: Artist1, album: Album1, plays: int }, ... }
// returns: [ { artist: Artist1, album: Album1, plays: int }, ... ]
const countArtistAlbums = function(tracks) {
    const counts = tracks.reduce((allAlbums, track) => {
        if (track.artist && track.album) {
            let artist = stringUtil.escapeRaw(track.artist);
            let album = stringUtil.escapeRaw(track.album);
            let artistAlbum = (isAlbumSelfTitled(album)) ? `${artist} - ${artist}` : `${artist} - ${album}`;
            let artistAlbumLC = artistAlbum.toLowerCase();

            if (artistAlbumLC in allAlbums) {
                allAlbums[artistAlbumLC].count++;
            } else {
                allAlbums[artistAlbumLC] = { artist, album, plays: 1 };
            }
        }
        return allAlbums;
    }, {});
    return Object.values(counts);
};

// counts: { label1: { label: Label1, plays: int }, ... }
// returns: [ { label: Label1, plays: int }, ... ]
const countLabels = function(tracks) {
    const counts = tracks.reduce((allLabels, track) => {
        if (track.label) {
            let label = stringUtil.escapeRaw(track.label);
            let labelNameLC = label.toLowerCase();
            
            if (labelNameLC in allLabels) {
                allLabels[labelNameLC].count++;
            } else {
                allLabels[labelNameLC] = { label, plays: 1 };
            }
        }
        return allLabels;
    }, {});
    return Object.values(counts);
};

export { countArtists, countArtistAlbums, countLabels };

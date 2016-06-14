
L.mapbox.accessToken = 'pk.eyJ1IjoiZG5vbWFkYiIsImEiOiJjaW16ZngwOGkwNGtvdm9sdWp4dnc2cWxvIn0.G2DN19xoW2FkzKb5YxtXxA';
var map = L.mapbox.map('map', 'mapbox.landsat-live', {
    minZoom: 7,
    maxZoom: 12,
    attributionControl: true
})
    .setView([39.996,25.131], 8)
    .addControl(L.mapbox.geocoderControl('mapbox.places'))
    .on('click', function(e){map.setView(e.latlng)})
    map.scrollWheelZoom.disable();

map.attributionControl
.addAttribution("USGS")

var minimap = L.mapbox.map('minimap', 'peterqliu.aaa01f1e', {
    minZoom: 0,
    maxZoom:0,
    zoomControl:false
})
    .setView([42,9], 0)
    .on('click', function(e) {
    map.setView([e.latlng.lat, e.latlng.lng],0);
});

minimap.dragging.disable();
minimap.touchZoom.disable();
minimap.doubleClickZoom.disable();
minimap.scrollWheelZoom.disable();

var iconx= L.divIcon({
  
  className: 'minimarkerx',
iconSize: [500,0]
});
var markerx = L.marker([0, 0], {icon: iconx}).addTo(minimap);
var icony= L.divIcon({
className: 'minimarkery',
  
  iconSize: [0,500]
});
var markery = L.marker([0, 0], {icon: icony}).addTo(minimap);

var footprints = L.mapbox.tileLayer('dnomadb.3bec27f4').addTo(map);
var whitelabels = L.mapbox.tileLayer('pdgoodman.2e9b9266').addTo(map);


var hash = L.hash(map);

function toggleLayer(checkbox, layer){
    checkbox.checked ? map.addLayer(layer) : map.removeLayer(layer)
}
function parseDate(date) {
    return date.substring(4, 6) + '/' + date.substring(6, 8) + '/' + date.substring(0, 4);
}

function daysAgo(date) {
    var inputDate = new Date(date.substring(0, 4),date.substring(4,6)-1,date.substring(6,8))
    var days = Math.round((Date.now()-inputDate)/86400000);

    return days>1 ? days +' days ago' : 
        (days>0 ? ' 1 day ago' : ' today')
}

function nextPass(lastvisit) {
    var inputDate = new Date(lastvisit.substring(0, 4),lastvisit.substring(4,6)-1,lastvisit.substring(6,8))
    var days = Math.round((Date.now()-inputDate)/86400000);
    var counter = 0;
    while (-days+(counter*16)<0) counter++
    var next = -days+(counter*16)

    var futuredate = new Date(Date.now()+86400000*next);
    $('.nextvisitday').text(next>1 ? next+' days' : '1 day');
    $('.nextvisitdate').text(futuredate.getMonth()+1+'/'+futuredate.getDate()+'/'+futuredate.getFullYear())

    return next>1 ? next+' days' : 'tomorrow'
}

function getTileURL(z, lat, lon) {
    var radder = Math.PI / 180.0
    var x = parseInt(Math.floor( (lon + 180) / 360 * (1<<z) ));
    var y = parseInt(Math.floor( (1 - Math.log(Math.tan(lat * radder) + 1 / Math.cos(lat * radder)) / Math.PI) / 2 * (1<<z) ));
    return {
        z: z,
        x: x,
        y: y
    }
}

function getUrls(scene_id) {
    var path = scene_id.substring(3, 6);
    var row = scene_id.substring(6, 9);
    var bUrl = 'https://landsat-pds.s3.amazonaws.com/L8/' + path + '/' + row + '/' + scene_id + '/' + scene_id;
    return {
        image: bUrl + '_thumb_small.jpg',
        metadata: bUrl + '_MTL.txt',
        path: path,
        row: row
    }
}

function parseMTL(mtl) {
    var lines = mtl.replace(/ /g,'').split('\n');
    var mtlInfo = {};
    for (var i = 0; i < lines.length; i++) {
        var tLine = lines[i].split('=');
        mtlInfo[tLine[0]] = tLine[1];
    }

    return mtlInfo;
}

function queryData(latlng) {

    var bUrl = 'https://api.tiles.mapbox.com/v4/surface/mapbox.landsat-live-vt.json?layer=scene&fields=date,description<Plug>PeepOpenrocessed_date,scene_id,source_id&access_token=pk.eyJ1IjoiZG5vbWFkYiIsImEiOiJjaW16ZngwOGkwNGtvdm9sdWp4dnc2cWxvIn0.G2DN19xoW2FkzKb5YxtXxA&points=' + latlng.lng%180 + ','+ latlng.lat;
    $.ajax({
        type: 'GET',
        url:bUrl
    }).done(function(data) {
        $('.collectedago').text(daysAgo(data.results[0].date))
        $('.processedago').text(daysAgo(data.results[0].processed_date))
        $('.collecteddate').text(parseDate(data.results[0].date)+' ');
        $('.processeddate').text(parseDate(data.results[0].processed_date));

        nextPass(data.results[0].date);

        var happyTile = getTileURL(7, latlng.lat, latlng.lng);
        var urls = getUrls(data.results[0].scene_id);
        data.results[0].scene_id + '</a>')
        $('#date-coll-js').text(parseDate(data.results[0].date));
        $('#date-proc-js').text(parseDate(data.results[0].processed_date));
        $('#tilename-js').text(happyTile.z + '-'+ happyTile.x + '-' + happyTile.y)
        $('#image-js').html('<img class="preview-image" src="' + urls.image +'" />')
        $('#source-js').text('USGS');
        $('#pathrow-js').text(urls.path + ' / ' + urls.row)
        var bUrl = 'https://landsat-pds.s3.amazonaws.com/L8/' + urls.path + '/' + urls.row + '/' + data.results[0].scene_id + '/' + data.results[0].scene_id + '_thumb_large.jpg';
        $('.preview-image').attr('src',bUrl)

        $.ajax({
            type: 'GET',
            url: urls.metadata
        }).done(function(what) {
            var mtl = parseMTL(what);
            var distance = mtl['EARTH_SUN_DISTANCE'];
            var azimuth = mtl['SUN_AZIMUTH'];





            var sweeper = azimuth >0 ? document.getElementById('right') : document.getElementById('left');
            sweeper.style.transform='rotate('+azimuth+'deg)'
            document.getElementById('azimuth').style.transform='rotate('+azimuth+'deg)'
            document.getElementById('azimuthbase').style.transform='rotate('+azimuth+'deg)'
            document.getElementById('elevation').style.transform='rotateX('+mtl['SUN_ELEVATION']*-1+'deg) rotateY('+mtl['SUN_AZIMUTH']+'deg)'
            document.getElementById('elevsweep').style.transform='rotateX('+mtl['SUN_ELEVATION']*-1+'deg) rotateY(90deg)'


            document.getElementById('azimuth-js').innerHTML=parseFloat(azimuth).toFixed(2)+'°';
            document.getElementById('elevation-js').innerHTML=parseFloat(mtl['SUN_ELEVATION']).toFixed(2)+'°';

            document.getElementById('distance').innerHTML = ((distance*149.597871).toFixed(2) +' million km')




$('#sceneid').text('#'+mtl['LANDSAT_SCENE_ID'].replace(/"/g,''));
            $('.time').text(mtl['SCENE_CENTER_TIME'].substring(1,6));
            $('#sun-azimuth-js').text(Math.round(azimuth * 100) / 100 + '°')
            $('#sun-elevation-js').text(parseFloat(mtl['SUN_ELEVATION']).toFixed(2)+'°')
            $('#sun-distance').text((distance*149.597871).toFixed(2) +' million km')

            $('#cloudcover-js').text(mtl['CLOUD_COVER'] + '%')
        })
    });
}

function moveMarker() {
    var mapCent = map.getCenter()
    $('.crosshair').fadeTo(200, 0.5).fadeTo(200, 1)
    queryData(mapCent);
markerx.setLatLng(map.getCenter());
    markery.setLatLng(map.getCenter());

    var geocodeURL='https://api.tiles.mapbox.com/v4/geocode/mapbox.places/'+mapCent.lng+','+mapCent.lat+'.json?access_token='+L.mapbox.accessToken 
    $.get(geocodeURL).done(function(data) {
        $('.minilabel').text(
            function(){
                var place = data.features[data.features.length-2].place_name;
                return place ? place : ''
            }
        )
    })
}
moveMarker()
map.on('viewreset', moveMarker);
map.on('moveend', moveMarker);

if (window.top!=window.self) $('#title').remove()



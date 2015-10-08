'use strict';
var Twitchapp = Twitchapp || {};
var jsonp = (function(global, body) {
  'use strict';
  // native Promise. http://caniuse.com/#search=promises
  if (!global.Promise) {
    throw 'Promise not available. Please use a different browser';
  }
  return function(url) {   
    return new Promise(function(resolve, reject) {
      var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random()),
          script = createScript(url, callbackName);

      script.onerror = reject;
      body.appendChild(script);

      if (/callback=?/.test(url)) {
        url = url.replace('=?', '=' + callbackName);
      }

      global[callbackName] = function(data) {
        // resolve the promise.
        resolve(data);

        // cleanup
        global[callbackName] = null;
        delete global[callbackName];
        body.removeChild(script);
      };
    });
  };

  function createScript(url, callbackName) {
    var script = document.createElement('script');
    script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
    return script;
  }

}(this, document.body));

var currentPage = 1;
var streamsPerPage = 5;
var pageCount = function() {
  var records = document.getElementById('twitch-listings').getAttribute('pages');
  return Math.ceil(records / streamsPerPage);
}

var setPage = function(page) {
  var me = this;
  var buttonNext = document.getElementById("buttonNext");
  var buttonPrevious = document.getElementById("buttonPrevious");
  var pageDisplay = document.getElementById("page");

  // Validation
  if (page < 1) page = 1;
  if (page > pageCount()) page = pageCount();

  document.getElementById('listings').innerHTML='';
  for (var i = (page-1) * streamsPerPage; i < (page * streamsPerPage) && i < Twitchapp.gamestreams.length; i++) {
    var el = document.createElement('li');
    el.id = Twitchapp.gamestreams[i]._id;
    document.getElementById('listings').appendChild(el);

    el.innerHTML = '<a href="'+Twitchapp.gamestreams[i].channel.url+'">'+
                      '<div class="stream-container">'+
                      '<div class="img-wrapper"><img class="stream-preview" src="'+Twitchapp.gamestreams[i].preview.medium+'"/></div>'+
                      '<div class="stream-info">'+
                          '<h1 class="listing-container">'+Twitchapp.gamestreams[i].channel.name+'</h1>'+
                          '<div class="game-name">'+Twitchapp.gamestreams[i].game+' -&nbsp;</div>'+
                          '<div class="viewership">'+Twitchapp.gamestreams[i].viewers+' viewers</div>'+
                          '<div class="channel-status">'+Twitchapp.gamestreams[i].channel.status+'</div>'+
                      '</div>'+
                      '</div>'+
                    '</a>';
  }

  pageDisplay.innerHTML = page + "/" + pageCount();

  if (page === 1) {
    buttonPrevious.style.visibility = "hidden";
  } else {
    buttonPrevious.style.visibility = "visible";
  }

  if (page == pageCount()) {
    buttonNext.style.visibility = "hidden";
  } else {
    buttonNext.style.visibility = "visible";
  }
}

Twitchapp = {
  init: function(){
    var me = this;

    var nextButton = document.getElementById('buttonNext');
    var prevButton = document.getElementById('buttonPrevious');
    var searchButton = document.getElementById('search');

    nextButton.addEventListener('click',this.nextPage, false);
    prevButton.addEventListener('click',this.prevPage, false);
    searchButton.addEventListener('click',this.search, false);

    var main = document.createElement('section');
    main.setAttribute('id','twitch-listings');

    var ul = document.createElement('ul');
    ul.id = 'listings';

    document.body.appendChild(main);
    main.appendChild(ul);
  },

  search: function(e){
    e.preventDefault();
    var getQuerySelection = encodeURIComponent(document.getElementById('querybox').value) || false;
    if(getQuerySelection){
      jsonp('https://api.twitch.tv/kraken/search/streams?q=' + getQuerySelection + '&callback=?')
        .then(function(data) { 

        var gamestreams = data.streams;
        var totalStreams = gamestreams.length;

        document.getElementById('result-target').innerText = totalStreams;
        document.getElementById('result-target').textContent = totalStreams;

        //format the result container, set the page length and display the controls
        document.forms[0].className =' queried';
        document.getElementById('twitch-listings').setAttribute('pages', totalStreams);
        document.querySelector('.control-wrapper').style.display = "block";

        //expose the fetched payload to the app
        Twitchapp.gamestreams = gamestreams;
        //set initial page
        setPage(1);

        console.log('twitch', data); })
        .catch(function(err) { 
        alert('There was a problem please try a different search');
        document.querySelector('.control-wrapper').style.display = "none";
        console.log(err); 
        return;
      });
    }
    else{
      alert('please enter something to search for')
    }
  },

  prevPage: function() {
    var me = this;
    if (currentPage > 1) {
      currentPage--;
      setPage(currentPage);
    }
  },

  nextPage: function() {
    var me = this;
    if (currentPage < pageCount()) {
      currentPage++;
      setPage(currentPage);
    }
  },
}

Twitchapp.init(); 
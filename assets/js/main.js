(function () {
    loadUrlParams(getParameterByName('video'));

    window.onpopstate = function (e) {
        if (e.state && e.state.videoId) {
            loadUrlParams(e.state.videoId);
        }
        else {
            loadUrlParams(null);
        }
    };
})();

function loadUrlParams(videoId) {
    var canonicalHref = '';
    if (videoId) {
        if (videoId.match('/watch')) {
            videoId = getParameterByName('v', videoId);
        }
        console.log(videoId);
        canonicalHref = location.protocol + '//' + location.host + location.pathname + '?video=' + encodeURIComponent(videoId);
        analyzeNewVideo(videoId);
    } else {
        canonicalHref = location.protocol + '//' + location.host + location.pathname;
    }
    setCannonicalUrl(canonicalHref);
}

function setCannonicalUrl(canonicalHref) {
    var link = document.head.querySelector('[rel=canonical]');
    if (link) {
        link.setAttribute('href', canonicalHref);
    } else {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        link.setAttribute('href', canonicalHref);
        document.head.appendChild(link);
    }
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

$('#form-vid-search').on('submit', function (e) {
    e.preventDefault();
    var q = $('#q').val();
    $('#vids-results').empty().append('<div class="loader"></div>')
    $.ajax({
        dataType: "json",
        cache: true,
        url: window.appConf.apiUrl + '/yt/search?q=' + encodeURIComponent(q),
        success: handleSearchDone,
        error: function () { alert('Unable to search videos'); }
    });

    function handleSearchDone(data) {
        const frag = document.createDocumentFragment();
        data.items.filter(function (item) {
            return item.id.kind === 'youtube#video';
        }).forEach(function (item) {
            var vid = item.snippet;
            var el = vidHtml(vid, item.id.videoId);
            frag.appendChild(el);
        });
        $('#vids-results').empty();
        $('#vids-results').append(frag);
    }

    function vidHtml(vid, id) {
        var parent = document.createElement('article');
        var thumbC = document.createElement('figure');
        var contentC = document.createElement('section');
        var img = document.createElement('img');
        var title = document.createElement('h5');
        var description = document.createElement('p');
        var channel = document.createElement('small');
        var channelTitle = document.createElement('a');
        parent.setAttribute('class', 'media');
        parent.setAttribute('data-state', JSON.stringify(Object.assign(vid, { id })));
        thumbC.setAttribute('class', 'media-left');
        contentC.setAttribute('class', 'media-body');
        title.setAttribute('class', 'media-heading');
        channel.setAttribute('title', 'Channel');
        description.setAttribute('title', 'Description');
        title.setAttribute('title', 'Title');
        img.setAttribute('alt', 'Video thumbnail');
        channelTitle.innerText = vid.channelTitle;
        channelTitle.href = 'https://www.youtube.com/channel/' + vid.channelId;
        channelTitle.target = '_blank'
        img.src = vid.thumbnails.default.url;
        title.innerText = vid.title;
        description.innerText = vid.description;
        parent.appendChild(thumbC);
        thumbC.appendChild(img);
        parent.appendChild(contentC);
        contentC.appendChild(title);
        contentC.appendChild(description);
        contentC.appendChild(channel);
        channel.appendChild(document.createTextNode('by '));
        channel.appendChild(channelTitle);
        return parent;
    }

});

$('#vids-results').on('click', 'img, .media-heading', function (e) {
    var el = $(e.target).closest('article');
    var json = el.attr('data-state');
    var state = JSON.parse(json);
    var videoId = state.id;
    console.log(state);
    analyzeNewVideo(videoId);
    loadUrlParams(videoId);
    if (window.history) {
        console.log('push state');
        window.history.pushState({ videoId: videoId },
            appConf.siteTitle + ' ' + state.title,
            '/?video=' + encodeURIComponent(videoId));
    }
});

function analyzeNewVideo(videoId) {
    $('#create-comment').attr('data-id', videoId);
    $('#ytb-video').attr('src', 'https://www.youtube.com/embed/' + videoId);
    newComment();
    $('html, body').animate({
        scrollTop: $("#create-comment").offset().top - 70
    }, 200);
}

function newComment() {
    $('#comment-loader').show();
    $('#comment').hide();

    var id = $('#create-comment').attr('data-id');
    console.log(id);
    $.when($.ajax({
        dataType: "json",
        url: 'https://randomuser.me/api/',
        cache: false,
    }), $.ajax({
        dataType: "json",
        cache: true,
        url: window.appConf.apiUrl + '/ml/text/comment-words/' + id,
    })).then(function (rndUserReq, commentsReq) {
        var comments = commentsReq[0].map(c => createWords(c));
        var markov = new MarkovTextGenerator();
        comments.forEach(c => markov.markovTrain(c));
        var generatedComment = markov.markovMakeSentence(5);
        var rndUser = rndUserReq[0];
        console.log(rndUser, generatedComment);

        $('#time-ago').text(Math.floor(Math.random() * 23 + 1));
        $('#comment-thumb').attr('src', rndUser.results[0].picture.medium)
        $('#comment-username').text(rndUser.results[0].login.username)
        $('#like-amount').text(Math.floor(Math.pow(Math.random() * 10, 3)));
        $('#n-replies').text(Math.floor(Math.pow(Math.random() * 3, 3)) + 1);
        $('#comment-text').text(generatedComment);

        $('#comment-loader').hide();
        $('#comment').show();
        $('#new-comment').show();
        $('#comment-msg').hide();

    }).catch(function (err1, err2) {
        console.error(err1, err2);
        try {
            if (JSON.parse(err1.responseText).errors[0].reason === 'commentsDisabled') {
                $('#comment-msg').html('<div class="alert alert-warning">Comments \
                    are disabled on this video.<br>Please try another video.</div>');
                $('#comment-msg').show();
                $('#comment-loader').hide();
                $('#new-comment').hide();
                $('#comment').hide();
                return;
            }
        } catch (err) { }
        alert('Unable to generate fake comment.');
    });
}

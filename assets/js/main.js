

$('#form-vid-search').on('submit', function (e) {
    e.preventDefault();
    var q = $('#q').val();
    $('#vids-results').empty().append('<div class="loader"></div>')
    $.ajax({
        dataType: "json",
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
        img.setAttribute('title', 'Video thumbnail');
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
    var vid = state.vid;
    var id = state.id;
    $('#create-comment').attr('state', json);
    $('#ytb-video').attr('src', 'https://www.youtube.com/embed/' + id);
    newComment();
    $('html, body').animate({
        scrollTop: $("#create-comment").offset().top - 70
    }, 200);
});

function newComment() {
    $('#comment-loader').show();
    $('#comment').hide();

    var state = JSON.parse($('#create-comment').attr('state'));
    var vid = state.vid;
    var id = state.id;
    $.when($.ajax({
        dataType: "json",
        url: 'https://randomuser.me/api/',
        cache: false,
    }), $.ajax({
        dataType: "text",
        cache: false,
        url: window.appConf.apiUrl + '/ml/text/markov-yt-comments/' + id,
    })).then(function (rndUserReq, generatedCommentReq) {
        var rndUser = rndUserReq[0];
        var generatedComment = generatedCommentReq[0];
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
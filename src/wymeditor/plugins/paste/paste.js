$('.editor').bind('wymeditor:iframe_loaded', function () {
  var wymeditor = $.wymeditors($(this).data('wym_index')),
    $wym_body = $(wymeditor._doc.body),
    savedSelection = false,
    $paste_textarea = $([]);

  function restore() {
    $paste_textarea.remove();
    if (savedSelection) {
      rangy.restoreSelection(savedSelection);
      rangy.removeMarkers(savedSelection);
      savedSelection = false;
    }
  }

  function do_paste() {
    setTimeout(function () {
      if (!$paste_textarea.length) {
        return;
      }
      var contents = $paste_textarea.val();
      wymeditor.paste(contents);
      restore();
    }, 5);
  }

  function prepare_paste() {
    var iframe = wymeditor._iframe,
      win = (iframe.contentDocument && iframe.contentDocument.defaultView) ?
        iframe.contentDocument.defaultView : iframe.contentWindow;

    savedSelection = rangy.saveSelection(win);

    $paste_textarea = $('<textarea class="wym_paste"></textarea>', wymeditor._doc);

    $wym_body.append($paste_textarea);

    $paste_textarea.css({
      position : 'absolute',
      left : -10000,
      top : -10,
      width : 1,
      height : 1,
      overflow : 'hidden'
    });

    $paste_textarea.focus();
  }

  function which_OS() {
    var OS = false;
    if (navigator.appVersion.indexOf("Win") !== -1) {
      OS = "Windows";
    }
    if (navigator.appVersion.indexOf("Mac") !== -1) {
      OS = "Mac";
    }
    if (navigator.appVersion.indexOf("X11") !== -1) {
      OS = "UNIX";
    }
    if (navigator.appVersion.indexOf("Linux") !== -1) {
      OS = "Linux";
    }
    return OS;
  }

  function keydown_could_be_paste(e) {
    if (
      (
        (which_OS() === 'Mac' ? e.metaKey : e.ctrlKey) && e.keyCode === 86
      ) || (e.shiftKey && e.keyCode === 45)
    ) {
      return true;
    } else {
      return false;
    }
  }

  function paste(e) {
    var evt = e.originalEvent || e;

    if (evt.clipboardData && evt.clipboardData.getData && /text\/plain/.test(evt.clipboardData.types)) {

      e.preventDefault();

      // in case we thought this browser didn't support clipboardData
      restore();

      return evt.clipboardData.getData('text/plain');

    // Everything else - empty editdiv and allow browser to paste content into it, then cleanup
    } else {
      do_paste();
    }
  }

  $wym_body.bind('keydown', function (e) {
    // Here's the tricky part, we only want to run this on browsers that don't
    // support clipboardData
    if ($.browser.webkit || $.browser.msie) {
      return;
    }

    if (keydown_could_be_paste(e)) {
      prepare_paste();
    }
  });

  $wym_body.bind('paste', function (e) {
    var results = paste(e);
    if (results) {
      wymeditor.paste(results);
    }
  });
});

// override wym's default. copied and modified. might push this back to them
WYMeditor.editor.prototype.paste = function (str) {
  var html = '',
    paragraphs,
    i,
    l;

  // Split string into paragraphs by two or more newlines
  paragraphs = str.split(new RegExp(this._newLine + '{2,}', 'g'));

  if (paragraphs.length > 1) {
    // Build html
    for (i = 0, l = paragraphs.length; i < l; i += 1) {
      html += '<p>' +
        (paragraphs[i].split(this._newLine).join('<br />')) +
        '</p>';
    }

    this.insertBlock(html);
  } else {
    this.insertText(paragraphs[0]);
  }

  // And remove br (if editor was empty)
  jQuery('body > br', this._doc).remove();
};

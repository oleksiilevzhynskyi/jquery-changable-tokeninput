(function ($) {
  var TokenInput = function (input, options) {
    var tagSet = options.possibleTags || [],
        existingTags = options.existingTags || [],
        tagList = {},
        $input = $(input),
        $target = options.target || $input,
        $tokenInput,
        $tokenDiv,
        $tokenUl,
        currentTag,
        hintList = null;

    var TEMPLATES = {
      'mainDiv': Template("<div class='token-input-wrapper'><ul class='token-input-wrapper-list'><li class='token-li-input'><input /></li></ul></div>"),
      'liTemplate': Template("<li><span>${tag}</span><span class='delete-tag'></span></li>")
    };

    var populate = function () {
      var tags = existingTags;
      if (tags) {
        for (var i in tags) {
          addTag(tags[i]);
        }
      }
    };

    var bindings = function () {
      $tokenInput.on('keydown.token-input', function (e) {
        var tag = $(this).val();
        if(e.keyCode === 9 || e.keyCode === 188){
          addTag(tag);
          e.preventDefault();
        }
        if (e.keyCode === 13 && tag.length) {
          e.preventDefault();
        }
      });
      $tokenInput.on('keyup.token-input', showMatch);
      $tokenInput.on('keyup.token-input', deselectTags);
      $tokenInput.on('keydown.token-input', tagsNavigator);
      $tokenDiv.on('click.token-input', 'span.delete-tag', removeTag);
      hintList.on('item::choose', addTag);
    };

    var findMatch = function (tag) {
      var matchTags = [],
          matched_tag,
          regexp;
      if ( !$.trim(tag).length ) { return []; }
      for (var i = 0, max = tagSet.length; i< max; i++) {
        regexp = new RegExp(Escape.regexp(tag));
        if ( tagSet[i].match(regexp) ) {
          matched_tag = Escape.html( tagSet[i] ).replace(tag, "<em>" + tag + "</em>");
          matchTags.push(matched_tag);
        }
      }
      return matchTags;
    };

    var removeTag = function (e) {
      var tag = $(e.target).prev().text();
      delete tagList[tag];
      tagSet.push(tag);
      $(e.target).parent().remove();
      fillHiddenInput();
    };

    var addTag = function (tagString) {
      var tag = $.trim( tagString );
      if (tag.length && !tagList[tag]) {
        tagList[tag] = true;
        $tokenInput.parent().before( TEMPLATES["liTemplate"]({"tag": tag}) );
        $tokenInput.val('');
        fillHiddenInput();
        tagSet.splice(tagSet.indexOf(tag), 1);
      }
    };

    var showMatch = function (options) {
      var tag = $tokenInput.val(),
          matchTags = findMatch(tag),
          defaults = { force: false };
      options = $.extend(defaults, options);
      if ( currentTag !== tag || options.force ) {
        hintList.showList(matchTags);
      }
      currentTag = tag;
    };

    var tagsNavigator = function (e) {
      var $matchTagsList,
          $active,
          $prevItem;
      if ( !hintList.isShow() ){
        defaultNavigation(e);
      }
    };

    var defaultNavigation = function (e) {
      var $prevTag = $tokenInput.parent().prev();
      switch (e.keyCode) {
        case 8:
          if ( !$prevTag.length || $tokenInput.val() ) { return; }
          if ( $prevTag.hasClass('selected') ) {
            $prevTag.find('span').trigger('click.token-input');
          } else {
            $prevTag.addClass('selected');
          }
          break;
        case 40:
          if ( !$tokenDiv.find('.token-input-match-tags-list').length ) {
            showMatch({force: true});
          }
      }
    };

    var deselectTags = function () {
      if ( $tokenInput.val() ) {
        $tokenInput.parent().prev().removeClass('selected');
      }
    };

    var fillHiddenInput = function () {
      var tags = [];
      for (var key in tagList) {
        if ( tagList.hasOwnProperty(key) ) {
          tags.push(key);
        }
      }
      $target.val(tags.join(','));
    };

    (function () {
      $input.after(TEMPLATES['mainDiv']());
      $tokenDiv = $input.next();
      $tokenInput = $tokenDiv.find('input');
      $tokenUl = $tokenDiv.find('ul');
      $input.hide();
      hintList = new HintList($tokenInput, $tokenDiv);
      populate();
      bindings();
    })();
  };

  var HintList = function ($tokenInput, $tokenDiv) {
    var show = false,
        queue = {};

    var isShow = function () {
      return this.show;
    };

    var showList = function (matchTags) {
      $tokenDiv.find('.token-input-match-tags-list').remove();
      if (matchTags.length) {
        show = true;
        $tokenDiv.append("<ul class='token-input-match-tags-list'><li>" + matchTags.join('</li><li>') + "</li></ul>");
      } else {
        show = false;
      }
    };

    var hideList = function () {
      $tokenDiv.find('.token-input-match-tags-list').remove();
    };

    var hintListNavigator = function (e) {
      $matchTagsList = $tokenDiv.find('.token-input-match-tags-list');
      if ( !$matchTagsList.length ) {
        return;
      }
      switch (e.keyCode) {
        case 40:
          $active = $matchTagsList.find('.selected');
          $active.removeClass('selected');
          if ($active.next().length) {
            $active.next().addClass('selected');
          } else {
            $matchTagsList.find('li:first').addClass('selected');
          }
          break;
        case 38:
          $active = $matchTagsList.find('.selected');
          $active.removeClass('selected');
          if ($active.prev().length) {
            $active.prev().addClass('selected');
          } else {
            $matchTagsList.find('li:last').addClass('selected');
          }
          break;
        case 13:
          $active = $matchTagsList.find('.selected');
          trigger("item::choose", $active.text());
          e.preventDefault();
          break;
        case 27:
          hidePopup();
          break;
      }
    };

    var selectTagByClick = function (e) {
      trigger("item::choose", $(e.target).text());
      hideList();
    };

    var on = function (event, callback) {
      if (!queue[event]) { queue[event] = []; }
      queue[event].push(callback);
    };

    var trigger = function (event, data) {
      if (queue[event]) {
        for (var i = 0, max = queue[event].length; i < max; i++) {
          queue[event][i].call(null, data);
        }
      }
    };

    (function initialize () {
      $tokenInput.on('keydown.token-input-list', hintListNavigator);
      $tokenDiv.on('click.token-input-list', '.token-input-match-tags-list li', selectTagByClick);
      $('body').on('click.token-input-list', function (e) {
        if ( isShow() && !$(e.target).closest('.token-input-match-tags-list').length ){
          hideList();
        }
      });
    })();

    return {
      on: on,
      isShow: isShow,
      showList: showList
    };
  };

  var Escape = {
    html: function (text) {
      return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    },
    regexp: function (text) {
      return text.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
    }
  };

  var Template = function (markup) {
    return function (variables) {
      var regexp,
          body = markup;
      for (var key in variables) {
        if (variables.hasOwnProperty(key)) {
          regexp = new RegExp("\\${" + key + "}", 'gmi');
          body = body.replace(regexp, variables[key]);
        }
      }
      return body;
    };
  };

  $.fn.tokenInput = function (options) {
    var defaults = {
      possibleTags: ["ruby", "rails", "js"],
      existingTags: []
    };

    options = $.extend(defaults, options);

    new TokenInput(this, options);
  };
})(jQuery);

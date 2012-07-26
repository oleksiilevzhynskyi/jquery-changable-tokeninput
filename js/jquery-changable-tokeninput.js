(function ($) {
  var TokenInput = function (input, options) {
    this.tagList = {};
    this.tagSet = options.possibleTags || [];
    this.existingTags = options.existingTags || [];
    this.$input = $(input),
    this.$target = options.target || this.$input;

    this.TEMPLATES = {
      'mainDiv': Template("<div class='token-input-wrapper'><ul class='token-input-wrapper-list'><li class='token-li-input'><input /></li></ul></div>"),
      'liTemplate': Template("<li><span>${tag}</span><span class='delete-tag'></span></li>")
    };

    var initialize = function () {
      this.$input.after(this.TEMPLATES['mainDiv']());
      this.$tokenDiv = this.$input.next();
      this.$tokenInput = this.$tokenDiv.find('input');
      this.$tokenUl = this.$tokenDiv.find('ul');
      this.$input.hide();
      this.populate();
      this.bindings();
    };
    initialize.call(this);
  };

  TokenInput.prototype = {
    populate: function () {
      var tags = this.existingTags;
      if (tags) {
        for (var i in tags) {
          this.addTag(tags[i]);
        }
      }
    },
    bindings: function () {
      var that = this;
      this.$tokenInput.on('keydown.token-input', function (e) {
        var tag = $(this).val();
        if(e.keyCode === 9 || e.keyCode === 188){
          that.addTag.call(that, tag);
          e.preventDefault();
        }
        if (e.keyCode === 13 && tag.length) {
          e.preventDefault();
        }
      });
      this.$tokenInput.on('keyup.token-input', function () { that.showMatch.apply(that, arguments); });
      this.$tokenInput.on('keyup.token-input', function () { that.deselectTags.apply(that, arguments); });
      this.$tokenInput.on('keydown.token-input', function () { that.tagsNavigator.apply(that, arguments); });
      this.$tokenDiv.on('click.token-input', 'span.delete-tag', function () { that.removeTag.apply(that, arguments); });
      this.$tokenDiv.on('click.token-input', '.token-input-match-tags-list li', function () { that.selectTagByClick.apply(that, arguments); });
      $('body').on('click', function (e) {
        if ( !$(e.target).closest('.token-input-match-tags-list').length ){
          that.hidePopup();
        }
      });
    },
    showPopup: function (matchTags) {
      this.$tokenDiv.find('.token-input-match-tags-list').remove();
      if (matchTags.length) {
        this.$tokenDiv.append("<ul class='token-input-match-tags-list'><li>" + matchTags.join('</li><li>') + "</li></ul>");
      }
      this.initSelector();
    },
    selectTagByClick: function (e) {
       this.addTag($(e.target).text());
       this.hidePopup();
    },
    hidePopup: function () {
      this.$tokenDiv.find('.token-input-match-tags-list').remove();
    },
    findMatch: function (tag) {
      var matchTags = [],
          matched_tag,
          regexp;
      if ( !$.trim(tag).length ) { return []; }
      for (var i = 0, max = this.tagSet.length; i< max; i++) {
        regexp = new RegExp(Escape.regexp(tag))
        if ( this.tagSet[i].match(regexp) ) {
          matched_tag = Escape.html( this.tagSet[i] ).replace(tag, "<em>" + tag + "</em>");
          matchTags.push(matched_tag);
        }
      }
      return matchTags;
    },
    removeTag: function (e) {
      var tag = $(e.target).prev().text();
      delete this.tagList[tag]
      this.tagSet.push(tag);
      $(e.target).parent().remove();
      this.fillHiddenInput();
    },
    addTag: function (tagString) {
      var tag = $.trim( tagString );
      if (tag.length && !this.tagList[tag]) {
        this.tagList[tag] = true;
        this.$tokenUl.find('.token-li-input').before( this.TEMPLATES["liTemplate"]({"tag": tag}) );
        this.$tokenUl.find('.token-li-input input').val('');
        this.fillHiddenInput()
        this.tagSet.splice(this.tagSet.indexOf(tag), 1)
      }
    },
    showMatch: function (options) {
      var tag = this.$tokenInput.val(),
          matchTags = this.findMatch(tag),
          defaults = { force: false };
      options = $.extend(defaults, options);
      if ( this.currentTag !== tag || options.force ) {
        this.showPopup(matchTags);
      }
      this.currentTag = tag;
    },
    initSelector: function () {
      this.$tokenDiv.find('.token-input-match-tags-list li:first').addClass('selected');
    },
    tagsNavigator: function (e) {
      var $matchTagsList,
          $active,
          $prevItem;

      if (!this.hintListNavigation(e)){
        this.defaultNavigation(e)
      }
    },
    defaultNavigation: function (e) {
      var $prevTag = this.$tokenInput.parent().prev();
      switch (e.keyCode) {
        case 8:
          if ( !$prevTag.length || this.$tokenInput.val() ) { return true }
          if ( $prevTag.hasClass('selected') ) {
            $prevTag.find('span').trigger('click.token-input');
          } else {
            $prevTag.addClass('selected');
          }
          break;
        case 40:
          if ( !this.$tokenDiv.find('.token-input-match-tags-list').length ) {
            this.showMatch({force: true});
          }
      }
    },
    hintListNavigation: function (e) {
        $matchTagsList = this.$tokenDiv.find('.token-input-match-tags-list');
        if ( !$matchTagsList.length ) {
          return false;
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
            this.addTag($active.text());
            e.preventDefault();
            break;
          case 27:
            this.hidePopup();
            break;
          default:
            return false;
        }
        return true;
    },
    deselectTags: function () {
      if ( this.$tokenInput.val() ) {
        this.$tokenInput.parent().prev().removeClass('selected');
      }
    },
    fillHiddenInput: function () {
      var tags = [];

      for (key in this.tagList) {
        if ( this.tagList.hasOwnProperty(key) ) {
          tags.push(key);
        }
      }
      this.$target.val(tags.join(','));
    },
  };

  var Escape = {
    html: function (text) {
      return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    },
    regexp: function (text) {
      return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
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

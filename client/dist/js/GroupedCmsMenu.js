const joinUrlPaths = (...urlPaths) => {
  // Just return a blank string if there's no paths passed in
  if (!urlPaths.length) {
    return '';
  }

  // Combine paths with a single '/' between them.
  let result = urlPaths.shift();
  // eslint-disable-next-line no-restricted-syntax
  for (const path of urlPaths) {
    result = `${result.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }
  return result;
};

jQuery.entwine('ss', ($) => {
  $('.cms-panel.cms-menu').entwine({
    togglePanel: function(doExpand, silent, doSaveState) {
      //apply or unapply the child formatting, should only apply to cms-menu__list when the current collapsed panal is the cms menu.
      $('.cms-menu__list').children('li').each(function(){
        if (doExpand) { //expand
          $(this).children('ul').each(function() {
            if ($(this).data('collapse')) {
              $(this).removeData('collapse');
              $(this).addClass('collapse');
            }
          });
        } else {  //collapse
          $(this).children('ul').each(function() {
            $(this).hasClass('collapse');
            $(this).removeClass('collapse');
            $(this).data('collapse', true);
          });
        }
      });

      this._super(doExpand, silent, doSaveState);
    },
  });


  $('.cms-menu__list').entwine({
    fromContainingPanel: {
      ontoggle: function(e){
        this.toggleClass('collapsed', $(e.target).hasClass('collapsed'));

        // Trigger synthetic resize event. Avoid native window.resize event
        // since it causes other behaviour which should be reserved for actual window dimension changes.
        $('.cms-container').trigger('windowresize');

        //If panel is closing
        if (this.hasClass('collapsed')) this.find('li.children.opened').removeClass('opened');

        //If panel is opening
        if(!this.hasClass('collapsed')) {
          $('.toggle-children.opened').closest('li').addClass('opened');
        }
      }
    },
  });

  $('.cms-menu__list li').entwine({
    onmatch: function() {
      if(this.find('ul').length) {
        this.find('a:first').append('<span class="toggle-children"><span class="toggle-children-icon"></span></span>');
      }
      this._super();
    },
    onunmatch: function() {
      this._super();
    },
    toggle: function() {
      this[this.hasClass('opened') ? 'close' : 'open']();
    },
    /**
     * "Open" is just a visual state, and unrelated to "current".
     * More than one item can be open at the same time.
     */
    open: function() {
      var parent = this.getMenuItem();
      if(parent) parent.open();
      if( this.find('li.clone') ) {
        this.find('li.clone').remove();
      }
      this.addClass('opened').find('ul').show();
      this.find('.toggle-children').addClass('opened');
    },
    close: function() {
      this.removeClass('opened').find('ul').hide();
      this.find('.toggle-children').removeClass('opened');
    },
    select: function() {
      var parent = this.getMenuItem();
      this.addClass('current').open();

      // Remove "current" class from all siblings and their children
      this.siblings().removeClass('current').close();
      this.siblings().find('li').removeClass('current');
      if(parent) {
        var parentSiblings = parent.siblings();
        parent.addClass('current');
        parentSiblings.removeClass('current').close();
        parentSiblings.find('li').removeClass('current').close();
      }

      this.getMenu().updateItems();

      this.trigger('select');
    }
  });

  /**
   * Both primary and secondary nav.
   */
  $('.cms-menu__list li a').entwine({
    onclick: function(e) {
      // Only catch left clicks, in order to allow opening in tabs.
      // Ignore external links, fallback to standard link behaviour
      var isExternal = $.path.isExternal(this.attr('href'));
      if(e.which > 1 || isExternal) return;

      // if the developer has this to open in a new window, handle
      // that
      if(this.attr('target') == "_blank") {
        return;
      }

      e.preventDefault();

      var item = this.getMenuItem();

      var url = this.attr('href');
      if(!isExternal) url = joinUrlPaths($('base').attr('href'), url);

      var children = item.find('li');
      if(children.length) {
        children.first().find('a').click();
      } else {
        document.location.href = url;
      }

      item.select();
    }
  });

  $('.cms-menu__list li .toggle-children').entwine({
    onclick: function(e) {
      var li = this.closest('li');
      li.toggle();
      return false; // prevent wrapping link event to fire
    }
  });
});

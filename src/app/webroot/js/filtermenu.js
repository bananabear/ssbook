if (typeof SS == 'undefined') {
	SS = {};
}

(function ($) {

SS.FilterMenu = function(name, hiddenForm, selector) {
	this.selector = selector;
	this.hiddenForm = hiddenForm;
	this.name = name;
	this.sortDir = false;
};

$.extend(SS.FilterMenu.prototype, {

	init: function(filters, filtersSelected) {
		var self = this;
		/*var menu = [
			{'Sort A-Z': {
				onclick: function(menuItem, menu) {
					self.sortDir = 'asc';
					self.applyFilter(menu);
				},
				icon: SS.Cake.base+'/img/icons/sort-ascend.png'}},
			{'Sort Z-A': {
				onclick: function(menuItem, menu) {
					self.sortDir = 'desc';
					self.applyFilter(menu);
				},
				icon: SS.Cake.base+'/img/icons/sort-descend.png'}},
			$.contextMenu.separator
		];*/
		var menu = [];
		$.each(filters, function(key, val) {
			var obj = {};
			obj[val] = {
				onclick: function(menuItem) {
					return self.putCheckMark(menuItem, val);
				}
			};
			if (filtersSelected[val]) {
				obj[val]['className'] = 'item-checked';
				obj[val]['data'] = {'filter':val};
			}
			menu.push(obj);
		});
		menu.push($.contextMenu.separator);
		menu.push({
			'<b>Apply</b>' : function(menuItem, menu) {
				self.applyFilter(menu);
			}
		});
		$(self.selector).contextMenu(menu, {
			theme: 'vista',
			hideCallback: function() {
				self.onHide(this);
			},
			bindAction: 'click'
		});
	},

	applyFilter: function(cmenu) {
		cmenu.hide();
	},

	onHide: function(cmenu) {
		if (!cmenu.menu) {
			return false;
		}

		var filters = [];
		$.each(cmenu.menu.find('.item-checked'), function () {
			var data = $(this).data('filter');
			if (data) {
				filters.push(data);
			}
		});
		/*
		if (this.sortDir) {
			$(this.hiddenForm).find('[name=sort]').val(this.name+','+this.sortDir);
		}
		*/
	       var inputs = $(this.hiddenForm).find('[name='+this.name+']');
	       var filtString = filters.join(',');
	       if (inputs.length > 0) {
		       inputs.val(filtString);
	       } else {
		       $(this.hiddenForm).append($('<input type="hidden" name="'+this.name+'" value="'+filtString+'" />'));
	       }
	       $(this.hiddenForm).submit();
	},

	putCheckMark: function (menuItem, filter) {
		$(menuItem).toggleClass('item-checked').data('filter', filter);
		return false;
	}
});

}(jQuery));